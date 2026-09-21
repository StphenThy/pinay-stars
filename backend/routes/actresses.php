<?php
/**
 * Pinay Stars API - actress records
 *
 * GET list/search/one, POST create, PUT update (admin), DELETE (admin).
 *
 * Included by pinay_actresses.php after the session has been resolved, so
 * $mysqli, $account, $isAdmin, $isUser, $method, $action and the table names are
 * all in scope. Every matching branch ends the request with respond() or fail().
 */

// ------------------------------------------------------------------ READ
if ($method === 'GET') {
    $id = record_id();
    // Viewers never see pending submissions or drafts; admins see everything.
    $visibility = $isAdmin ? '' : "status NOT IN ('review', 'draft')";

    if ($id > 0) {
        $where = 'id = ?' . ($visibility ? " AND $visibility" : '');
        $stmt  = $mysqli->prepare("SELECT * FROM `$TABLE` WHERE $where LIMIT 1");
        $stmt->bind_param('i', $id);
        if (!$stmt || !$stmt->execute()) {
            fail($DEBUG ? $mysqli->error : 'Could not read records.', 500);
        }
        respond($stmt->get_result()->fetch_assoc());
    }

    // List / search. Without ?limit the whole result comes back as a plain array (the
    // original contract). With ?limit=N[&offset=M] it comes back as a page:
    //   {items: [...], total: 123, offset: M, limit: N}
    $conditions = [];
    $types      = '';
    $params     = [];
    if ($visibility) { $conditions[] = $visibility; }
    if (isset($_GET['name']) && trim($_GET['name']) !== '') {
        $like         = '%' . trim($_GET['name']) . '%';
        $conditions[] = '(name LIKE ? OR stage_name LIKE ?)';
        $types       .= 'ss';
        $params[]     = $like;
        $params[]     = $like;
    }
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $paged  = isset($_GET['limit']) && ctype_digit((string) $_GET['limit']);
    $limit  = $paged ? max(1, min((int) $_GET['limit'], $PAGE_MAX)) : 0;
    $offset = $paged && isset($_GET['offset']) && ctype_digit((string) $_GET['offset']) ? (int) $_GET['offset'] : 0;

    $sql = "SELECT * FROM `$TABLE` $where ORDER BY name ASC" . ($paged ? ' LIMIT ? OFFSET ?' : '');
    $stmt = $mysqli->prepare($sql);
    if ($stmt && $paged) {
        $types   .= 'ii';
        $params[] = $limit;
        $params[] = $offset;
    }
    if ($stmt && $types !== '') { $stmt->bind_param($types, ...$params); }
    if (!$stmt || !$stmt->execute()) {
        fail($DEBUG ? $mysqli->error : 'Could not read records.', 500);
    }
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    if (!$paged) { respond($rows); }

    $count = $mysqli->prepare("SELECT COUNT(*) AS total FROM `$TABLE` $where");
    if ($count && strlen($types) > 2) {
        $countTypes  = substr($types, 0, -2);
        $countParams = array_slice($params, 0, -2);
        $count->bind_param($countTypes, ...$countParams);
    }
    $total = $count && $count->execute() ? (int) $count->get_result()->fetch_assoc()['total'] : count($rows) + $offset;
    respond(['items' => $rows, 'total' => $total, 'offset' => $offset, 'limit' => $limit]);
}

// ---------------------------------------------------------------- CREATE
if ($method === 'POST') {
    $body = json_body();
    if (empty(trim((string) (isset($body['name']) ? $body['name'] : '')))) {
        fail('The full legal name is required.', 422);
    }

    // Public submissions always wait for an admin, whatever status the client sent.
    if (!$isAdmin) {
        $body['status'] = 'review';
    }

    $body['age'] = age_from_birthday(isset($body['birthday']) ? $body['birthday'] : null);
    list($values, $types) = collect($body, $FIELDS, $STATUSES);

    // age is computed here, never taken from the client; submitted_by links a member to her suggestion
    $columns  = array_merge($FIELDS, ['age', 'submitted_by']);
    $values[] = $body['age'];
    $values[] = $isUser ? (int) $account['id'] : null;
    $types   .= 'ii';

    $names        = '`' . implode('`, `', $columns) . '`';
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));

    $stmt = $mysqli->prepare("INSERT INTO `$TABLE` ($names) VALUES ($placeholders)");
    if (!$stmt) {
        fail($DEBUG ? $mysqli->error : 'Could not prepare the record.', 500);
    }
    $stmt->bind_param($types, ...$values);
    if (!$stmt->execute()) {
        fail($DEBUG ? $stmt->error : 'Could not save the record.', 500);
    }

    $newId = $mysqli->insert_id;
    $read  = $mysqli->prepare("SELECT * FROM `$TABLE` WHERE id = ?");
    $read->bind_param('i', $newId);
    $read->execute();
    $created = $read->get_result()->fetch_assoc();

    if (!$isAdmin) {
        $who   = $isUser ? clean_text($account['display_name'], 40) : 'a visitor';
        $label = clean_text($created['stage_name'] ?: $created['name'], 80);
        notify_admins($mysqli, $NOTIFICATIONS_TABLE, $ADMIN_TABLE, 'info', "New suggestion from $who: \"$label\" is awaiting review", (int) $newId);
    }
    respond($created, 201);
}

// ---------------------------------------------------------------- UPDATE
if ($method === 'PUT') {
    require_admin($account, $isAdmin);
    $id = record_id();
    if ($id <= 0) {
        fail('A record id is required to update.', 422);
    }

    $body = json_body();
    if (empty(trim((string) (isset($body['name']) ? $body['name'] : '')))) {
        fail('The full legal name is required.', 422);
    }

    // Remember what it looked like so a review -> active change can notify the member who suggested her.
    $beforeStmt = $mysqli->prepare("SELECT status, submitted_by, stage_name, name FROM `$TABLE` WHERE id = ? LIMIT 1");
    $beforeStmt->bind_param('i', $id);
    $beforeStmt->execute();
    $before = $beforeStmt->get_result()->fetch_assoc();
    if (!$before) {
        fail('That record no longer exists.', 404);
    }

    $body['age'] = age_from_birthday(isset($body['birthday']) ? $body['birthday'] : null);
    list($values, $types) = collect($body, $FIELDS, $STATUSES);

    $assignments = [];
    foreach ($FIELDS as $field) {
        $assignments[] = "`$field` = ?";
    }
    $assignments[] = '`age` = ?';
    $values[]      = $body['age'];
    $types        .= 'i';

    $assignments[] = '`updated_at` = NOW()';

    $values[] = $id;
    $types   .= 'i';

    $sql  = "UPDATE `$TABLE` SET " . implode(', ', $assignments) . ' WHERE id = ?';
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        fail($DEBUG ? $mysqli->error : 'Could not prepare the update.', 500);
    }
    $stmt->bind_param($types, ...$values);
    if (!$stmt->execute()) {
        fail($DEBUG ? $stmt->error : 'Could not update the record.', 500);
    }

    $read = $mysqli->prepare("SELECT * FROM `$TABLE` WHERE id = ?");
    $read->bind_param('i', $id);
    $read->execute();
    $row = $read->get_result()->fetch_assoc();
    if (!$row) {
        fail('That record no longer exists.', 404);
    }

    if ($before['status'] === 'review' && $row['status'] !== 'review' && $before['submitted_by']) {
        $label = clean_text($row['stage_name'] ?: $row['name'], 80);
        notify($mysqli, $NOTIFICATIONS_TABLE, 'user', (int) $before['submitted_by'], 'success', "Your suggestion \"$label\" was approved and is now live in the directory", (int) $id);
    }
    respond($row);
}

// ---------------------------------------------------------------- DELETE
if ($method === 'DELETE') {
    require_admin($account, $isAdmin);
    $id = record_id();
    if ($id <= 0) {
        fail('A record id is required to delete.', 422);
    }

    $beforeStmt = $mysqli->prepare("SELECT status, submitted_by, stage_name, name FROM `$TABLE` WHERE id = ? LIMIT 1");
    $beforeStmt->bind_param('i', $id);
    $beforeStmt->execute();
    $before = $beforeStmt->get_result()->fetch_assoc();

    $stmt = $mysqli->prepare("DELETE FROM `$TABLE` WHERE id = ?");
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        fail($DEBUG ? $stmt->error : 'Could not delete the record.', 500);
    }
    if ($stmt->affected_rows === 0) {
        fail('That record no longer exists.', 404);
    }

    if ($before && $before['status'] === 'review' && $before['submitted_by']) {
        $label = clean_text($before['stage_name'] ?: $before['name'], 80);
        notify($mysqli, $NOTIFICATIONS_TABLE, 'user', (int) $before['submitted_by'], 'error', "Your suggestion \"$label\" was not approved by the administrators");
    }
    respond(['deleted' => $id]);
}

fail('Unsupported request method.', 405);

<?php
/**
 * Pinay Stars API - favorites, notifications and reviews
 *
 * Data helpers shared by the account, notification and review routes.
 */

function favorite_ids($mysqli, $table, $account) {
    $stmt = $mysqli->prepare("SELECT actress_id FROM `$table` WHERE role = ? AND account_id = ? ORDER BY created_at ASC");
    $stmt->bind_param('si', $account['role'], $account['id']);
    $stmt->execute();
    $ids = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) { $ids[] = (int) $row['actress_id']; }
    return $ids;
}

function notify($mysqli, $table, $role, $accountId, $tone, $message, $actressId = null) {
    $stmt = $mysqli->prepare("INSERT INTO `$table` (role, account_id, tone, message, actress_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('sissi', $role, $accountId, $tone, $message, $actressId);
    $stmt->execute();
}

function notify_admins($mysqli, $table, $adminTable, $tone, $message, $actressId = null) {
    $result = $mysqli->query("SELECT id FROM `$adminTable`");
    foreach ($result->fetch_all(MYSQLI_ASSOC) as $row) {
        notify($mysqli, $table, 'admin', (int) $row['id'], $tone, $message, $actressId);
    }
}

function fetch_notifications($mysqli, $table, $account, $limit) {
    $stmt = $mysqli->prepare("SELECT id, tone, message, actress_id, is_read, created_at FROM `$table` WHERE role = ? AND account_id = ? ORDER BY id DESC LIMIT ?");
    $stmt->bind_param('sii', $account['role'], $account['id'], $limit);
    $stmt->execute();
    $rows = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
        $rows[] = [
            'id'         => (int) $row['id'],
            'tone'       => $row['tone'],
            'message'    => $row['message'],
            'actress_id' => $row['actress_id'] === null ? null : (int) $row['actress_id'],
            'read'       => (bool) $row['is_read'],
            'created_at' => $row['created_at'],
        ];
    }
    return $rows;
}

/** Recomputes the cached average/count on the actress row and returns [average, count]. */
function sync_rating($mysqli, $table, $reviewsTable, $actressId) {
    $stmt = $mysqli->prepare("SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total FROM `$reviewsTable` WHERE actress_id = ?");
    $stmt->bind_param('i', $actressId);
    $stmt->execute();
    $agg     = $stmt->get_result()->fetch_assoc();
    $average = round((float) $agg['avg_rating'], 2);
    $count   = (int) $agg['total'];
    $upd = $mysqli->prepare("UPDATE `$table` SET rating = ?, reviews_count = ? WHERE id = ?");
    $upd->bind_param('dii', $average, $count, $actressId);
    $upd->execute();
    return [$average, $count];
}

function review_payload($mysqli, $table, $reviewsTable, $userTable, $actressId, $account) {
    list($average, $count) = sync_rating($mysqli, $table, $reviewsTable, $actressId);
    $stmt = $mysqli->prepare(
        "SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at, r.user_id, u.display_name, u.avatar_url
         FROM `$reviewsTable` r LEFT JOIN `$userTable` u ON u.id = r.user_id
         WHERE r.actress_id = ? ORDER BY r.updated_at DESC LIMIT 100"
    );
    $stmt->bind_param('i', $actressId);
    $stmt->execute();
    $reviews = [];
    $mine    = null;
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
        $item = [
            'id'         => (int) $row['id'],
            'rating'     => (int) $row['rating'],
            'comment'    => $row['comment'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'user'       => [
                'id'           => (int) $row['user_id'],
                'display_name' => $row['display_name'] ?: 'Former member',
                'avatar_url'   => $row['avatar_url'],
            ],
        ];
        if ($account && $account['role'] === 'user' && (int) $row['user_id'] === (int) $account['id']) { $mine = $item; }
        $reviews[] = $item;
    }
    return ['actress_id' => $actressId, 'average' => $average, 'count' => $count, 'reviews' => $reviews, 'mine' => $mine];
}

<?php
/**
 * Pinay Stars API - account actions
 *
 * register, login, me, logout, password, profile, favorites and mine.
 *
 * Included by pinay_actresses.php after the session has been resolved, so
 * $mysqli, $account, $isAdmin, $isUser, $method, $action and the table names are
 * all in scope. Every matching branch ends the request with respond() or fail().
 */

if ($action === 'register' && $method === 'POST') {
    $body     = json_body();
    $username = isset($body['username']) ? strtolower(trim((string) $body['username'])) : '';
    $password = isset($body['password']) ? (string) $body['password'] : '';
    $display  = isset($body['display_name']) ? trim((string) $body['display_name']) : '';

    if (!preg_match('/^[a-z0-9_.]{3,30}$/', $username)) {
        fail('Username must be 3-30 characters: letters, numbers, dots or underscores.', 422);
    }
    if (strlen($password) < 8) { fail('Password must be at least 8 characters.', 422); }
    if ($display === '') { $display = $username; }
    if (account_by_username($mysqli, 'admin', $username) || account_by_username($mysqli, 'user', $username)) {
        fail('That username is already taken.', 409);
    }
    $ip = client_ip();
    if (attempts_since($mysqli, $ATTEMPTS_TABLE, 'register', 'ip', $ip, 3600) >= $REGISTER_MAX_PER_IP) { too_many(3600); }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $mysqli->prepare("INSERT INTO `$USER_TABLE` (username, password_hash, display_name) VALUES (?, ?, ?)");
    $stmt->bind_param('sss', $username, $hash, $display);
    if (!$stmt->execute()) { fail($DEBUG ? $stmt->error : 'Could not create the account.', 500); }
    record_attempt($mysqli, $ATTEMPTS_TABLE, 'register', $ip, $username);

    $created = account_by_id($mysqli, 'user', $mysqli->insert_id);
    respond(session_payload($created, $SECRET, token_days($created)), 201);
}

if ($action === 'login' && $method === 'POST') {
    $body     = json_body();
    $username = isset($body['username']) ? strtolower(trim((string) $body['username'])) : '';
    $password = isset($body['password']) ? (string) $body['password'] : '';

    $ip = client_ip();
    if (attempts_since($mysqli, $ATTEMPTS_TABLE, 'login', 'ip', $ip, $LOGIN_WINDOW) >= $LOGIN_MAX_PER_IP
        || ($username !== '' && attempts_since($mysqli, $ATTEMPTS_TABLE, 'login', 'username', $username, $LOGIN_WINDOW) >= $LOGIN_MAX_PER_USER)) {
        too_many($LOGIN_WINDOW);
    }

    $row = account_by_username($mysqli, 'admin', $username);
    if (!$row) { $row = account_by_username($mysqli, 'user', $username); }

    // Verify against a dummy hash when the user is unknown so timing does not reveal usernames.
    $hash = $row ? $row['password_hash'] : '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    if (!$row || $password === '' || !password_verify($password, $hash)) {
        record_attempt($mysqli, $ATTEMPTS_TABLE, 'login', $ip, $username);
        fail('Incorrect username or password.', 401);
    }
    clear_attempts($mysqli, $ATTEMPTS_TABLE, $username);
    respond(session_payload($row, $SECRET, token_days($row)));
}

if ($action === 'me' && $method === 'GET') {
    if (!$account) { fail('Sign in required.', 401); }
    $me = public_account($account);
    $me['favorites'] = favorite_ids($mysqli, $FAVORITES_TABLE, $account);
    // Renew a token that has used up more than half its life so active users never hit expiry.
    list(, , $expires) = explode('.', bearer_token());
    if ((int) $expires - time() < token_days($account) * 86400 / 2) {
        $me['session'] = session_payload($account, $SECRET, token_days($account));
    }
    respond($me);
}

// Signs the account out everywhere: the token_version bump invalidates every issued token.
if ($action === 'logout' && $method === 'POST') {
    if (!$account) { respond(['revoked' => false]); }
    respond(['revoked' => revoke_tokens($mysqli, $account)]);
}

if ($action === 'password' && $method === 'PUT') {
    if (!$account) { fail('Sign in required.', 401); }
    $body    = json_body();
    $current = isset($body['current']) ? (string) $body['current'] : '';
    $next    = isset($body['next']) ? (string) $body['next'] : '';
    if (!password_verify($current, $account['password_hash'])) { fail('Current password is incorrect.', 422); }
    if (strlen($next) < 8) { fail('New password must be at least 8 characters.', 422); }

    $newHash = password_hash($next, PASSWORD_DEFAULT);
    $table   = account_table($account['role']);
    $stmt    = $mysqli->prepare("UPDATE `$table` SET password_hash = ? WHERE id = ?");
    $stmt->bind_param('si', $newHash, $account['id']);
    if (!$stmt->execute()) { fail('Could not update the password.', 500); }

    $account['password_hash'] = $newHash;
    respond(session_payload($account, $SECRET, token_days($account)));
}

if ($action === 'profile' && $method === 'PUT') {
    if (!$account) { fail('Sign in required.', 401); }
    $body     = json_body();
    $username = isset($body['username']) ? strtolower(trim((string) $body['username'])) : $account['username'];
    $display  = isset($body['display_name']) ? trim((string) $body['display_name']) : $account['display_name'];
    $avatar   = isset($body['avatar_url']) ? trim((string) $body['avatar_url']) : (string) $account['avatar_url'];

    if (!preg_match('/^[a-z0-9_.]{3,30}$/', $username)) {
        fail('Username must be 3-30 characters: letters, numbers, dots or underscores.', 422);
    }
    if ($display === '') { fail('Display name cannot be empty.', 422); }
    if (mb_strlen($display) > 120) { fail('Display name is too long.', 422); }
    if ($avatar !== '' && !preg_match('#^https?://\S+$#i', $avatar)) { fail('Profile photo must be a full http(s) link.', 422); }
    if (strlen($avatar) > 500) { fail('Profile photo link is too long.', 422); }

    if ($username !== $account['username']) {
        $taken = account_by_username($mysqli, 'admin', $username) ?: account_by_username($mysqli, 'user', $username);
        if ($taken) { fail('That username is already taken.', 409); }
    }

    $table  = account_table($account['role']);
    $avatarValue = $avatar === '' ? null : $avatar;
    $stmt   = $mysqli->prepare("UPDATE `$table` SET username = ?, display_name = ?, avatar_url = ? WHERE id = ?");
    $stmt->bind_param('sssi', $username, $display, $avatarValue, $account['id']);
    if (!$stmt->execute()) { fail($DEBUG ? $stmt->error : 'Could not update the profile.', 500); }

    $updated = account_by_id($mysqli, $account['role'], $account['id']);
    respond(['account' => public_account($updated)]);
}

if ($action === 'favorites' && $method === 'GET') {
    if (!$account) { fail('Sign in required.', 401); }
    respond(['ids' => favorite_ids($mysqli, $FAVORITES_TABLE, $account)]);
}

// Replaces the whole favorites set. The app always knows the full list, so this stays simple.
if ($action === 'favorites' && $method === 'PUT') {
    if (!$account) { fail('Sign in required.', 401); }
    $body = json_body();
    $ids  = isset($body['ids']) && is_array($body['ids']) ? array_values(array_unique(array_map('intval', $body['ids']))) : [];

    $mysqli->begin_transaction();
    $del = $mysqli->prepare("DELETE FROM `$FAVORITES_TABLE` WHERE role = ? AND account_id = ?");
    $del->bind_param('si', $account['role'], $account['id']);
    $del->execute();
    if ($ids) {
        $ins = $mysqli->prepare("INSERT IGNORE INTO `$FAVORITES_TABLE` (role, account_id, actress_id) VALUES (?, ?, ?)");
        foreach ($ids as $actressId) {
            if ($actressId <= 0) { continue; }
            $ins->bind_param('sii', $account['role'], $account['id'], $actressId);
            $ins->execute();
        }
    }
    $mysqli->commit();
    respond(['ids' => favorite_ids($mysqli, $FAVORITES_TABLE, $account)]);
}

// A member's own submissions, whatever their status, so they can see what is pending.
if ($action === 'mine' && $method === 'GET') {
    require_member($account, $isUser, $account ? 'Only member accounts have suggestions.' : 'Sign in required.');
    $stmt = $mysqli->prepare("SELECT * FROM `$TABLE` WHERE submitted_by = ? ORDER BY created_at DESC");
    $stmt->bind_param('i', $account['id']);
    $stmt->execute();
    respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

if ($action !== '') {
    fail('Unknown action.', 404);
}

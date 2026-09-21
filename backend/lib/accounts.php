<?php
/**
 * Pinay Stars API - accounts and tokens
 *
 * Account rows live in `admins` or `users` (same columns). Tokens are
 * role.id.expiry.signature, signed with the secret plus the password hash and
 * token_version, so a password change or sign-out revokes them.
 */

/** 'admin' rows live in $ADMIN_TABLE, 'user' rows in $USER_TABLE. Same columns in both. */
function account_table($role) {
    global $ADMIN_TABLE, $USER_TABLE;
    return $role === 'admin' ? $ADMIN_TABLE : $USER_TABLE;
}

function account_by_id($mysqli, $role, $id) {
    $table = account_table($role);
    $stmt  = $mysqli->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) { $row['role'] = $role; }
    return $row;
}

function account_by_username($mysqli, $role, $username) {
    $table = account_table($role);
    $stmt  = $mysqli->prepare("SELECT * FROM `$table` WHERE username = ? LIMIT 1");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) { $row['role'] = $role; }
    return $row;
}

/**
 * The signing key mixes in the password hash and the account's token_version, so a
 * password change or a sign-out (which bumps the version) invalidates every earlier token.
 */
function sign_token($account, $expires, $secret) {
    $payload = $account['role'] . '.' . $account['id'] . '.' . $expires;
    $version = isset($account['token_version']) ? (int) $account['token_version'] : 0;
    return $payload . '.' . hash_hmac('sha256', $payload, $secret . $account['password_hash'] . '.' . $version);
}

/** Returns the account row (with role) for a valid token, or null. */
function current_account($mysqli, $secret) {
    $token = bearer_token();
    if ($token === '' || substr_count($token, '.') !== 3) { return null; }
    list($role, $id, $expires, $sig) = explode('.', $token);
    if (!in_array($role, ['admin', 'user'], true)) { return null; }
    if (!ctype_digit($id) || !ctype_digit($expires) || (int) $expires < time()) { return null; }
    $account = account_by_id($mysqli, $role, (int) $id);
    if (!$account) { return null; }
    $expected = sign_token($account, $expires, $secret);
    return hash_equals($expected, $token) ? $account : null;
}

function public_account($account) {
    return [
        'id'           => (int) $account['id'],
        'role'         => $account['role'],
        'username'     => $account['username'],
        'display_name' => $account['display_name'],
        'avatar_url'   => isset($account['avatar_url']) ? $account['avatar_url'] : null,
        'created_at'   => $account['created_at'],
    ];
}

function session_payload($account, $secret, $days) {
    $expires = time() + $days * 86400;
    return [
        'token'      => sign_token($account, $expires, $secret),
        'expires_at' => date('c', $expires),
        'account'    => public_account($account),
    ];
}

function token_days($account) {
    global $TOKEN_DAYS, $ADMIN_TOKEN_DAYS;
    return $account['role'] === 'admin' ? $ADMIN_TOKEN_DAYS : $TOKEN_DAYS;
}

/** Bumps token_version so every token issued so far for this account stops validating. */
function revoke_tokens($mysqli, $account) {
    $table = account_table($account['role']);
    $stmt  = @$mysqli->prepare("UPDATE `$table` SET token_version = token_version + 1 WHERE id = ?");
    if (!$stmt) { return false; } // column missing: token_version.sql not run yet
    $stmt->bind_param('i', $account['id']);
    return (bool) @$stmt->execute();
}

/**
 * 401 means "no valid session" and makes the app sign the user out; 403 means
 * "signed in, but this role may not do that" and is shown as a plain error.
 */
function deny($account, $message) {
    fail($message, $account ? 403 : 401);
}
function require_admin($account, $isAdmin) {
    if (!$isAdmin) { deny($account, $account ? 'Administrator access required.' : 'Admin login required.'); }
}
function require_member($account, $isUser, $message) {
    if (!$isUser) { deny($account, $message); }
}

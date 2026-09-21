<?php
/**
 * Pinay Stars API - sign-in rate limiting
 *
 * Counts failed sign-ins and registrations in login_attempts (see
 * login_attempts.sql). Every helper fails open: if the table is missing or a
 * query fails, sign-in still works and only the limit is skipped.
 */

function client_ip() {
    // REMOTE_ADDR only. X-Forwarded-For is client-controlled and would let an attacker reset the count.
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
    return substr($ip, 0, 45);
}

function attempts_since($mysqli, $table, $kind, $column, $value, $seconds) {
    $stmt = @$mysqli->prepare("SELECT COUNT(*) AS n FROM `$table` WHERE kind = ? AND `$column` = ? AND attempted_at > (NOW() - INTERVAL ? SECOND)");
    if (!$stmt) { return 0; }
    $stmt->bind_param('ssi', $kind, $value, $seconds);
    if (!$stmt->execute()) { return 0; }
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (int) $row['n'] : 0;
}

function record_attempt($mysqli, $table, $kind, $ip, $username = '') {
    $stmt = @$mysqli->prepare("INSERT INTO `$table` (kind, ip, username) VALUES (?, ?, ?)");
    if (!$stmt) { return; }
    $stmt->bind_param('sss', $kind, $ip, $username);
    @$stmt->execute();
    // Keep the table small; one request in twenty sweeps out yesterday's rows.
    if (mt_rand(1, 20) === 1) { @$mysqli->query("DELETE FROM `$table` WHERE attempted_at < (NOW() - INTERVAL 1 DAY)"); }
}

function clear_attempts($mysqli, $table, $username) {
    $stmt = @$mysqli->prepare("DELETE FROM `$table` WHERE kind = 'login' AND username = ?");
    if (!$stmt) { return; }
    $stmt->bind_param('s', $username);
    @$stmt->execute();
}

function too_many($seconds) {
    header('Retry-After: ' . $seconds);
    fail('Too many attempts. Please wait ' . max(1, (int) ceil($seconds / 60)) . ' minutes and try again.', 429);
}

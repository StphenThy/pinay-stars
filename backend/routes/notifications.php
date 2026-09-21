<?php
/**
 * Pinay Stars API - ?action=notifications
 *
 * The signed-in account's notification feed.
 *
 * Included by pinay_actresses.php after the session has been resolved, so
 * $mysqli, $account, $isAdmin, $isUser, $method, $action and the table names are
 * all in scope. Every matching branch ends the request with respond() or fail().
 */

if ($action === 'notifications') {
    if (!$account) { fail('Sign in required.', 401); }

    if ($method === 'GET') {
        respond(fetch_notifications($mysqli, $NOTIFICATIONS_TABLE, $account, $NOTIFICATION_LIMIT));
    }
    if ($method === 'POST') {
        $body    = json_body();
        $tone    = in_array($body['tone'] ?? '', ['success', 'error', 'info'], true) ? $body['tone'] : 'info';
        $message = clean_text($body['message'] ?? '', 255);
        if ($message === '') { fail('A message is required.', 422); }
        $actressId = isset($body['actress_id']) && $body['actress_id'] !== null && $body['actress_id'] !== '' ? (int) $body['actress_id'] : null;
        notify($mysqli, $NOTIFICATIONS_TABLE, $account['role'], $account['id'], $tone, $message, $actressId);
        respond(fetch_notifications($mysqli, $NOTIFICATIONS_TABLE, $account, $NOTIFICATION_LIMIT), 201);
    }
    if ($method === 'PUT') {
        $stmt = $mysqli->prepare("UPDATE `$NOTIFICATIONS_TABLE` SET is_read = 1 WHERE role = ? AND account_id = ?");
        $stmt->bind_param('si', $account['role'], $account['id']);
        $stmt->execute();
        respond(fetch_notifications($mysqli, $NOTIFICATIONS_TABLE, $account, $NOTIFICATION_LIMIT));
    }
    if ($method === 'DELETE') {
        $stmt = $mysqli->prepare("DELETE FROM `$NOTIFICATIONS_TABLE` WHERE role = ? AND account_id = ?");
        $stmt->bind_param('si', $account['role'], $account['id']);
        $stmt->execute();
        respond([]);
    }
    fail('Unsupported request method.', 405);
}

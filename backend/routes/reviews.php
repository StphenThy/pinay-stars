<?php
/**
 * Pinay Stars API - ?action=reviews
 *
 * Read, upsert and delete member ratings for one actress.
 *
 * Included by pinay_actresses.php after the session has been resolved, so
 * $mysqli, $account, $isAdmin, $isUser, $method, $action and the table names are
 * all in scope. Every matching branch ends the request with respond() or fail().
 */

if ($action === 'reviews') {
    $actressId = record_id();
    if ($actressId <= 0) { fail('An actress id is required.', 422); }

    $check = $mysqli->prepare("SELECT status FROM `$TABLE` WHERE id = ? LIMIT 1");
    $check->bind_param('i', $actressId);
    $check->execute();
    $target = $check->get_result()->fetch_assoc();
    if (!$target || (!$isAdmin && in_array($target['status'], ['review', 'draft'], true))) {
        fail('That actress is not in the public directory.', 404);
    }

    if ($method === 'GET') {
        respond(review_payload($mysqli, $TABLE, $REVIEWS_TABLE, $USER_TABLE, $actressId, $account));
    }

    if ($method === 'PUT') {
        require_member($account, $isUser, $account ? 'Only members can rate. Administrators moderate reviews instead.' : 'Sign in as a member to rate.');
        $body    = json_body();
        $rating  = isset($body['rating']) ? (int) $body['rating'] : 0;
        $comment = isset($body['comment']) ? trim((string) $body['comment']) : '';
        if ($rating < 1 || $rating > 5) { fail('Rating must be between 1 and 5 stars.', 422); }
        if (mb_strlen($comment) > 500) { fail('Keep the review under 500 characters.', 422); }
        $commentValue = $comment === '' ? null : $comment;

        $stmt = $mysqli->prepare(
            "INSERT INTO `$REVIEWS_TABLE` (actress_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updated_at = NOW()"
        );
        $stmt->bind_param('iiis', $actressId, $account['id'], $rating, $commentValue);
        if (!$stmt->execute()) { fail($DEBUG ? $stmt->error : 'Could not save the review.', 500); }
        respond(review_payload($mysqli, $TABLE, $REVIEWS_TABLE, $USER_TABLE, $actressId, $account));
    }

    if ($method === 'DELETE') {
        if (!$account) { fail('Sign in required.', 401); }
        $reviewId = isset($_GET['review_id']) ? (int) $_GET['review_id'] : 0;
        if ($isAdmin) {
            if ($reviewId <= 0) { fail('A review id is required.', 422); }
            $stmt = $mysqli->prepare("DELETE FROM `$REVIEWS_TABLE` WHERE id = ? AND actress_id = ?");
            $stmt->bind_param('ii', $reviewId, $actressId);
        } else {
            $stmt = $mysqli->prepare("DELETE FROM `$REVIEWS_TABLE` WHERE actress_id = ? AND user_id = ?");
            $stmt->bind_param('ii', $actressId, $account['id']);
        }
        $stmt->execute();
        respond(review_payload($mysqli, $TABLE, $REVIEWS_TABLE, $USER_TABLE, $actressId, $account));
    }
    fail('Unsupported request method.', 405);
}

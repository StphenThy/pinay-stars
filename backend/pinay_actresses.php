<?php
/**
 * Pinay Stars - talent registry API
 *
 * Replaces the contents of /www/stephen123.mooo.com/pinay_actresses.php.
 * It reuses the connection.php that already sits beside it, so there are no
 * credentials to fill in. Run schema.sql, then seed.sql, in phpMyAdmin first.
 *
 *   GET    pinay_actresses.php              list (public: live records only; admin: everything)
 *   GET    pinay_actresses.php?name=kath    search by name / stage name
 *          Add ?limit=50&offset=0 to either for a page: {items, total, offset, limit}
 *   GET    pinay_actresses.php?id=1         fetch one
 *   POST   pinay_actresses.php              create   (public submissions are forced to status "review")
 *   PUT    pinay_actresses.php?id=1         update   (admin only)
 *   DELETE pinay_actresses.php?id=1         delete   (admin only)
 *
 *   POST   pinay_actresses.php?action=register  {username, password, display_name} -> {token, account}
 *   POST   pinay_actresses.php?action=login     {username, password} -> {token, account}   (admins and members)
 *          Both answer 429 with Retry-After after repeated failures (see login_attempts.sql).
 *   GET    pinay_actresses.php?action=me        (token) -> account + favorite ids (+ session when the token is renewed)
 *   POST   pinay_actresses.php?action=logout    (token) -> {revoked}; invalidates every token for the account
 *   PUT    pinay_actresses.php?action=password  (token) {current, next}
 *   PUT    pinay_actresses.php?action=profile   (token) {username, display_name, avatar_url} -> {account}
 *   GET    pinay_actresses.php?action=favorites (token) -> {ids}
 *   PUT    pinay_actresses.php?action=favorites (token) {ids} -> replaces the set
 *   GET    pinay_actresses.php?action=mine      (member token) -> the member's own submissions
 *   GET    pinay_actresses.php?action=notifications  (token) -> the account's feed, newest first
 *   POST   pinay_actresses.php?action=notifications  (token) {tone, message, actress_id} -> adds one
 *   PUT    pinay_actresses.php?action=notifications  (token) -> marks all read
 *   DELETE pinay_actresses.php?action=notifications  (token) -> clears the feed
 *   GET    pinay_actresses.php?action=reviews&id=N   -> {average, count, reviews[], mine}
 *   PUT    pinay_actresses.php?action=reviews&id=N   (member) {rating 1-5, comment} -> upsert own review
 *   DELETE pinay_actresses.php?action=reviews&id=N   (member: own review; admin: &review_id=M)
 *
 * Signed-in requests carry the token as "Authorization: Bearer <token>" and also
 * "X-Auth-Token: <token>", because some shared hosts strip Authorization.
 * Token format: role.id.expiry.signature — admins in `admins`, members in `users`.
 * The signature covers the password hash and token_version, so changing the password
 * or signing out revokes all earlier tokens. Admin tokens last 7 days, member tokens 30.
 */

$TABLE               = 'pinay_actresses';
$ADMIN_TABLE         = 'admins';
$USER_TABLE          = 'users';
$FAVORITES_TABLE     = 'favorites';
$NOTIFICATIONS_TABLE = 'notifications';
$NOTIFICATION_LIMIT  = 60;
$PAGE_MAX            = 200;  // largest ?limit a list request may ask for
$REVIEWS_TABLE       = 'reviews';
$ATTEMPTS_TABLE      = 'login_attempts';

// Brute-force limits (see login_attempts.sql). Counted over the last LOGIN_WINDOW seconds.
$LOGIN_WINDOW        = 900;   // 15 minutes
$LOGIN_MAX_PER_IP    = 20;    // failed sign-ins from one address
$LOGIN_MAX_PER_USER  = 8;     // failed sign-ins against one username
$REGISTER_MAX_PER_IP = 5;     // new accounts from one address per hour

// The token-signing secret lives in connection.php as $TOKEN_SECRET (see
// connection.example.php). It is never committed. Changing it logs everyone out.
// Admin tokens are short-lived because they can edit and delete; the app renews
// them silently on every ?action=me call when less than half the life is left.
$TOKEN_DAYS       = 30;
$ADMIN_TOKEN_DAYS = 7;

// Exposes MySQL error text in responses. Set $API_DEBUG = true in connection.php while
// debugging; it lives there so a debug build can never be committed by accident.
$DEBUG = false;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'connection.php';
$DEBUG = !empty($API_DEBUG);

function respond($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail($message, $code = 400) {
    respond(['error' => $message], $code);
}

if (empty($TOKEN_SECRET) || strlen($TOKEN_SECRET) < 32) {
    fail('Server misconfigured: set $TOKEN_SECRET in connection.php.', 500);
}
$SECRET = $TOKEN_SECRET;

$db     = new dbObj();
$mysqli = $db->getConnstring();
if (!($mysqli instanceof mysqli)) {
    fail('Database connection failed.', 500);
}
$mysqli->set_charset('utf8mb4');

/** Columns the client is allowed to write, in a fixed order. rating/reviews_count are computed from reviews. */
$FIELDS = [
    'name', 'stage_name', 'birthday', 'birthplace', 'occupation', 'agency',
    'biography', 'image_url', 'genres', 'films', 'tv_series', 'awards',
    'years_active', 'status',
];

$STATUSES = ['active', 'review', 'draft', 'on_leave', 'hiatus', 'overseas', 'memoriam'];

/** Resolve the record id from ?id=1 or from PATH_INFO (/pinay_actresses.php/1). */
function record_id() {
    if (isset($_GET['id']) && $_GET['id'] !== '') {
        return (int) $_GET['id'];
    }
    if (!empty($_SERVER['PATH_INFO']) && preg_match('/(\d+)/', $_SERVER['PATH_INFO'], $m)) {
        return (int) $m[1];
    }
    return 0;
}

function json_body() {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Years between a YYYY-MM-DD birthday and today, or null if unparseable. */
function age_from_birthday($birthday) {
    if (!$birthday) {
        return null;
    }
    $dob = date_create($birthday);
    if (!$dob) {
        return null;
    }
    return (int) date_diff($dob, date_create('today'))->y;
}

/**
 * Pull the writable fields out of the request body.
 * Returns [values, types] ready for a prepared statement.
 */
function collect($body, $fields, $statuses) {
    $values = [];
    $types  = '';
    foreach ($fields as $field) {
        $value = isset($body[$field]) ? $body[$field] : null;

        if ($field === 'status') {
            $value = is_string($value) ? strtolower(trim($value)) : '';
            if (!in_array($value, $statuses, true)) {
                $value = 'active';
            }
            $types .= 's';
        } else {
            $value = $value === null ? '' : trim((string) $value);
            $types .= 's';
        }
        $values[] = $value;
    }
    return [$values, $types];
}

$method = strtoupper($_SERVER['REQUEST_METHOD']);

/**
 * Notification text is shown verbatim in other people's feeds, so anything a member typed
 * (display names, stage names) is stripped of control characters and kept short.
 */
function clean_text($value, $max) {
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $value);
    return mb_substr(trim($value), 0, $max);
}

// ------------------------------------------------------------------ AUTH
function bearer_token() {
    $candidates = [];
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
        if (!empty($_SERVER[$key])) { $candidates[] = $_SERVER[$key]; }
    }
    if (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        foreach (['Authorization', 'authorization'] as $key) {
            if (!empty($h[$key])) { $candidates[] = $h[$key]; }
        }
        foreach (['X-Auth-Token', 'x-auth-token'] as $key) {
            if (!empty($h[$key])) { return trim($h[$key]); }
        }
    }
    if (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) { return trim($_SERVER['HTTP_X_AUTH_TOKEN']); }
    foreach ($candidates as $value) {
        if (preg_match('/Bearer\s+(.+)$/i', $value, $m)) { return trim($m[1]); }
    }
    return '';
}

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

// ------------------------------------------------------------ RATE LIMIT
// Every helper here fails open: if login_attempts.sql has not been run yet, or the
// query fails for any reason, sign-in still works and only the limit is skipped.

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

$account = current_account($mysqli, $SECRET);
$isAdmin = $account !== null && $account['role'] === 'admin';
$isUser  = $account !== null && $account['role'] === 'user';

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
$action  = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';

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

<?php
/**
 * Pinay Stars - talent registry API
 *
 * Entry point. Lives in /www/stephen123.mooo.com/ next to connection.php, with the
 * lib/ and routes/ folders uploaded alongside it:
 *
 *   pinay_actresses.php   config, CORS, DB connection, session, then the routes
 *   lib/http.php          respond/fail, request parsing, bearer token, text cleaning
 *   lib/accounts.php      account lookup, token signing/validation, role checks
 *   lib/ratelimit.php     login_attempts counters (fail open if the table is missing)
 *   lib/records.php       actress field collection and age derivation
 *   lib/social.php        favorites, notifications, reviews helpers
 *   routes/*.php          one file per URL group; each ends the request when it matches
 *   cache/                optional, writable: caches TMDB poster lookups (see routes/posters.php)
 *
 * Run schema.sql, then seed.sql, then the remaining .sql files in phpMyAdmin first.
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
 *   GET    pinay_actresses.php?action=posters&kind=movie|tv&titles=A|B  -> {configured, items}  (TMDB posters)
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

require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/accounts.php';
require_once __DIR__ . '/lib/ratelimit.php';
require_once __DIR__ . '/lib/records.php';
require_once __DIR__ . '/lib/social.php';

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

$method = strtoupper($_SERVER['REQUEST_METHOD']);

$account = current_account($mysqli, $SECRET);
$isAdmin = $account !== null && $account['role'] === 'admin';
$isUser  = $account !== null && $account['role'] === 'user';
$action  = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';

// Routes are plain includes that share this scope; each one ends the request when it matches.
require __DIR__ . '/routes/reviews.php';
require __DIR__ . '/routes/notifications.php';
require __DIR__ . '/routes/posters.php';
require __DIR__ . '/routes/account.php';
require __DIR__ . '/routes/actresses.php';

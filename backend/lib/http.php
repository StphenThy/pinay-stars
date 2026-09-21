<?php
/**
 * Pinay Stars API - HTTP helpers
 *
 * JSON responses, request-body parsing, the record id from the URL, the bearer
 * token from the headers, and text cleaning for anything echoed into other feeds.
 */

function respond($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail($message, $code = 400) {
    respond(['error' => $message], $code);
}

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

/**
 * Notification text is shown verbatim in other people's feeds, so anything a member typed
 * (display names, stage names) is stripped of control characters and kept short.
 */
function clean_text($value, $max) {
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $value);
    return mb_substr(trim($value), 0, $max);
}

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

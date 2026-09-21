<?php
/**
 * Pinay Stars API - ?action=posters
 *
 * Looks up film and TV posters on The Movie Database (TMDB) for the titles stored in an
 * actress's `films` / `tv_series` columns, so the app can show a "Known for" poster rail.
 *
 *   GET pinay_actresses.php?action=posters&kind=movie&titles=Title One|Title Two
 *   GET pinay_actresses.php?action=posters&kind=tv&titles=Series One
 *
 * Response: {configured: bool, items: {"Title One": {poster, year, tmdb_id, name} | null, ...}}
 * `poster` is a full https URL (w342) or null when nothing matched.
 *
 * The TMDB key lives in connection.php as $TMDB_API_KEY (a v3 API key). Results are
 * cached in cache/posters.json (or the system temp dir when that folder is not writable)
 * for 30 days, so each title is fetched from TMDB at most once a month. Failures never
 * break the request: an unmatched or errored title simply comes back null.
 *
 * Included by pinay_actresses.php after the session has been resolved.
 */

if ($action === 'posters' && $method === 'GET') {
    $POSTER_TTL   = 30 * 86400;
    $POSTER_LIMIT = 12;   // titles per request
    $POSTER_BASE  = 'https://image.tmdb.org/t/p/w342';

    $kind   = (isset($_GET['kind']) && $_GET['kind'] === 'tv') ? 'tv' : 'movie';
    $titles = isset($_GET['titles']) ? array_values(array_filter(array_map('trim', explode('|', (string) $_GET['titles'])))) : [];
    $titles = array_slice(array_unique($titles), 0, $POSTER_LIMIT);

    $configured = !empty($TMDB_API_KEY);
    if (!$configured || !$titles) {
        respond(['configured' => $configured, 'items' => (object) []]);
    }

    // ---- cache
    $cacheDir  = __DIR__ . '/../cache';
    $cacheFile = (is_dir($cacheDir) && is_writable($cacheDir)) ? "$cacheDir/posters.json" : sys_get_temp_dir() . '/pinay-stars-posters.json';
    $cache     = [];
    if (is_file($cacheFile)) {
        $decoded = json_decode((string) @file_get_contents($cacheFile), true);
        if (is_array($decoded)) { $cache = $decoded; }
    }
    $dirty = false;

    /** Normalises "Hello, Love, Goodbye (2019)" -> ["hello, love, goodbye", 2019]. */
    $split = function ($title) {
        $year = null;
        if (preg_match('/^(.*?)\s*\((\d{4})\)\s*$/', $title, $m)) { $title = $m[1]; $year = (int) $m[2]; }
        return [trim($title), $year];
    };

    $http_get = function ($url) {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_FOLLOWLOCATION => true]);
            $body = curl_exec($ch);
            curl_close($ch);
            return $body === false ? null : $body;
        }
        $ctx = stream_context_create(['http' => ['timeout' => 6]]);
        $body = @file_get_contents($url, false, $ctx);
        return $body === false ? null : $body;
    };

    /** Prefers a Philippine / Tagalog result with a poster; falls back to the first with a poster. */
    $pick = function ($results) {
        $best = null;
        foreach ($results as $r) {
            if (empty($r['poster_path'])) { continue; }
            $lang = isset($r['original_language']) ? $r['original_language'] : '';
            if ($lang === 'tl') { return $r; }
            if ($best === null) { $best = $r; }
        }
        return $best;
    };

    $items = [];
    foreach ($titles as $title) {
        $key = $kind . ':' . mb_strtolower($title);
        if (isset($cache[$key]) && isset($cache[$key]['t']) && time() - $cache[$key]['t'] < $POSTER_TTL) {
            $items[$title] = $cache[$key]['v'];
            continue;
        }

        list($query, $year) = $split($title);
        $params = ['api_key' => $TMDB_API_KEY, 'query' => $query, 'include_adult' => 'false', 'region' => 'PH'];
        if ($year) { $params[$kind === 'tv' ? 'first_air_date_year' : 'year'] = $year; }
        $body = $http_get('https://api.themoviedb.org/3/search/' . $kind . '?' . http_build_query($params));
        $data = $body ? json_decode($body, true) : null;

        $value = null;
        if (is_array($data) && !empty($data['results'])) {
            $hit = $pick($data['results']);
            if ($hit) {
                $date  = $kind === 'tv' ? ($hit['first_air_date'] ?? '') : ($hit['release_date'] ?? '');
                $value = [
                    'poster'  => $POSTER_BASE . $hit['poster_path'],
                    'year'    => $date ? (int) substr($date, 0, 4) : null,
                    'tmdb_id' => (int) $hit['id'],
                    'name'    => $kind === 'tv' ? ($hit['name'] ?? $query) : ($hit['title'] ?? $query),
                ];
            }
        }

        // Only cache definite answers; a network hiccup should be retried next time.
        if (is_array($data)) {
            $cache[$key] = ['t' => time(), 'v' => $value];
            $dirty = true;
        }
        $items[$title] = $value;
    }

    if ($dirty) { @file_put_contents($cacheFile, json_encode($cache), LOCK_EX); }
    respond(['configured' => true, 'items' => (object) $items]);
}

<?php
/**
 * Pinay Stars API - actress record helpers
 *
 * Age derivation and the writable-field collector used by create and update.
 */

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

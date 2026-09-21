<?php
/**
 * Template for connection.php. Copy this file to connection.php on the server,
 * fill in the values, and never commit the real one (it is in .gitignore).
 *
 * Generate a new $TOKEN_SECRET with:  php -r "echo bin2hex(random_bytes(32));"
 */

// Signs login tokens. Changing it logs every admin and member out.
$TOKEN_SECRET = 'replace-with-64-hex-characters';

// Set to true only while debugging: API error responses then include MySQL error text.
$API_DEBUG = false;

class dbObj {
    private $host = 'localhost';
    private $user = 'db_user';
    private $pass = 'db_password';
    private $name = 'db_name';

    public function getConnstring() {
        $conn = new mysqli($this->host, $this->user, $this->pass, $this->name);
        if ($conn->connect_error) {
            return $conn->connect_error;
        }
        return $conn;
    }
}

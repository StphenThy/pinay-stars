# Pinay Stars (Expo Go)

A React Native / Expo Go app for discovering and managing Pinay actresses, backed by a single PHP + MySQL endpoint on shared hosting (Freehostia). Members can browse, search, favorite, review and submit profiles; admins approve submissions and edit or delete records.

## Project layout

| Path | What it is |
| --- | --- |
| `App.js`, `src/`, `lib/` | Expo app |
| `backend/pinay_actresses.php` | The whole API (actresses, auth, favorites, reviews, notifications) |
| `backend/schema.sql`, `seed.sql` | Base table + sample rows |
| `backend/*.sql` | Later migrations (`admins`, `users`, `profile`, `reviews`, `notifications`) |
| `backend/connection.example.php` | Template for the untracked `connection.php` (DB credentials + token secret) |

## Run the app

1. Set `API_BASE_URL` in `src/api.js` to the folder that holds `pinay_actresses.php`.
2. `npm install`
3. `npx expo start`
4. Scan the QR code with Expo Go. Phone and computer must be on the same Wi-Fi.

## Deploy the backend

1. Copy `backend/connection.example.php` to `connection.php` on the server, fill in the MySQL credentials, and set `$TOKEN_SECRET` to a fresh value (`php -r "echo bin2hex(random_bytes(32));"`).
2. Upload `pinay_actresses.php` next to it.
3. In phpMyAdmin run `schema.sql`, then `seed.sql`, then the remaining `.sql` files.

`connection.php` is git-ignored. Never commit real credentials or the token secret.

## API summary

| Method | Request | Notes |
| --- | --- | --- |
| GET | `pinay_actresses.php` | list (public sees live records; admin sees all) |
| GET | `pinay_actresses.php?name=kath` | search |
| GET | `pinay_actresses.php?id=1` | one record |
| POST | `pinay_actresses.php` | create (public submissions go to `review`) |
| PUT / DELETE | `pinay_actresses.php?id=1` | admin only |
| POST | `?action=register` / `?action=login` | returns `{token, account}` |

Send the token as `X-Auth-Token`; some shared hosts strip `Authorization`. Full details are in the header comment of `pinay_actresses.php`.

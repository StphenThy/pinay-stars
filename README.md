# Pinay Stars (Expo Go)

A React Native / Expo Go app for discovering and managing Pinay actresses. It consumes two APIs:

1. **Custom REST API**: a self-hosted PHP + MySQL endpoint on Freehostia with full CRUD for actress records.
2. **Third-party public API**: [The Movie Database (TMDB) API](https://developer.themoviedb.org/docs), which supplies film and TV posters for each actress's filmography.

Members can browse, search, favorite, review and submit profiles; admins approve submissions and create, edit or delete records.

## APIs used

| API | Base URL | Used for |
| --- | --- | --- |
| Custom REST API (self-hosted) | `http://stephen123.mooo.com/pinay_actresses.php` | Actress records: list, detail, create, update, delete |
| **Third-party: TMDB API v3** | **`https://api.themoviedb.org/3`** | `GET /search/movie` and `GET /search/tv` return posters for the titles in an actress's films and TV series |
| TMDB image CDN | `https://image.tmdb.org/t/p/w342` | Poster images |

## Exam requirements and where they live

| Requirement | Implementation |
| --- | --- |
| **Read (GET)**: list/grid, tap for detail | `src/screens/DirectoryScreen.js` and `HomeScreen.js` list records from `actressApi.getAll`; tapping a card opens `src/screens/ProfileScreen.js` |
| **Create (POST)**: validated form, list updates | `src/screens/ActressFormScreen.js`; rules in `validateForm` (`src/data/actressModel.js`); `createActress` in `App.js` adds the new row to the list |
| **Update (PUT)**: pre-filled edit form | Same form, pre-filled by `formFromActress`; `updateActress` in `App.js` sends `PUT ?id=` |
| **Delete (DELETE)**: confirmation first | `src/components/DeleteDialog.js` asks "Delete Actress?" before `actressApi.remove` sends `DELETE ?id=` |
| **External API: fetch** | `src/posters.js` calls TMDB `/search/movie` and `/search/tv` with `fetch` |
| **External API: parse + display** | `src/posters.js` picks the best match from the JSON `results`; `src/components/PosterRail.js` shows the "Known For" poster rail on each profile, and `src/screens/EntryScreen.js` shows the poster hero |

The HTTP client for the custom API is `src/api.js`.

## Project layout

| Path | What it is |
| --- | --- |
| `App.js`, `src/` | Expo app |
| `backend/pinay_actresses.php` | API entry point (config, CORS, DB connection, session) |
| `backend/lib/` | Helpers: HTTP, accounts/tokens, rate limiting, records, social |
| `backend/routes/` | One file per URL group: actresses, account, reviews, notifications, posters |
| `backend/schema.sql`, `seed.sql` | Base table + sample rows |
| `backend/*.sql` | Later migrations (`admins`, `users`, `profile`, `reviews`, `notifications`, `login_attempts`, `token_version`) |
| `backend/connection.example.php` | Template for the untracked `connection.php` (DB credentials, token secret, TMDB key) |

## Run the app

1. Set `API_BASE_URL` in `src/api.js` to the folder that holds `pinay_actresses.php`.
2. `npm install`
3. `npx expo start`
4. Scan the QR code with Expo Go. Phone and computer must be on the same Wi-Fi.

## Deploy the backend

1. Copy `backend/connection.example.php` to `connection.php` on the server, fill in the MySQL credentials, and set `$TOKEN_SECRET` to a fresh value (`php -r "echo bin2hex(random_bytes(32));"`).
2. For posters, get a free TMDB v3 API key (themoviedb.org > Settings > API) and put it in `$TMDB_API_KEY` in `connection.php`.
3. Upload `pinay_actresses.php` **and the `lib/` and `routes/` folders** next to it (same directory as `connection.php`).
4. In phpMyAdmin run `schema.sql`, then `seed.sql`, then the remaining `.sql` files. The `.sql` files stay on your computer; they are never uploaded.
5. Optional: set `$API_DEBUG = true;` in `connection.php` to see MySQL error text while debugging, and turn it off again afterwards.

`connection.php` is git-ignored. Never commit real credentials, the token secret or the TMDB key.

## API summary

| Method | Request | Notes |
| --- | --- | --- |
| GET | `pinay_actresses.php` | list (public sees live records; admin sees all) |
| GET | `pinay_actresses.php?name=kath` | search |
| GET | `pinay_actresses.php?id=1` | one record |
| POST | `pinay_actresses.php` | create (public submissions go to `review`) |
| PUT / DELETE | `pinay_actresses.php?id=1` | admin only |
| POST | `?action=register` / `?action=login` | returns `{token, account}` |
| GET | `?action=posters` | `{configured, client_key}` for the app's TMDB lookups |

Send the token as `X-Auth-Token`; some shared hosts strip `Authorization`. Full details are in the header comment of `pinay_actresses.php`.

The shared host blocks outbound requests, so the server cannot call TMDB itself. The app gets the key from `?action=posters` and queries TMDB directly. It caches results on the device for a week.

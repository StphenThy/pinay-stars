import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posterApi } from './api';

// Film / series posters come from The Movie Database. The backend hands the app a read-only
// TMDB key (the shared host cannot make outbound requests itself), the app searches TMDB
// directly, and results are cached on the device for a week so each title is looked up once.
const CACHE_KEY = 'pinay-stars:posters';
const TTL_MS = 7 * 86400 * 1000;
const TMDB = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const CONCURRENCY = 4;

let memory = null;      // { key: { t, v } }
let loading = null;     // promise while the cache is being read from disk
let keyPromise = null;  // resolves to the TMDB key, or '' when the server has none

async function readCache() {
  if (memory) return memory;
  if (!loading) {
    loading = AsyncStorage.getItem(CACHE_KEY).then(raw => {
      try { memory = raw ? JSON.parse(raw) : {}; } catch { memory = {}; }
      return memory;
    }).catch(() => (memory = {}));
  }
  return loading;
}

function writeCache() {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memory)).catch(() => {});
}

function getKey() {
  if (!keyPromise) {
    keyPromise = posterApi.config().then(res => (res && res.configured && res.client_key) || '').catch(() => {
      keyPromise = null; // let a later call retry after a network failure
      return '';
    });
  }
  return keyPromise;
}

const keyOf = (kind, title) => `${kind}:${title.trim().toLowerCase()}`;

/** "Hello, Love, Goodbye (2019)" -> ["Hello, Love, Goodbye", 2019] */
function splitYear(title) {
  const m = /^(.*?)\s*\((\d{4})\)\s*$/.exec(title);
  return m ? [m[1].trim(), Number(m[2])] : [title.trim(), null];
}

/** Prefers a Tagalog-language result with a poster, else the first result with a poster. */
function pick(results) {
  let best = null;
  for (const r of results || []) {
    if (!r.poster_path) continue;
    if (r.original_language === 'tl') return r;
    if (!best) best = r;
  }
  return best;
}

async function searchTmdb(key, title, kind) {
  const [query, year] = splitYear(title);
  const params = { api_key: key, query, include_adult: 'false', region: 'PH' };
  if (year) params[kind === 'tv' ? 'first_air_date_year' : 'year'] = String(year);
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${TMDB}/search/${kind}?${qs}`);
  if (!res.ok) throw new Error(`tmdb ${res.status}`);
  const data = await res.json();
  const hit = pick(data.results);
  if (!hit) return null;
  const date = kind === 'tv' ? hit.first_air_date : hit.release_date;
  return {
    poster: POSTER_BASE + hit.poster_path,
    year: date ? Number(String(date).slice(0, 4)) : null,
    tmdbId: hit.id,
    // Filipino productions keep their original title ("Ang Probinsyano", not TMDB's "Brothers").
    name: (hit.original_language === 'tl' ? (kind === 'tv' ? hit.original_name : hit.original_title) : (kind === 'tv' ? hit.name : hit.title)) || query,
  };
}

/**
 * Resolves posters for a list of titles. Returns { [title]: {poster, year, name} | null }.
 * Titles missing from the result could not be looked up this time (offline, no key).
 */
export async function lookupPosters(titles, kind = 'movie') {
  const clean = [...new Set((titles || []).map(x => String(x).trim()).filter(Boolean))];
  if (!clean.length) return {};
  const cache = await readCache();
  const now = Date.now();
  const out = {};
  const missing = [];
  for (const title of clean) {
    const hit = cache[keyOf(kind, title)];
    if (hit && now - hit.t < TTL_MS) out[title] = hit.v;
    else missing.push(title);
  }
  if (!missing.length) return out;

  const key = await getKey();
  if (!key) return out;

  // A few lookups at a time; TMDB allows ~50 req/s but phones on cellular do not.
  const queue = [...missing];
  const worker = async () => {
    while (queue.length) {
      const title = queue.shift();
      try {
        const v = await searchTmdb(key, title, kind);
        cache[keyOf(kind, title)] = { t: now, v };
        out[title] = v;
      } catch {
        // Leave unresolved; the rail shows a title tile and retries next visit.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  writeCache();
  return out;
}

/** React hook form of lookupPosters. `titles` is re-fetched when its contents change. */
export function usePosters(titles, kind = 'movie') {
  const [posters, setPosters] = useState({});
  const signature = (titles || []).join('|');
  useEffect(() => {
    let cancelled = false;
    if (!signature) { setPosters({}); return undefined; }
    lookupPosters(signature.split('|'), kind).then(map => { if (!cancelled) setPosters(map); });
    return () => { cancelled = true; };
  }, [signature, kind]);
  return posters;
}

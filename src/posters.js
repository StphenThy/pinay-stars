import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { posterApi } from './api';

// Poster lookups are cached on the device for a week, keyed by kind + title, so the
// profile rail renders instantly on later visits and the server is asked only for new titles.
const CACHE_KEY = 'pinay-stars:posters';
const TTL_MS = 7 * 86400 * 1000;
const BATCH = 12;

let memory = null;         // { key: { t, v } }
let loading = null;        // promise while the cache is being read from disk
let configured = true;     // flips false when the server says no TMDB key is set

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

const keyOf = (kind, title) => `${kind}:${title.trim().toLowerCase()}`;

/**
 * Resolves posters for a list of titles. Returns { [title]: {poster, year, name} | null }.
 * Titles missing from the result are still being fetched or could not be looked up.
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
  if (!missing.length || !configured) return out;

  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    try {
      const res = await posterApi.lookup(chunk, kind);
      if (res && res.configured === false) { configured = false; return out; }
      const items = (res && res.items) || {};
      for (const title of chunk) {
        const v = Object.prototype.hasOwnProperty.call(items, title) ? items[title] : null;
        cache[keyOf(kind, title)] = { t: now, v };
        out[title] = v;
      }
      writeCache();
    } catch {
      // Network problem: leave these titles unresolved; the UI shows plain title cards.
    }
  }
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

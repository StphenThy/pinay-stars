import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// The saved session is split in two: the token goes into the device keychain / keystore
// (expo-secure-store) and the harmless parts (account, favorites) stay in AsyncStorage.
// On the web there is no keychain, so the token falls back to AsyncStorage there.
const TOKEN_KEY = 'pinay-stars.token';
const SESSION_KEY = 'pinay-stars:auth';

const secure = Platform.OS !== 'web';

async function readToken() {
  if (secure) return (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
  return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
}

async function writeToken(token) {
  if (!token) {
    return secure ? SecureStore.deleteItemAsync(TOKEN_KEY) : AsyncStorage.removeItem(TOKEN_KEY);
  }
  return secure ? SecureStore.setItemAsync(TOKEN_KEY, token) : AsyncStorage.setItem(TOKEN_KEY, token);
}

/** Returns { token, account, favorites } or null when nobody is signed in. */
export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved) return null;

    let token = await readToken();
    // Sessions saved by earlier builds kept the token in the JSON blob; move it once.
    if (!token && saved.token) {
      token = saved.token;
      await writeToken(token);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ account: saved.account, favorites: saved.favorites }));
    }
    if (!token) return null;
    return { token, account: saved.account || null, favorites: saved.favorites || [] };
  } catch {
    return null;
  }
}

export async function saveSession({ token, account, favorites }) {
  try {
    await writeToken(token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ account, favorites }));
  } catch {}
}

/** Merges fields into the saved session; the token can only be replaced, never removed here. */
export async function patchSession(changes) {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const { token, ...rest } = changes;
    if (token) await writeToken(token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...JSON.parse(raw), ...rest }));
  } catch {}
}

export async function clearSession() {
  try {
    await writeToken('');
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
}

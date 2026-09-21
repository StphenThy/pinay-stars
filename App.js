import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { actressApi, authApi, notificationApi, setAuthToken, AuthError } from './src/api';
import { normalizeActresses } from './src/data/sampleActresses';
import { DEFAULT_FILTERS, formFromActress, toPayload } from './src/data/actressModel';
import { colors } from './src/theme';
import IntroScreen from './src/screens/IntroScreen';
import EntryScreen from './src/screens/EntryScreen';
import HomeScreen from './src/screens/HomeScreen';
import DirectoryScreen from './src/screens/DirectoryScreen';
import FiltersScreen from './src/screens/FiltersScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ManageScreen from './src/screens/ManageScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ActressFormScreen from './src/screens/ActressFormScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LoginScreen from './src/screens/LoginScreen';
import AccountScreen from './src/screens/AccountScreen';
import BottomNav from './src/components/BottomNav';
import Toast from './src/components/Toast';
import DeleteDialog from './src/components/DeleteDialog';
import { NotificationContext } from './src/notifications';
import { AuthContext } from './src/auth';
import { clearSession, loadSession, patchSession, saveSession } from './src/session';
import { haptic } from './src/haptics';

const FAVORITES_KEY = 'pinay-stars:favorites';
const NOTIFICATIONS_KEY = 'pinay-stars:notifications';
const NOTIFICATION_LIMIT = 50;
const TABS = ['home', 'directory', 'favorites', 'manage'];

export default function App() {
  const [intro, setIntro] = useState(true);
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState('online');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rows, setRows] = useState([]);

  const [stack, setStack] = useState([{ name: 'home' }]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Talents');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [account, setAccount] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const isAdmin = account?.role === 'admin';
  const isMember = account?.role === 'user';
  const signedIn = account !== null;

  const actresses = useMemo(() => normalizeActresses(rows), [rows]);
  const pendingCount = useMemo(() => actresses.filter(a => a.status === 'review').length, [actresses]);
  const favorites = useMemo(() => actresses.filter(a => favoriteIds.includes(String(a.id))), [actresses, favoriteIds]);
  const current = stack[stack.length - 1];
  const unread = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Signed-in accounts keep their feed on the server; the device list is for guests only.
  const accountRef = useRef(null);
  useEffect(() => { accountRef.current = account; }, [account]);

  const fromServer = rows => (rows || []).map(n => ({
    id: n.id,
    tone: n.tone,
    message: n.message,
    actressId: n.actress_id ?? undefined,
    time: Date.parse(String(n.created_at).replace(' ', 'T') + 'Z') || Date.now(),
    read: !!n.read,
  }));

  const loadGuestNotifications = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!accountRef.current) { setNotifications(await loadGuestNotifications()); return; }
    try { setNotifications(fromServer(await notificationApi.list())); } catch {}
  }, [loadGuestNotifications]);

  const showToast = useCallback((tone, message, actressId) => {
    if (tone === 'success') haptic.success(); else if (tone === 'error') haptic.error();
    setToast({ tone, message, key: Date.now() });
    const entry = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tone, message, actressId, time: Date.now(), read: false };
    setNotifications(old => [entry, ...old].slice(0, NOTIFICATION_LIMIT));
    if (accountRef.current) {
      notificationApi.add(tone, message, actressId).then(rows => setNotifications(fromServer(rows))).catch(() => {});
    } else {
      AsyncStorage.getItem(NOTIFICATIONS_KEY).then(raw => {
        const old = raw ? JSON.parse(raw) : [];
        AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([entry, ...old].slice(0, NOTIFICATION_LIMIT))).catch(() => {});
      }).catch(() => {});
    }
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => { loadGuestNotifications().then(setNotifications); }, [loadGuestNotifications]);

  // Approval / rejection notices arrive from the server, so poll gently while signed in.
  useEffect(() => {
    if (!account) return undefined;
    const timer = setInterval(refreshNotifications, 60000);
    return () => clearInterval(timer);
  }, [account, refreshNotifications]);

  const load = useCallback(async ({ silent } = {}) => {
    setSyncing(true);
    try {
      const data = await actressApi.getAll();
      setRows(Array.isArray(data) ? data : []);
      setSource('online');
      setLoadError('');
      setLastSync(Date.now());
      if (!silent) showToast('success', 'Registry synced with the cloud');
      if (accountRef.current) refreshNotifications();
    } catch (err) {
      setSource('offline');
      setLoadError(err.message);
      if (!silent) showToast('error', err.message);
    } finally {
      setSyncing(false);
      setReady(true);
    }
  }, [showToast, refreshNotifications]);

  // Guests keep favorites on the device; signed-in accounts keep them on the server.
  const loadDeviceFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const signOut = useCallback(async (message, tone = 'info') => {
    setAuthToken('');
    setAccount(null);
    accountRef.current = null;
    clearSession();
    setFavoriteIds(await loadDeviceFavorites());
    setNotifications(await loadGuestNotifications());
    setStack(st => (st.some(f => ['manage', 'form', 'account'].includes(f.name)) ? [{ name: 'home' }] : st));
    if (message) showToast(tone, message);
  }, [showToast, loadDeviceFavorites, loadGuestNotifications]);

  // Restore a saved session first so the initial load returns pending submissions for admins.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let favorites = await loadDeviceFavorites();
      try {
        const saved = await loadSession();
        if (saved) {
          setAuthToken(saved.token);
          try {
            const me = await authApi.me();
            if (!cancelled) {
              // The server hands back a fresh token once the old one has used half its life.
              const token = me.session?.token || saved.token;
              setAuthToken(token);
              const { session, favorites: serverFavorites, ...profile } = me;
              setAccount(profile);
              accountRef.current = profile;
              favorites = (serverFavorites || []).map(String);
              if (session) saveSession({ token, account: profile, favorites });
            }
          } catch (err) {
            if (err instanceof AuthError) {
              setAuthToken('');
              clearSession();
            } else if (!cancelled) {
              // Offline: trust the saved session until the server can be asked again.
              setAccount(saved.account);
              accountRef.current = saved.account;
              favorites = saved.favorites || favorites;
            }
          }
        }
      } catch {}
      if (!cancelled) {
        setFavoriteIds(favorites);
        load({ silent: true });
      }
    })();
    return () => { cancelled = true; };
  }, [load, loadDeviceFavorites]);

  const persistFavorites = useCallback((next, currentAccount) => {
    if (currentAccount) {
      authApi.setFavorites(next.map(Number)).catch(() => {});
      patchSession({ favorites: next });
    } else {
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
    }
  }, []);

  const toggleFavorite = useCallback(actress => {
    setFavoriteIds(ids => {
      const id = String(actress.id);
      const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
      persistFavorites(next, account);
      return next;
    });
  }, [persistFavorites, account]);

  const navigate = useCallback(name => {
    if (name === 'suggest') setStack(st => [...st, { name: 'form', params: { mode: 'suggest' } }]);
    else setStack([{ name }]);
  }, []);
  const push = useCallback((name, params) => setStack(st => [...st, { name, params }]), []);
  const back = useCallback(() => setStack(st => (st.length > 1 ? st.slice(0, -1) : st)), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pendingDelete) { setPendingDelete(null); return true; }
      if (filtersOpen) { setFiltersOpen(false); return true; }
      if (stack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [pendingDelete, filtersOpen, stack.length, back]);

  const openProfile = useCallback(actress => push('profile', { id: actress.id }), [push]);
  const openAdd = useCallback(() => push('form', { mode: 'add' }), [push]);
  const openSuggest = useCallback(() => push('form', { mode: 'suggest' }), [push]);
  const openEdit = useCallback(actress => push('form', { mode: 'edit', id: actress.id }), [push]);
  const openAccount = useCallback(() => push(signedIn ? 'account' : 'login'), [push, signedIn]);

  // A 401 means the session is no longer valid on the server; drop to viewer mode instead of a raw error.
  const handleError = err => {
    if (err instanceof AuthError) signOut(signedIn ? 'Your session expired — please sign in again' : err.message, 'error');
    else showToast('error', err.message);
  };

  // After sign-in the account's own server-side favorites replace whatever this device was showing.
  // Device favorites belong to guest mode only and are never copied into an account.
  const startSession = async (result, greeting) => {
    setAuthToken(result.token);
    setAccount(result.account);
    accountRef.current = result.account;
    setEntered(true);
    let favorites = [];
    try {
      favorites = (await authApi.getFavorites()).ids.map(String);
    } catch {}
    setFavoriteIds(favorites);
    await refreshNotifications();
    saveSession({ token: result.token, account: result.account, favorites });
    showToast('success', greeting);
    setStack([{ name: 'home' }]);
    load({ silent: true });
  };

  const login = async (username, password) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const result = await authApi.login(username, password);
      await startSession(result, `Welcome back, ${result.account.display_name || result.account.username}`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const register = async (username, password, displayName) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const result = await authApi.register(username, password, displayName);
      await startSession(result, `Account created — welcome, ${result.account.display_name}`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    // Best effort: revoke the token server-side so it stops working everywhere, then clear locally.
    try { await authApi.logout(); } catch {}
    await signOut('Signed out');
    setEntered(false);
    setStack([{ name: 'home' }, { name: 'login', params: { mode: 'login' } }]);
    load({ silent: true });
  };

  const updateProfile = async (profile, onDone) => {
    setAuthBusy(true);
    try {
      const result = await authApi.updateProfile(profile);
      setAccount(result.account);
      accountRef.current = result.account;
      patchSession({ account: result.account });
      showToast('success', 'Profile updated');
      onDone && onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setAuthBusy(false);
    }
  };

  const changePassword = async (current, next, onDone) => {
    setAuthBusy(true);
    try {
      const result = await authApi.changePassword(current, next);
      setAuthToken(result.token);
      saveSession({ token: result.token, account: result.account, favorites: favoriteIds });
      showToast('success', 'Password updated — other devices were signed out');
      onDone && onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setAuthBusy(false);
    }
  };

  const createActress = async form => {
    setSaving(true);
    const suggestion = !isAdmin;
    try {
      const row = await actressApi.create(toPayload(form));
      setLastSync(Date.now());
      if (suggestion) {
        // The server hides pending records from viewers, so don't add it to the local list.
        showToast('success', `Thank you! “${row.stage_name || row.name}” was sent for admin review`);
        setStack(isMember ? [{ name: 'home' }, { name: 'account' }] : [{ name: 'directory' }]);
      } else {
        setRows(old => [...old, row]);
        showToast('success', `“${row.stage_name || row.name}” published to the live directory`, row.id);
        setStack([{ name: 'manage' }, { name: 'profile', params: { id: row.id } }]);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const updateActress = async (existing, form) => {
    setSaving(true);
    try {
      const row = await actressApi.update(existing.id, toPayload(form, existing));
      setRows(old => old.map(r => (String(r.id) === String(row.id) ? row : r)));
      setLastSync(Date.now());
      showToast('success', `${existing.stageName} (${existing.displayId}) updated`, existing.id);
      back();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const approveActress = async actress => {
    setSaving(true);
    try {
      const payload = { ...toPayload(formFromActress(actress), actress), status: 'active' };
      const row = await actressApi.update(actress.id, payload);
      setRows(old => old.map(r => (String(r.id) === String(row.id) ? row : r)));
      setLastSync(Date.now());
      showToast('success', `“${actress.stageName}” approved and published`, actress.id);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    haptic.warning();
    setDeleting(true);
    try {
      await actressApi.remove(target.id);
      setRows(old => old.filter(r => String(r.id) !== String(target.id)));
      setFavoriteIds(ids => ids.filter(x => x !== String(target.id)));
      setLastSync(Date.now());
      setPendingDelete(null);
      showToast('success', target.status === 'review' ? `Submission “${target.stageName}” rejected` : `“${target.stageName}” removed from the registry`);
      setStack(st => {
        const trimmed = st.filter(f => !(f.name === 'profile' && String(f.params?.id) === String(target.id)) && f.name !== 'form');
        return trimmed.length ? trimmed : [{ name: 'manage' }];
      });
    } catch (err) {
      setPendingDelete(null);
      handleError(err);
    } finally {
      setDeleting(false);
    }
  };

  const openNotifications = useCallback(() => {
    setStack(st => (st[st.length - 1].name === 'notifications' ? st : [...st, { name: 'notifications' }]));
    refreshNotifications();
  }, [refreshNotifications]);
  const markAllRead = () => {
    setNotifications(old => {
      const next = old.map(n => ({ ...n, read: true }));
      if (!account) AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    if (account) notificationApi.markAllRead().catch(() => {});
  };
  const clearNotifications = () => {
    setNotifications([]);
    if (account) notificationApi.clear().catch(() => {});
    else AsyncStorage.setItem(NOTIFICATIONS_KEY, '[]').catch(() => {});
  };
  const openFromNotification = id => {
    markAllRead();
    const target = actresses.find(a => String(a.id) === String(id));
    if (target) push('profile', { id: target.id });
    else showToast('info', 'That record is no longer in the registry');
  };
  const notificationContext = useMemo(() => ({ unread, open: openNotifications }), [unread, openNotifications]);
  const authContext = useMemo(() => ({ account, isAdmin, isMember, openAccount }), [account, isAdmin, isMember, openAccount]);

  const selected = current.params?.id !== undefined
    ? actresses.find(a => String(a.id) === String(current.params.id))
    : null;

  // A profile whose record vanished (deleted elsewhere, or the list refreshed) has nowhere to render.
  const orphaned = current.name === 'profile' && !selected;
  useEffect(() => { if (orphaned) back(); }, [orphaned, back]);

  if (intro) {
    const start = actress => {
      setIntro(false);
      if (actress) {
        setEntered(true);
        setStack([{ name: 'home' }, { name: 'profile', params: { id: actress.id } }]);
      }
    };
    return <Frame><IntroScreen ready={ready} source={source} actresses={actresses} onStart={start} /></Frame>;
  }

  // Signed-in accounts skip the chooser; guests pick Sign In / Join / Guest once per launch.
  if (!entered && !signedIn && current.name !== 'login') {
    return (
      <Frame>
        <EntryScreen
          onSignIn={() => setStack([{ name: 'home' }, { name: 'login', params: { mode: 'login' } }])}
          onRegister={() => setStack([{ name: 'home' }, { name: 'login', params: { mode: 'register' } }])}
          onGuest={() => setEntered(true)}
        />
      </Frame>
    );
  }

  const shared = {
    actresses, query, setQuery, category, setCategory, favorites,
    onFavorite: toggleFavorite, onNavigate: navigate, onProfile: openProfile, source,
    onRefresh: () => load({ silent: true }), refreshing: syncing,
    // First-load and failure states for the list screens; once records are cached they stay visible.
    loading: !ready, loadError, onRetry: () => load(),
  };

  // Reviews update the cached average/count on the actress row so cards elsewhere reflect it immediately.
  const applyRating = (actressId, average, count) =>
    setRows(old => old.map(r => (String(r.id) === String(actressId) ? { ...r, rating: average, reviews_count: count } : r)));

  const loginScreen = (reason, mode) => (
    <LoginScreen
      key={mode || 'login'}
      initialMode={mode || 'login'}
      busy={authBusy}
      error={authError}
      reason={reason}
      onLogin={login}
      onRegister={register}
      onBack={entered ? (stack.length > 1 ? back : () => navigate('home')) : () => { setStack([{ name: 'home' }]); setIntro(true); }}
      onGuest={!entered ? () => { setEntered(true); navigate('home'); } : undefined}
    />
  );

  // Admin-only screens fall back to the login form when a non-admin lands on them.
  const adminOnly = current.name === 'manage' || (current.name === 'form' && current.params?.mode !== 'suggest');

  let screen = null;
  if (adminOnly && !isAdmin) {
    screen = loginScreen('This area is for registry administrators. Members and guests can still suggest an actress from the Suggest tab.');
  } else if (current.name === 'account' && !signedIn) {
    screen = loginScreen();
  } else if (current.name === 'home') screen = <HomeScreen {...shared} />;
  else if (current.name === 'directory') screen = <DirectoryScreen {...shared} filters={filters} setFilters={setFilters} onOpenFilters={() => setFiltersOpen(true)} onSuggest={openSuggest} />;
  else if (current.name === 'favorites') screen = <FavoritesScreen {...shared} />;
  else if (current.name === 'login') screen = loginScreen(undefined, current.params?.mode);
  else if (current.name === 'account') {
    screen = (
      <AccountScreen
        account={account}
        favoritesCount={favorites.length}
        pendingCount={pendingCount}
        busy={authBusy}
        onBack={back}
        onLogout={logout}
        onChangePassword={changePassword}
        onUpdateProfile={updateProfile}
        onProfile={openProfile}
        onNavigate={target => (target === 'add' ? openAdd() : navigate(target))}
      />
    );
  } else if (current.name === 'manage') {
    screen = (
      <ManageScreen
        {...shared}
        syncing={syncing}
        lastSync={lastSync}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onApprove={approveActress}
        onSync={() => load()}
        onToast={t => showToast(t.tone, t.message)}
      />
    );
  } else if (current.name === 'profile') {
    screen = selected ? (
      <ProfileScreen
        actress={selected}
        favorite={favoriteIds.includes(String(selected.id))}
        onBack={back}
        onFavorite={toggleFavorite}
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onApprove={approveActress}
        onSignIn={() => push('login')}
        onRatingChange={applyRating}
        onError={handleError}
        onRefresh={() => load({ silent: true })}
        refreshing={syncing}
      />
    ) : null;
  } else if (current.name === 'form') {
    const editing = current.params.mode === 'edit';
    screen = (
      <ActressFormScreen
        key={`${current.params.mode}-${current.params.id ?? 'new'}`}
        mode={current.params.mode}
        actress={editing ? selected : null}
        busy={saving}
        onCancel={back}
        onSave={form => (editing && selected ? updateActress(selected, form) : createActress(form))}
      />
    );
  } else if (current.name === 'notifications') {
    screen = (
      <NotificationsScreen
        notifications={notifications}
        onBack={back}
        onOpenActress={openFromNotification}
        onMarkAllRead={markAllRead}
        onClear={clearNotifications}
        onRefresh={refreshNotifications}
        refreshing={false}
      />
    );
  }

  const tabActive = current.name === 'form' && current.params?.mode === 'suggest'
    ? 'suggest'
    : TABS.includes(current.name) ? current.name : stack[0].name;
  // The login page must be a dead end: no tab bar to wander off through.
  const onLoginPage = current.name === 'login' || (adminOnly && !isAdmin) || (current.name === 'account' && !signedIn);
  const showNav = current.name !== 'form' && !onLoginPage;

  return (
    <AuthContext.Provider value={authContext}>
    <NotificationContext.Provider value={notificationContext}>
      <Frame>
        <SafeAreaView style={s.app}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <View style={{ flex: 1 }}>{screen}</View>
          {showNav ? <BottomNav active={tabActive} onNavigate={navigate} favoriteCount={favorites.length} pendingCount={pendingCount} /> : null}

          <FiltersScreen
            visible={filtersOpen}
            actresses={actresses}
            filters={filters}
            query={query}
            onApply={next => { setFilters(next); setFiltersOpen(false); }}
            onClose={() => setFiltersOpen(false)}
          />
          <DeleteDialog actress={pendingDelete} busy={deleting} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
          <Toast toast={toast} onDismiss={dismissToast} onPress={openNotifications} />
        </SafeAreaView>
      </Frame>
    </NotificationContext.Provider>
    </AuthContext.Provider>
  );
}

// On the web the app is phone-shaped, so centre it in a phone-width column on wide screens.
function Frame({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={s.webBackdrop}>
      <View style={s.webColumn}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  webBackdrop: { flex: 1, backgroundColor: '#3B0012', alignItems: 'center' },
  webColumn: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.background },
});

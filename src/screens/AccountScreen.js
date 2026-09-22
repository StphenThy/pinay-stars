import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { Avatar, Button, Kicker, StatusPill } from '../components/ui';
import ThemePicker from '../components/ThemePicker';
import { fonts, radius } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';
import { initialsOf, roleLabel } from '../auth';
import { authApi } from '../api';
import { normalizeActress } from '../data/actressModel';

export default function AccountScreen({ account, favoritesCount, pendingCount, busy, onBack, onLogout, onChangePassword, onUpdateProfile, onNavigate, onProfile }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [mine, setMine] = useState(null);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(account.display_name || '');
  const [username, setUsername] = useState(account.username || '');
  const [avatarUrl, setAvatarUrl] = useState(account.avatar_url || '');
  const [profileError, setProfileError] = useState('');

  const isAdmin = account.role === 'admin';

  const startEditing = () => {
    setDisplayName(account.display_name || '');
    setUsername(account.username || '');
    setAvatarUrl(account.avatar_url || '');
    setProfileError('');
    setEditing(true);
  };

  const submitProfile = () => {
    if (!displayName.trim()) return setProfileError('Display name cannot be empty.');
    if (!/^[a-z0-9_.]{3,30}$/i.test(username.trim())) return setProfileError('Username: 3–30 letters, numbers, dots or underscores.');
    if (avatarUrl.trim() && !/^https?:\/\/\S+$/i.test(avatarUrl.trim())) return setProfileError('Profile photo must be a full http(s) link.');
    setProfileError('');
    onUpdateProfile({ display_name: displayName.trim(), username: username.trim().toLowerCase(), avatar_url: avatarUrl.trim() }, () => setEditing(false));
  };

  useEffect(() => {
    if (isAdmin) return;
    authApi.mySubmissions().then(rows => setMine((rows || []).map(normalizeActress))).catch(err => setMine({ error: err.message }));
  }, [isAdmin]);

  const submitPassword = () => {
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    setError('');
    onChangePassword(current, next, () => { setCurrent(''); setNext(''); setConfirm(''); });
  };

  const since = account.created_at ? String(account.created_at).slice(0, 10) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader section="ACCOUNT" onBack={onBack} right={<View />} />

        <View style={s.hero}>
          {account.avatar_url ? (
            <Avatar uri={account.avatar_url} name={account.display_name || account.username} style={s.avatarPhoto} rounded={46} />
          ) : (
            <View style={[s.avatar, !isAdmin && s.avatarMember]}>
              <Text style={[s.avatarText, !isAdmin && s.avatarTextMember]}>{initialsOf(account.display_name || account.username)}</Text>
            </View>
          )}
          <Text style={s.name}>{account.display_name || account.username}</Text>
          <Text style={s.username}>@{account.username}</Text>
          <View style={[s.badge, !isAdmin && s.badgeMember]}>
            <Text style={[s.badgeText, !isAdmin && s.badgeTextMember]}>{roleLabel(account).toUpperCase()}{isAdmin ? ' • FULL ACCESS' : ''}</Text>
          </View>
          {since ? <Text style={s.since}>Member since {since}</Text> : null}
          {!editing ? (
            <Pressable onPress={startEditing} style={s.editLink} hitSlop={8}>
              <Text style={s.editLinkText}>Edit profile</Text>
            </Pressable>
          ) : null}
        </View>

        {editing ? (
          <View style={s.card}>
            <Kicker>PROFILE</Kicker>
            <Text style={s.cardTitle}>Edit Profile</Text>
            <Text style={s.cardBody}>Your display name shows on your suggestions and notifications. Username is what you sign in with.</Text>

            <Text style={s.label}>Display name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={colors.muted} style={s.input} />
            <Text style={s.label}>Username</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="username" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={s.input} />
            <Text style={s.label}>Profile photo (image link, optional)</Text>
            <View style={s.photoRow}>
              <Avatar uri={avatarUrl.trim()} name={displayName || username} style={s.photoPreview} rounded={30} />
              <TextInput value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://…/photo.jpg" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={[s.input, { flex: 1, marginBottom: 0 }]} />
            </View>
            {profileError ? <Text style={s.error}>{profileError}</Text> : null}
            <View style={s.editActions}>
              <Button label={busy ? 'Saving…' : 'Save Profile'} onPress={submitProfile} disabled={busy} style={{ flex: 1 }} />
              <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} disabled={busy} style={{ flex: 1, marginLeft: 12 }} />
            </View>
          </View>
        ) : null}

        <View style={s.stats}>
          <Pressable onPress={() => onNavigate('favorites')} style={s.stat}>
            <Text style={s.statValue}>{favoritesCount}</Text>
            <Text style={s.statLabel}>Favorites</Text>
          </Pressable>
          <View style={s.statDivider} />
          {isAdmin ? (
            <Pressable onPress={() => onNavigate('manage')} style={s.stat}>
              <Text style={s.statValue}>{pendingCount}</Text>
              <Text style={s.statLabel}>Pending review</Text>
            </Pressable>
          ) : (
            <View style={s.stat}>
              <Text style={s.statValue}>{Array.isArray(mine) ? mine.length : '–'}</Text>
              <Text style={s.statLabel}>Suggestions</Text>
            </View>
          )}
        </View>

        <View style={s.quick}>
          {isAdmin ? (
            <>
              <Button label={pendingCount ? `Review ${pendingCount} pending` : 'Manage registry'} onPress={() => onNavigate('manage')} style={{ flex: 1 }} />
              <Button label="Add actress" variant="secondary" onPress={() => onNavigate('add')} style={{ flex: 1, marginLeft: 12 }} />
            </>
          ) : (
            <Button label="Suggest an Actress" onPress={() => onNavigate('suggest')} style={{ flex: 1 }} />
          )}
        </View>

        {!isAdmin ? (
          <View style={s.card}>
            <Kicker>MY SUGGESTIONS</Kicker>
            <Text style={s.cardTitle}>Submitted by you</Text>
            {mine === null ? (
              <Text style={s.cardBody}>Loading…</Text>
            ) : mine.error ? (
              <Text style={s.error}>Could not load your suggestions: {mine.error}</Text>
            ) : mine.length === 0 ? (
              <Text style={s.cardBody}>You haven't suggested anyone yet. Suggestions appear here with their review status.</Text>
            ) : mine.map((a, i) => (
              <Pressable key={a.id} onPress={() => a.status !== 'review' && onProfile(a)} style={[s.mineRow, i < mine.length - 1 && s.mineRowBorder]}>
                <Avatar uri={a.image} name={a.stageName} style={s.mineAvatar} rounded={radius.sm} />
                <View style={{ flex: 1 }}>
                  <Text style={s.mineName}>{a.stageName}</Text>
                  <Text style={s.mineMeta}>{a.status === 'review' ? 'Waiting for admin review' : a.status === 'active' ? 'Approved — live in the directory' : 'Reviewed'}</Text>
                </View>
                <StatusPill status={a.status} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={s.card}>
          <Kicker>APPEARANCE</Kicker>
          <Text style={s.cardTitle}>Theme</Text>
          <Text style={s.cardBody}>Pick how Pinay Stars looks, or let it follow your phone's own light and dark setting. The choice is saved on this device and applies straight away.</Text>
          <ThemePicker />
        </View>

        <View style={s.card}>
          <Kicker>SECURITY</Kicker>
          <Text style={s.cardTitle}>Change Password</Text>
          <Text style={s.cardBody}>Changing the password signs out every other device.</Text>
          <TextInput value={current} onChangeText={setCurrent} placeholder="Current password" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" style={s.input} />
          <TextInput value={next} onChangeText={setNext} placeholder="New password (min 8 characters)" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" style={s.input} />
          <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" style={s.input} />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button label={busy ? 'Saving…' : 'Update Password'} variant="secondary" onPress={submitPassword} disabled={busy || !current || !next || !confirm} style={{ marginTop: 8 }} />
        </View>

        <Button label="Sign Out" variant="danger" onPress={onLogout} style={{ marginHorizontal: 20 }} />
        <Text style={s.footnote}>
          {isAdmin ? 'Signing out returns this device to guest mode.' : 'Your favorites and suggestions are saved to your account and will be here when you sign back in.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = ({ colors, shadow }) => StyleSheet.create({
  page: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.blushDeep },
  avatarMember: { backgroundColor: colors.roseFill },
  avatarPhoto: { width: 92, height: 92, borderWidth: 4, borderColor: colors.blushDeep },
  editLink: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.blush },
  editLinkText: { color: colors.burgundy, fontFamily: fonts.sansBold, fontSize: 13 },
  label: { color: colors.burgundy, fontFamily: fonts.sansBold, fontSize: 13, marginBottom: 8, marginTop: 4 },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  photoPreview: { width: 60, height: 60, marginRight: 12 },
  editActions: { flexDirection: 'row', marginTop: 8 },
  avatarText: { color: colors.gold, fontFamily: fonts.serif, fontSize: 36 },
  avatarTextMember: { color: colors.white },
  name: { fontFamily: fonts.serif, fontSize: 28, color: colors.burgundy, marginTop: 12 },
  username: { color: colors.muted, fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  badge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  badgeMember: { backgroundColor: colors.blushDeep },
  badgeText: { color: colors.gold, fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1 },
  badgeTextMember: { color: colors.burgundy },
  since: { color: colors.muted, fontFamily: fonts.sans, fontSize: 12, marginTop: 8 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  stat: { alignItems: 'center', paddingHorizontal: 24 },
  statValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.burgundy },
  statLabel: { color: colors.rose, fontSize: 11, letterSpacing: 1, fontFamily: fonts.sansBold, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.line },
  quick: { flexDirection: 'row', margin: 20 },
  card: { marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  cardTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.burgundy, marginTop: 4 },
  cardBody: { color: colors.text, fontFamily: fonts.sans, fontSize: 13, marginTop: 4, marginBottom: 12, lineHeight: 19 },
  mineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  mineRowBorder: { borderBottomWidth: 1, borderColor: colors.line },
  mineAvatar: { width: 44, height: 56, marginRight: 12 },
  mineName: { fontFamily: fonts.serif, fontSize: 16, color: colors.burgundy },
  mineMeta: { color: colors.muted, fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 15, color: colors.textStrong, marginBottom: 12 },
  error: { color: colors.danger, fontFamily: fonts.sansSemi, fontSize: 13, marginBottom: 8 },
  footnote: { marginHorizontal: 32, marginTop: 12, color: colors.muted, fontFamily: fonts.sans, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

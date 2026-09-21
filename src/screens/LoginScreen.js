import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui';
import { colors, fonts, radius, shadow } from '../theme';

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function LoginScreen({ busy, error, onLogin, onRegister, onBack, onGuest, reason, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState('');

  const registering = mode === 'register';
  const canSubmit = username.trim() && password && (!registering || confirm) && !busy;

  const switchMode = next => { setMode(next); setLocalError(''); };

  const submit = () => {
    setLocalError('');
    if (registering) {
      if (!/^[a-z0-9_.]{3,30}$/i.test(username.trim())) return setLocalError('Username: 3–30 letters, numbers, dots or underscores.');
      if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
      if (password !== confirm) return setLocalError('Passwords do not match.');
      onRegister(username.trim(), password, displayName.trim());
    } else {
      onLogin(username.trim(), password);
    }
  };

  const shownError = localError || error;
  const { height } = useWindowDimensions();
  const compact = height < 760;

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces>
        <LinearGradient colors={['#4A0015', '#730025']} style={[s.top, compact && s.topCompact]}>
          <View style={s.topRow}>
            <Pressable onPress={onBack} hitSlop={12} style={s.backButton}>
              <Text style={s.backText}>‹ Back</Text>
            </Pressable>
            <Text style={s.topKicker}>PINAY STARS</Text>
            <View style={{ width: 70 }} />
          </View>
          {!compact ? <View style={s.logo}><Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" /></View> : null}
          <Text style={[s.title, compact && s.titleCompact]}>{registering ? 'Create Your Account' : 'Welcome Back'}</Text>
          <Text style={s.lead} numberOfLines={compact ? 2 : 3}>
            {reason || (registering
              ? 'Keep your favorites across devices and track the actresses you suggest.'
              : 'Sign in to sync your favorites and suggestions. Administrators use the same form.')}
          </Text>
        </LinearGradient>

        <View style={s.body}>
          <View style={s.tabs}>
            <Pressable onPress={() => switchMode('login')} style={[s.tab, !registering && s.tabActive]}>
              <Text style={[s.tabText, !registering && s.tabTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable onPress={() => switchMode('register')} style={[s.tab, registering && s.tabActive]}>
              <Text style={[s.tabText, registering && s.tabTextActive]}>Create Account</Text>
            </Pressable>
          </View>

          <View style={s.card}>
            <Field label="Username">
              <TextInput value={username} onChangeText={setUsername} placeholder={registering ? 'e.g. maria_santos' : 'your username'} placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} textContentType="username" style={s.input} />
            </Field>
            {registering ? (
              <Field label="Display name">
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="How you'd like to appear" placeholderTextColor={colors.muted} style={s.input} />
              </Field>
            ) : null}
            <Field label="Password">
              <View style={s.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={registering ? 'At least 8 characters' : '••••••••'}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  textContentType={registering ? 'newPassword' : 'password'}
                  style={[s.input, { flex: 1 }]}
                  onSubmitEditing={() => !registering && canSubmit && submit()}
                  returnKeyType={registering ? 'next' : 'go'}
                />
                <Pressable onPress={() => setShow(x => !x)} hitSlop={8} style={s.eye}>
                  <Text style={s.eyeText}>{show ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </Field>
            {registering ? (
              <Field label="Confirm password">
                <TextInput value={confirm} onChangeText={setConfirm} placeholder="Repeat your password" placeholderTextColor={colors.muted} secureTextEntry={!show} autoCapitalize="none" style={s.input} onSubmitEditing={() => canSubmit && submit()} returnKeyType="go" />
              </Field>
            ) : null}

            {shownError ? <Text style={s.error}>{shownError}</Text> : null}

            <Button
              label={busy ? (registering ? 'Creating account…' : 'Signing in…') : registering ? 'Create Account' : 'Sign In'}
              onPress={submit}
              disabled={!canSubmit}
              style={{ marginTop: 6 }}
            />
          </View>

          {!registering ? (
            <Pressable onPress={() => switchMode('register')} style={s.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>New to Pinay Stars?</Text>
                <Text style={s.switchBody}>Create a free member account in under a minute.</Text>
              </View>
              <Text style={s.switchCta}>Join →</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => switchMode('login')} style={s.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Already have an account?</Text>
                <Text style={s.switchBody}>Sign in with your existing username.</Text>
              </View>
              <Text style={s.switchCta}>Sign in →</Text>
            </Pressable>
          )}

          {onGuest ? (
            <Pressable onPress={onGuest} style={s.guestLink} hitSlop={8}>
              <Text style={s.guestText}>Just browsing? <Text style={s.guestStrong}>Continue as guest</Text></Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 30 },
  top: { paddingTop: 18, paddingBottom: 26, paddingHorizontal: 24, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topCompact: { paddingBottom: 18 },
  titleCompact: { fontSize: 24, marginTop: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 18 },
  backButton: { width: 70, paddingVertical: 6 },
  backText: { color: '#FFE3E3', fontWeight: '700', fontSize: 16 },
  topKicker: { color: '#FFD3DA', fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  logo: { width: 88, height: 88, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 88, height: 88 },
  title: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 30, color: '#FFE8E5', marginTop: 14, textAlign: 'center' },
  lead: { color: '#F6C6CE', fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  body: { padding: 20, paddingBottom: 10 },
  tabs: { flexDirection: 'row', backgroundColor: colors.blush, borderRadius: radius.pill, padding: 4, marginTop: -2 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.burgundy },
  tabText: { color: colors.burgundy, fontWeight: '700', fontSize: 15 },
  tabTextActive: { color: colors.white },
  card: { marginTop: 16, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, ...shadow.card },
  label: { color: colors.burgundy, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textStrong },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eye: { paddingHorizontal: 12, paddingVertical: 10 },
  eyeText: { color: colors.rose, fontWeight: '700', fontSize: 13 },
  error: { color: colors.danger, fontWeight: '600', fontSize: 13, marginBottom: 10 },
  switchCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blushDeep, borderRadius: radius.lg, padding: 18 },
  switchTitle: { color: colors.burgundy, fontWeight: '700', fontSize: 16 },
  switchBody: { color: colors.text, fontSize: 13, marginTop: 3 },
  switchCta: { color: colors.burgundy, fontWeight: '700', fontSize: 15, marginLeft: 12 },
  guestLink: { alignItems: 'center', paddingVertical: 18 },
  guestText: { color: colors.text, fontSize: 14 },
  guestStrong: { color: colors.burgundy, fontWeight: '700' },
});

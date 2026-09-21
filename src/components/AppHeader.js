import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch, type } from '../theme';
import { useNotifications } from '../notifications';
import { initialsOf, roleLabel, useAuth } from '../auth';
import { IconButton } from './ui';

export default function AppHeader({ section = 'HOME', onBack, backLabel, right }) {
  const { unread, open } = useNotifications();
  const { account, isAdmin, openAccount } = useAuth();
  const accountLabel = account ? `Account: ${account.display_name || account.username}, ${roleLabel(account)}` : 'Sign in';
  return (
    <View style={s.nav}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={s.back} accessibilityRole="button" accessibilityLabel={backLabel || 'Back'}>
          <Ionicons name="chevron-back" size={22} color={colors.rose} />
          <Text style={s.backText}>{backLabel || 'Back'}</Text>
        </Pressable>
      ) : (
        <View style={s.logo} accessible accessibilityLabel="Pinay Stars logo">
          <Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" />
        </View>
      )}
      <View style={{ flex: 1 }} accessible accessibilityRole="header" accessibilityLabel={`Pinay Stars, ${section}`}>
        <Text style={s.brand}>Pinay Stars</Text>
        <Text style={s.section}>{section}</Text>
      </View>
      {right ? right : (
        <>
          <IconButton
            icon={unread > 0 ? 'notifications' : 'notifications-outline'}
            onPress={open}
            label="Notifications"
            badge={unread > 0 ? (unread > 9 ? '9+' : String(unread)) : undefined}
          />
          <Pressable
            onPress={openAccount}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={accountLabel}
            style={({ pressed }) => [s.avatar, account && s.avatarMember, isAdmin && s.avatarAdmin, pressed && { opacity: 0.85 }]}
          >
            {account?.avatar_url ? (
              <Image source={{ uri: account.avatar_url }} style={s.avatarImage} />
            ) : account ? (
              <Text style={s.avatarText}>{initialsOf(account.display_name || account.username)}</Text>
            ) : (
              <Ionicons name="person-outline" size={20} color={colors.burgundy} />
            )}
            {account ? <View style={[s.dot, isAdmin && s.dotAdmin]} /> : null}
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.page, paddingTop: space.lg, paddingBottom: space.md },
  logo: { width: touch.min, height: touch.min, borderRadius: radius.sm, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: space.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  logoImage: { width: touch.min, height: touch.min },
  back: { marginRight: space.md, minHeight: touch.min, paddingRight: space.xs, flexDirection: 'row', alignItems: 'center' },
  backText: { ...type.bodyStrong, color: colors.rose },
  brand: { ...type.h2 },
  section: { ...type.kicker, marginTop: 2 },
  avatar: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, marginLeft: space.sm, backgroundColor: colors.blushDeep, alignItems: 'center', justifyContent: 'center' },
  avatarMember: { backgroundColor: colors.rose },
  avatarAdmin: { backgroundColor: colors.burgundy },
  avatarImage: { width: touch.min, height: touch.min, borderRadius: touch.min / 2 },
  avatarText: { ...type.h3, color: colors.white },
  dot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.info, borderWidth: 2, borderColor: colors.background },
  dotAdmin: { backgroundColor: colors.success },
});

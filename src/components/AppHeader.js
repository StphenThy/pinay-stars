import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';
import { useNotifications } from '../notifications';
import { initialsOf, useAuth } from '../auth';

export default function AppHeader({ section = 'HOME', onBack, backLabel, right }) {
  const { unread, open } = useNotifications();
  const { account, isAdmin, openAccount } = useAuth();
  return (
    <View style={s.nav}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={s.back}>
          <Ionicons name="chevron-back" size={20} color={colors.rose} />
          <Text style={s.backText}>{backLabel || 'Back'}</Text>
        </Pressable>
      ) : (
        <View style={s.logo}><Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" /></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.brand}>Pinay Stars</Text>
        <Text style={s.section}>{section}</Text>
      </View>
      {right ? right : (
        <>
          <Pressable onPress={open} hitSlop={10} style={s.iconButton}>
            <Ionicons name={unread > 0 ? 'notifications' : 'notifications-outline'} size={21} color={colors.burgundy} />
            {unread > 0 ? (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
            ) : null}
          </Pressable>
          <Pressable onPress={openAccount} hitSlop={10} style={[s.iconButton, s.avatar, account && s.avatarMember, isAdmin && s.avatarAdmin]}>
            {account?.avatar_url ? (
              <Image source={{ uri: account.avatar_url }} style={s.avatarImage} />
            ) : (
              account
                ? <Text style={[s.avatarText, s.avatarTextAccount]}>{initialsOf(account.display_name || account.username)}</Text>
                : <Ionicons name="person-outline" size={20} color={colors.burgundy} />
            )}
            {account ? <View style={[s.dot, isAdmin && s.dotAdmin]} /> : null}
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  logoImage: { width: 46, height: 46 },
  back: { marginRight: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  backText: { color: colors.rose, fontWeight: '700', fontSize: 16 },
  brand: { fontFamily: fonts.serif, fontSize: 22, color: colors.burgundy, fontWeight: '700' },
  section: { color: colors.rose, fontWeight: '700', letterSpacing: 2, fontSize: 11, marginTop: 1 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  bell: { fontSize: 19 },
  avatar: { marginLeft: 8, backgroundColor: '#EBC4C6' },
  avatarMember: { backgroundColor: colors.rose },
  avatarAdmin: { backgroundColor: colors.burgundy },
  avatarText: { fontSize: 17 },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarTextAccount: { color: colors.white, fontFamily: fonts.serif, fontWeight: '700', fontSize: 15 },
  dot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.info, borderWidth: 2, borderColor: colors.background },
  dotAdmin: { backgroundColor: colors.success },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: colors.background },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});

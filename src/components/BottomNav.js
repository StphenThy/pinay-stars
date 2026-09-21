import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useAuth } from '../auth';

const BASE_ITEMS = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'directory', icon: 'people', label: 'Actresses' },
  { key: 'favorites', icon: 'heart', label: 'Favorites' },
];
const MANAGE_ITEM = { key: 'manage', icon: 'shield-checkmark', label: 'Manage' };
const SUGGEST_ITEM = { key: 'suggest', icon: 'sparkles', label: 'Suggest' };

function Tab({ item, active, badge, warn, onPress }) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: active ? 1 : 0, useNativeDriver: false, friction: 7, tension: 80 }).start();
  }, [active, anim]);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(101,0,29,0)', 'rgba(101,0,29,0.1)'] });
  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Pressable onPress={onPress} style={s.item} hitSlop={6}>
      <Animated.View style={[s.iconPill, { backgroundColor: bg, transform: [{ translateY: lift }] }]}>
        <Ionicons name={active ? item.icon : `${item.icon}-outline`} size={22} color={active ? colors.burgundy : '#7A6A6D'} />
        {badge ? (
          <View style={[s.badge, warn && s.badgeWarn]}><Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text></View>
        ) : null}
      </Animated.View>
      <Text style={[s.label, active && s.labelActive]}>{item.label}</Text>
    </Pressable>
  );
}

export default function BottomNav({ active, onNavigate, favoriteCount, pendingCount }) {
  const { isAdmin } = useAuth();
  const items = [...BASE_ITEMS, isAdmin ? MANAGE_ITEM : SUGGEST_ITEM];
  return (
    <View style={s.bar}>
      {/* Extends the bar colour down into the home-indicator safe area so no background shows beneath the tabs. */}
      <View style={s.insetFill} />
      {items.map(item => (
        <Tab
          key={item.key}
          item={item}
          active={active === item.key}
          badge={item.key === 'favorites' ? favoriteCount : item.key === 'manage' ? pendingCount : 0}
          warn={item.key === 'manage'}
          onPress={() => onNavigate(item.key)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDFC',
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    shadowColor: '#390010',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  insetFill: { position: 'absolute', top: '100%', left: 0, right: 0, height: 60, backgroundColor: '#FFFDFC' },
  item: { alignItems: 'center', minWidth: 72, paddingVertical: 2 },
  iconPill: { width: 56, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: '#7A6A6D', marginTop: 3, letterSpacing: 0.2 },
  labelActive: { color: colors.burgundy, fontWeight: '700' },
  badge: { position: 'absolute', top: 2, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.burgundy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFFDFC' },
  badgeWarn: { backgroundColor: colors.warning },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});

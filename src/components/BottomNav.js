import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, touch, type, fonts } from '../theme';
import { useAuth } from '../auth';

const BASE_ITEMS = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'directory', icon: 'people', label: 'Actresses' },
  { key: 'favorites', icon: 'heart', label: 'Favorites' },
];
const MANAGE_ITEM = { key: 'manage', icon: 'shield-checkmark', label: 'Manage' };
const SUGGEST_ITEM = { key: 'suggest', icon: 'sparkles', label: 'Suggest' };

const BAR_COLOR = '#FFFDFC';

function Tab({ item, active, badge, warn, onPress }) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: active ? 1 : 0, useNativeDriver: false, friction: 7, tension: 80 }).start();
  }, [active, anim]);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(101,0,29,0)', 'rgba(101,0,29,0.1)'] });
  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <Pressable
      onPress={onPress}
      style={s.item}
      accessibilityRole="tab"
      accessibilityLabel={badge ? `${item.label}, ${badge}` : item.label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[s.iconPill, { backgroundColor: bg, transform: [{ translateY: lift }, { scale }] }]}>
        <Ionicons name={active ? item.icon : `${item.icon}-outline`} size={22} color={active ? colors.burgundy : colors.muted} />
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
  const insets = useSafeAreaInsets();
  const items = [...BASE_ITEMS, isAdmin ? MANAGE_ITEM : SUGGEST_ITEM];
  return (
    // The bar extends into the home-indicator area in its own colour, sized per device.
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]} accessibilityRole="tablist">
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
    backgroundColor: BAR_COLOR,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: space.sm,
    ...shadow.float,
    shadowOffset: { width: 0, height: -4 },
  },
  item: { alignItems: 'center', minWidth: 72, minHeight: touch.min + 12, paddingVertical: 2 },
  iconPill: { width: 56, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { ...type.micro, fontSize: 11, lineHeight: 14, fontFamily: fonts.sansSemi, marginTop: space.xs, letterSpacing: 0.2 },
  labelActive: { color: colors.burgundy, fontFamily: fonts.sansBold },
  badge: { position: 'absolute', top: 2, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.burgundy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs, borderWidth: 2, borderColor: BAR_COLOR },
  badgeWarn: { backgroundColor: colors.warning },
  badgeText: { ...type.micro, color: colors.white },
});

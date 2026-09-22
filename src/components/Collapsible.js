import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space, touch } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';

// Slides content open/closed. maxHeight is a generous upper bound, not the exact height.
export function Collapsible({ open, maxHeight = 420, children }) {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [open, anim]);
  return (
    <Animated.View style={{ overflow: 'hidden', opacity: anim, maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, maxHeight] }) }}>
      {children}
    </Animated.View>
  );
}

export function Chevron({ open, onPress, light, label }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open, anim]);
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Pressable onPress={onPress} hitSlop={6} style={[s.chevron, light && s.chevronLight]} accessibilityRole="button" accessibilityLabel={label || (open ? 'Collapse' : 'Expand')} accessibilityState={{ expanded: !!open }}>
      {label ? <Text style={[s.chevronLabel, light && s.chevronLabelLight]}>{label}</Text> : null}
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="chevron-down" size={18} color={light ? colors.white : colors.burgundy} />
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = ({ colors, type }) => StyleSheet.create({
  chevron: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', minHeight: 36, minWidth: 36, borderRadius: radius.pill, paddingVertical: space.xs, paddingHorizontal: space.md, backgroundColor: colors.blush },
  chevronLight: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chevronLabel: { ...type.caption, color: colors.burgundy, marginRight: space.xs },
  chevronLabelLight: { color: colors.white },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

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
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open, anim]);
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[s.chevron, light && s.chevronLight]}>
      {label ? <Text style={[s.chevronLabel, light && s.chevronLabelLight]}>{label}</Text> : null}
      <Animated.Text style={[s.chevronIcon, light && s.chevronLabelLight, { transform: [{ rotate }] }]}>⌄</Animated.Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chevron: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, backgroundColor: 'rgba(101,0,29,0.08)' },
  chevronLight: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chevronLabel: { fontSize: 12, fontWeight: '700', color: '#65001D', marginRight: 6 },
  chevronLabelLight: { color: '#FFFFFF' },
  chevronIcon: { fontSize: 18, lineHeight: 18, fontWeight: '700', color: '#65001D' },
});

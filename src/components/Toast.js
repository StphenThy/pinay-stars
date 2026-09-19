import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const TONES = {
  success: { bg: colors.success, icon: '✓' },
  error: { bg: colors.danger, icon: '!' },
  info: { bg: colors.burgundy, icon: '✦' },
};

export default function Toast({ toast, onDismiss, onPress }) {
  const slide = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (!toast) return undefined;
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const timer = setTimeout(onDismiss, toast.duration || 2400);
    return () => {
      clearTimeout(timer);
      slide.setValue(-60);
    };
  }, [toast, onDismiss, slide]);

  if (!toast) return null;
  const tone = TONES[toast.tone] || TONES.info;

  return (
    <Animated.View pointerEvents="box-none" style={[s.wrap, { transform: [{ translateY: slide }] }]}>
      <Pressable onPress={() => { onDismiss(); onPress && onPress(); }} style={s.pill}>
        <View style={[s.icon, { backgroundColor: tone.bg }]}><Text style={s.iconText}>{tone.icon}</Text></View>
        <Text style={s.text} numberOfLines={1}>{toast.message}</Text>
        <Text style={s.chevron}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  pill: { flexDirection: 'row', alignItems: 'center', maxWidth: '88%', backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 7, paddingLeft: 7, paddingRight: 12, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  icon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  iconText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  text: { color: colors.textStrong, fontWeight: '600', fontSize: 13, flexShrink: 1 },
  chevron: { color: colors.muted, fontSize: 18, marginLeft: 8, lineHeight: 18 },
});

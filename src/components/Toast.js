import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';

// The dot behind the icon is a filled disc with white on it, so it uses the fill
// colours rather than the ones the same words are written in.
const tonesFor = colors => ({
  success: { bg: colors.success, icon: 'checkmark' },
  error: { bg: colors.dangerFill, icon: 'alert' },
  info: { bg: colors.primary, icon: 'sparkles' },
});

export default function Toast({ toast, onDismiss, onPress }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
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
  const tones = tonesFor(colors);
  const tone = tones[toast.tone] || tones.info;

  return (
    <Animated.View pointerEvents="box-none" style={[s.wrap, { transform: [{ translateY: slide }] }]}>
      <Pressable
        onPress={() => { onDismiss(); onPress && onPress(); }}
        style={s.pill}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${toast.tone === 'error' ? 'Error' : 'Notice'}: ${toast.message}. Opens notifications.`}
      >
        <View style={[s.icon, { backgroundColor: tone.bg }]}><Ionicons name={tone.icon} size={14} color={colors.white} /></View>
        <Text style={s.text} numberOfLines={1}>{toast.message}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} style={s.chevron} />
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = ({ colors, type, shadow }) => StyleSheet.create({
  wrap: { position: 'absolute', top: space.sm, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  pill: { flexDirection: 'row', alignItems: 'center', maxWidth: '88%', minHeight: 44, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: space.sm, paddingLeft: space.sm, paddingRight: space.md, borderWidth: 1, borderColor: colors.line, ...shadow.float },
  icon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: space.sm },
  text: { ...type.smallStrong, flexShrink: 1 },
  chevron: { marginLeft: space.sm },
});

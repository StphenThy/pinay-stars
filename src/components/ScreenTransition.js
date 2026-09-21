import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * Animates each screen in when the navigation stack changes: pushed screens slide up from
 * the right edge and fade, tab switches cross-fade. Keyed by the caller so a new key mounts
 * a fresh instance and the old one disappears immediately (no double-render cost).
 */
export default function ScreenTransition({ children, pushed }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: pushed ? 320 : 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim, pushed]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [pushed ? 40 : 0, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [pushed ? 0 : 10, 0] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim, transform: [{ translateX }, { translateY }] }]}>
      {children}
    </Animated.View>
  );
}

import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

// A Pressable that eases to 97% while held, so cards and rows feel tappable.
export default function PressScale({ children, style, onPress, disabled, scaleTo = 0.97, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = v => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 6, tension: 120 }).start();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

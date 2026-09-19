import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../haptics';

// Display: <StarRating value={4.3} /> — Interactive: <StarRating value={n} onChange={setN} />
export default function StarRating({ value = 0, onChange, size = 16, color = colors.gold, muted = '#D9C7CA', showValue, count, style }) {
  const interactive = typeof onChange === 'function';
  const stars = [1, 2, 3, 4, 5].map(i => {
    const diff = value - (i - 1);
    const name = diff >= 0.75 ? 'star' : diff >= 0.25 ? 'star-half' : 'star-outline';
    const icon = <Ionicons name={interactive ? (i <= value ? 'star' : 'star-outline') : name} size={size} color={(interactive ? i <= value : diff >= 0.25) ? color : muted} />;
    if (!interactive) return <View key={i} style={{ marginRight: size * 0.12 }}>{icon}</View>;
    return (
      <Pressable key={i} onPress={() => { haptic.select(); onChange(i); }} hitSlop={6} style={{ marginRight: size * 0.18 }}>
        {icon}
      </Pressable>
    );
  });

  return (
    <View style={[s.row, style]}>
      {stars}
      {showValue ? (
        <Text style={[s.value, { fontSize: size * 0.85, color: value ? colors.textStrong : colors.muted }]}>
          {value ? value.toFixed(1) : 'New'}{count !== undefined && value ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  value: { marginLeft: 6, fontWeight: '700' },
});

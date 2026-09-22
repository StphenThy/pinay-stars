import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { touch } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';
import { haptic } from '../haptics';

// Display: <StarRating value={4.3} /> — Interactive: <StarRating value={n} onChange={setN} />
// `color` and `muted` default to the theme, so they are resolved in the body rather than
// in the parameter list — a default there cannot see the theme this component just read.
export default function StarRating({ value = 0, onChange, size = 16, color, muted, showValue, count, style }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const starColor = color || colors.gold;
  const mutedColor = muted || colors.line;
  const interactive = typeof onChange === 'function';
  const label = value ? `Rated ${value.toFixed(1)} out of 5${count !== undefined ? `, ${count} ratings` : ''}` : 'Not yet rated';
  const stars = [1, 2, 3, 4, 5].map(i => {
    const diff = value - (i - 1);
    const name = diff >= 0.75 ? 'star' : diff >= 0.25 ? 'star-half' : 'star-outline';
    const icon = <Ionicons name={interactive ? (i <= value ? 'star' : 'star-outline') : name} size={size} color={(interactive ? i <= value : diff >= 0.25) ? starColor : mutedColor} />;
    if (!interactive) return <View key={i} style={{ marginRight: size * 0.12 }}>{icon}</View>;
    return (
      <Pressable
        key={i}
        onPress={() => { haptic.select(); onChange(i); }}
        style={s.starTarget}
        accessibilityRole="button"
        accessibilityLabel={`${i} star${i === 1 ? '' : 's'}`}
        accessibilityState={{ selected: i <= value }}
      >
        {icon}
      </Pressable>
    );
  });

  return (
    <View style={[s.row, style]} accessible={!interactive} accessibilityLabel={interactive ? undefined : label}>
      {stars}
      {showValue ? (
        <Text style={[s.value, { fontSize: size * 0.85, color: value ? colors.textStrong : colors.muted }]}>
          {value ? value.toFixed(1) : 'New'}{count !== undefined && value ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = ({ type }) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  starTarget: { minWidth: touch.min, minHeight: touch.min, alignItems: 'center', justifyContent: 'center' },
  value: { ...type.smallStrong, marginLeft: 6 },
});

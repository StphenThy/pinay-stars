import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, space, themes, touch } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';
import { haptic } from '../haptics';

const THEME_NAMES = { light: 'Daylight', dark: 'Velvet Noir' };

const OPTIONS = [
  { preference: 'light', icon: 'sunny', title: THEME_NAMES.light, body: 'Blush and burgundy on warm white.' },
  { preference: 'dark', icon: 'moon', title: THEME_NAMES.dark, body: 'Wine and gold on near-black.' },
  { preference: 'system', icon: 'phone-portrait', title: 'Device', body: null },
];

/**
 * Three swatches taken straight from the palette being offered, so each row shows what it
 * does instead of describing it. They are drawn from the *other* theme's palette on
 * purpose — that is the whole point of a preview.
 */
function Swatches({ mode }) {
  const s = useThemedStyles(makeStyles);
  const { colors } = themes[mode];
  return (
    <View style={s.swatches}>
      {[colors.background, colors.primary, colors.gold].map((c, i) => (
        <View key={i} style={[s.swatch, { backgroundColor: c, borderColor: colors.line }]} />
      ))}
    </View>
  );
}

/** The appearance control: three rows, one tap, saved to the device. */
export default function ThemePicker() {
  const { colors, mode, preference, deviceScheme, setPreference } = useTheme();
  const s = useThemedStyles(makeStyles);

  return (
    <View style={s.list} accessibilityRole="radiogroup">
      {OPTIONS.map(option => {
        const active = preference === option.preference;
        const system = option.preference === 'system';
        // The Device row previews what following the phone means right now, so it shows
        // the scheme the phone is on rather than the palette the app happens to be using.
        const swatchMode = system ? deviceScheme : option.preference;
        const body = system ? `Follows your phone — ${THEME_NAMES[deviceScheme]} right now.` : option.body;

        return (
          <Pressable
            key={option.preference}
            onPress={() => { haptic.select(); setPreference(option.preference); }}
            style={[s.option, active && s.optionActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.title} theme. ${body}`}
          >
            <Ionicons
              name={active ? option.icon : `${option.icon}-outline`}
              size={20}
              color={active ? colors.burgundy : colors.muted}
              style={s.optionIcon}
            />
            <View style={s.optionCopy}>
              <Text style={[s.optionTitle, active && s.optionTitleActive]}>{option.title}</Text>
              <Text style={s.optionBody}>{body}</Text>
            </View>
            <Swatches mode={swatchMode} />
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={active ? colors.burgundy : 'transparent'}
              style={s.optionCheck}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors, type }) => StyleSheet.create({
  list: { marginTop: space.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.min + 12,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    marginBottom: space.sm,
  },
  optionActive: { borderColor: colors.burgundy, backgroundColor: colors.blush },
  optionIcon: { width: 24, textAlign: 'center', marginRight: space.md },
  optionCopy: { flex: 1, marginRight: space.sm },
  optionTitle: { ...type.smallStrong },
  optionTitleActive: { color: colors.burgundy },
  optionBody: { ...type.caption, fontSize: 11, lineHeight: 15, marginTop: 2 },
  // The check keeps its space when inactive so the swatches do not shift on selection.
  optionCheck: { marginLeft: space.sm },
  swatches: { flexDirection: 'row' },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, marginLeft: space.xs },
});

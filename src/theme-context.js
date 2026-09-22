import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, View } from 'react-native';
import { themes } from './theme';

// Appearance is a device preference, not an account one: it stays on the phone, so a
// guest gets the same theme as a signed-in member and it survives signing out.
const THEME_KEY = 'pinay-stars:appearance';

// What the user picked. 'system' defers to the phone, the other two pin a palette.
const PREFERENCES = ['light', 'dark', 'system'];

const deviceMode = () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

/**
 * The live theme plus the controls for it. The theme half (colors, type, shadow,
 * gradients, statusMeta, mode, isDark) is what styles are built from; `preference` and
 * `setPreference` are what the Appearance card in the account screen reads and calls.
 *
 * `preference` and `mode` are not the same thing: the preference is the choice, the mode
 * is the palette that choice currently resolves to. They differ whenever the preference
 * is 'system' — which is exactly when the mode can change without anyone tapping.
 */
const ThemeContext = createContext({ ...themes.light, preference: 'light', setPreference: () => {} });

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('system');
  const [deviceScheme, setDeviceScheme] = useState(deviceMode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(THEME_KEY)
      .then(saved => { if (live && PREFERENCES.includes(saved)) setPreferenceState(saved); })
      .catch(() => {})
      .finally(() => live && setReady(true));
    return () => { live = false; };
  }, []);

  // The phone can change its own mode while the app is open — at sunset, or from the
  // control centre — so listen rather than sampling once at launch.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setDeviceScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback(next => {
    const choice = PREFERENCES.includes(next) ? next : 'system';
    setPreferenceState(choice);
    AsyncStorage.setItem(THEME_KEY, choice).catch(() => {});
  }, []);

  const mode = preference === 'system' ? deviceScheme : preference;

  const value = useMemo(() => ({
    ...themes[mode],
    preference,
    deviceScheme,
    setPreference,
  }), [mode, preference, deviceScheme, setPreference]);

  // Nothing renders until the saved preference is known, so the app never flashes the day
  // theme on its way into the night one. It holds the brand backdrop rather than a blank
  // frame, which is what the app shows while the fonts load anyway.
  if (!ready) return <View style={{ flex: 1, backgroundColor: themes[mode].gradients.hero.colors[0] }} />;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * The live theme: { mode, isDark, colors, type, statusMeta, shadow, gradients } plus
 * { preference, deviceScheme, setPreference } for the screen that changes it.
 */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Builds a screen's StyleSheet from the live theme and rebuilds it when the theme
 * changes. `factory` must be a module-level function — one identity, so the styles are
 * created once per theme rather than once per render:
 *
 *   const makeStyles = ({ colors, type, shadow }) => StyleSheet.create({ ... });
 *   const s = useThemedStyles(makeStyles);
 */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

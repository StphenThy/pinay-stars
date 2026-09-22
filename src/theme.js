// Two families, loaded in App.js with expo-font so every phone renders them identically:
// Playfair Display for names, headings and display text; Manrope for everything else.
// Custom fonts must be referenced by their exact face (weight) name: pairing a family
// with a fontWeight it does not have makes iOS silently fall back to San Francisco.
export const fonts = {
  serif: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemi: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
};

/** The font map handed to useFonts(); keys must match the names above. */
export const fontAssets = {
  PlayfairDisplay_700Bold: require('@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf'),
  PlayfairDisplay_400Regular_Italic: require('@expo-google-fonts/playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf'),
  Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
};

// Two palettes with the same keys, so every screen keeps one vocabulary and only the
// values move. The names are roles, not literal hues: `burgundy` is the brand colour you
// write with, `primary` the brand colour you fill with. In the day theme they are the
// same ink; in Velvet Noir they part ways, because a heading has to lighten against a
// near-black page while a button still wants to be wine.
//
// `white` always means pure white. It is the colour of text and icons sitting on a photo
// or on a `primary` fill, so it never follows the theme; card backgrounds use `surface`.
const light = {
  burgundy: '#65001D',
  primary: '#65001D',
  onPrimary: '#FFFFFF',
  burgundyDeep: '#4A0015',
  burgundySoft: '#8B1C3D',
  gold: '#F6BE25',
  goldSoft: '#FFF3D1',
  goldText: '#7A5200',
  background: '#FFF9F8',
  surface: '#FFFFFF',
  // The card behind an error state: the page nudged a shade towards danger.
  surfaceAlert: '#FFFBFA',
  // The tab bar sits a shade off the cards so it reads as a separate plane, and the
  // active tab is a soft wash of the brand colour on it. `navActiveClear` is the same
  // wash at zero alpha: the animation interpolates between the two, so they have to be
  // the same hue or the pill greys out halfway.
  bar: '#FFFDFC',
  navActive: 'rgba(101,0,29,0.10)',
  navActiveClear: 'rgba(101,0,29,0)',
  white: '#FFFFFF',
  blush: '#FBEDEF',
  blushDeep: '#FFE4E8',
  rose: '#99505C',
  // The member avatar and other soft-brand discs: a fill, so it keeps white legible.
  roseFill: '#99505C',
  text: '#4F3A3E',
  textStrong: '#2E1B1F',
  // 5.5:1 on the page background (the previous #94777C was 3.9:1, below WCAG AA).
  muted: '#7A5F64',
  line: '#F0E3E5',
  // Text colours for use on burgundy / photo backgrounds.
  onDark: '#FFFFFF',
  onDarkSoft: '#FBD5D9',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  // Translucent fills for chips, inputs and cards that sit on the hero gradient.
  onDarkFill: 'rgba(255,255,255,0.12)',
  onDarkFillStrong: 'rgba(255,255,255,0.2)',
  onDarkLine: 'rgba(255,255,255,0.28)',
  // `danger` is the colour you write a warning in; `dangerFill` is the destructive
  // button, with `onDanger` as its label. At night the two split, the same way the
  // brand colour does: the writing lightens, the fill stays deep.
  danger: '#B3261E',
  dangerFill: '#B3261E',
  onDanger: '#FFFFFF',
  dangerSoft: '#FDECEA',
  success: '#1E7B4C',
  successSoft: '#E6F4EC',
  info: '#3A5BA0',
  infoSoft: '#E9EEF9',
  warning: '#9A6200',
  // Same split as danger: one colour to write in, one to fill a badge with.
  warningFill: '#9A6200',
  warningSoft: '#FFF4DB',
  warningLine: '#F3DFA6',
};

// Velvet Noir: a wine-black cinema palette, not a grey inversion of the day theme. Pages
// sit on near-black wine, cards lift one step out of it, headings turn blush, the soft
// fills go from pale pink to deep plum, and gold keeps its job as the accent. Every text
// colour clears WCAG AA (4.5:1) on the surface it is written on.
const dark = {
  burgundy: '#F7C9D3',
  primary: '#8E0B31',
  onPrimary: '#FFFFFF',
  burgundyDeep: '#0E0609',
  burgundySoft: '#5A1128',
  gold: '#F6BE25',
  goldSoft: '#3A2A06',
  goldText: '#F3D488',
  background: '#140A0E',
  surface: '#1E1216',
  surfaceAlert: '#231318',
  bar: '#1A0F14',
  navActive: 'rgba(247,201,211,0.14)',
  navActiveClear: 'rgba(247,201,211,0)',
  white: '#FFFFFF',
  blush: '#2A1920',
  blushDeep: '#3A222B',
  rose: '#D79AA8',
  roseFill: '#7A3A48',
  text: '#D9C7CC',
  textStrong: '#F6ECEE',
  muted: '#A78E95',
  line: '#33222A',
  onDark: '#FFFFFF',
  onDarkSoft: '#FBD5D9',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  onDarkFill: 'rgba(255,255,255,0.10)',
  onDarkFillStrong: 'rgba(255,255,255,0.18)',
  onDarkLine: 'rgba(255,255,255,0.24)',
  danger: '#FF8A80',
  dangerFill: '#8E2B24',
  onDanger: '#FFE9E7',
  dangerSoft: '#3B1512',
  success: '#6FD79E',
  successSoft: '#10301F',
  info: '#9DB6F0',
  infoSoft: '#16203A',
  warning: '#F0C46A',
  warningFill: '#7A5A16',
  warningSoft: '#33260C',
  warningLine: '#5A451A',
};

export const palettes = { light, dark };

// 4-point spacing scale. `page` is the horizontal gutter every screen uses.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, page: 20 };

// Radius hierarchy: xs for tags/inputs, sm for buttons, md for images/inputs,
// lg for cards, xl for hero cards and sheets, pill for chips and badges.
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

// Minimum touch target (Apple HIG / WCAG 2.5.5).
export const touch = { min: 44 };

const statusMetaFor = c => ({
  active:   { label: 'Active',             fg: c.success,    bg: c.successSoft },
  review:   { label: 'Needs Verification', fg: c.warning,    bg: c.warningSoft },
  draft:    { label: 'Draft',              fg: c.muted,      bg: c.blush },
  on_leave: { label: 'On Leave',           fg: c.info,       bg: c.infoSoft },
  hiatus:   { label: 'Hiatus',             fg: c.info,       bg: c.infoSoft },
  overseas: { label: 'Overseas',           fg: c.burgundy,   bg: c.blushDeep },
  memoriam: { label: 'In Memoriam',        fg: c.textStrong, bg: c.line },
});

// Type scale: 10 · 11 · 12 · 13 · 15 · 16 · 18 · 22 · 28 · 36.
// Serif from 18 up (h3 and larger), sans below. Spread these into styles and override
// only colour when the text sits on a dark background.
const typeFor = c => ({
  display:    { fontFamily: fonts.serif, fontSize: 36, lineHeight: 42, color: c.burgundy },
  h1:         { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: c.burgundy },
  h2:         { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: c.burgundy },
  h3:         { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24, color: c.burgundy },
  title:      { fontFamily: fonts.sansBold, fontSize: 16, lineHeight: 22, color: c.textStrong },
  body:       { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: c.text },
  bodyStrong: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 22, color: c.textStrong },
  small:      { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: c.text },
  smallStrong:{ fontFamily: fonts.sansSemi, fontSize: 13, lineHeight: 18, color: c.textStrong },
  caption:    { fontFamily: fonts.sansSemi, fontSize: 12, lineHeight: 16, color: c.muted },
  kicker:     { fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase', color: c.rose },
  micro:      { fontFamily: fonts.sansBold, fontSize: 10, lineHeight: 12, color: c.muted },
  button:     { fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 20 },
  buttonSmall:{ fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 18 },
});

// Elevation tiers. Cards sit softly on the page; floating things (toast, nav) lift more.
// A drop shadow barely registers on a near-black page, so Velvet Noir leans on its own
// lighter card surface and only deepens the shadow enough to separate floating layers.
const shadowFor = isDark => ({
  card: {
    shadowColor: isDark ? '#000000' : '#390010',
    shadowOpacity: isDark ? 0.45 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: isDark ? '#000000' : '#390010',
    shadowOpacity: isDark ? 0.6 : 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

// The one brand backdrop, shared by the intro, entry and sign-in screens.
const gradientsFor = isDark => ({
  hero: isDark
    ? { colors: ['#1C0710', '#2E0A18', '#0E040A'], locations: [0, 0.55, 1] }
    : { colors: ['#4A0015', '#730025', '#3B0012'], locations: [0, 0.55, 1] },
  // Scrim laid over photos so white text stays readable.
  scrim: isDark
    ? { colors: ['transparent', 'rgba(14,4,10,0.6)', 'rgba(14,4,10,0.96)'], locations: [0, 0.35, 1] }
    : { colors: ['transparent', 'rgba(50,0,15,0.55)', 'rgba(50,0,15,0.94)'], locations: [0, 0.35, 1] },
});

/** Everything a screen needs for one mode. Built once per mode, then shared. */
export function buildTheme(mode) {
  const isDark = mode === 'dark';
  const colors = palettes[isDark ? 'dark' : 'light'];
  return {
    mode: isDark ? 'dark' : 'light',
    isDark,
    colors,
    type: typeFor(colors),
    statusMeta: statusMetaFor(colors),
    shadow: shadowFor(isDark),
    gradients: gradientsFor(isDark),
  };
}

export const themes = { light: buildTheme('light'), dark: buildTheme('dark') };

// The day theme, spread across the names screens have always imported. These stay for
// the handful of places that need a colour outside a component — default props and
// module constants. Anything that must follow the toggle reads the live theme through
// useTheme() / useThemedStyles() instead.
export const { colors, type, statusMeta, shadow, gradients } = themes.light;

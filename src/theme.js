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

export const colors = {
  burgundy: '#65001D',
  burgundyDeep: '#4A0015',
  burgundySoft: '#8B1C3D',
  gold: '#F6BE25',
  goldSoft: '#FFF3D1',
  goldText: '#7A5200',
  background: '#FFF9F8',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  blush: '#FBEDEF',
  blushDeep: '#FFE4E8',
  rose: '#99505C',
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
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  success: '#1E7B4C',
  successSoft: '#E6F4EC',
  info: '#3A5BA0',
  infoSoft: '#E9EEF9',
  warning: '#9A6200',
  warningSoft: '#FFF4DB',
  warningLine: '#F3DFA6',
};

export const statusMeta = {
  active:   { label: 'Active',            fg: colors.success, bg: colors.successSoft },
  review:   { label: 'Needs Verification', fg: colors.warning, bg: colors.warningSoft },
  draft:    { label: 'Draft',             fg: colors.muted,   bg: colors.blush },
  on_leave: { label: 'On Leave',          fg: colors.info,    bg: colors.infoSoft },
  hiatus:   { label: 'Hiatus',            fg: colors.info,    bg: colors.infoSoft },
  overseas: { label: 'Overseas',          fg: colors.burgundy, bg: colors.blushDeep },
  memoriam: { label: 'In Memoriam',       fg: colors.textStrong, bg: colors.line },
};

// 4-point spacing scale. `page` is the horizontal gutter every screen uses.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, page: 20 };

// Radius hierarchy: xs for tags/inputs, sm for buttons, md for images/inputs,
// lg for cards, xl for hero cards and sheets, pill for chips and badges.
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

// Minimum touch target (Apple HIG / WCAG 2.5.5).
export const touch = { min: 44 };

// Type scale: 10 · 11 · 12 · 13 · 15 · 16 · 18 · 22 · 28 · 36.
// Serif from 18 up (h3 and larger), sans below. Spread these into styles and override
// only colour when the text sits on a dark background.
export const type = {
  display:    { fontFamily: fonts.serif, fontSize: 36, lineHeight: 42, color: colors.burgundy },
  h1:         { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.burgundy },
  h2:         { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.burgundy },
  h3:         { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24, color: colors.burgundy },
  title:      { fontFamily: fonts.sansBold, fontSize: 16, lineHeight: 22, color: colors.textStrong },
  body:       { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 22, color: colors.textStrong },
  small:      { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.text },
  smallStrong:{ fontFamily: fonts.sansSemi, fontSize: 13, lineHeight: 18, color: colors.textStrong },
  caption:    { fontFamily: fonts.sansSemi, fontSize: 12, lineHeight: 16, color: colors.muted },
  kicker:     { fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.rose },
  micro:      { fontFamily: fonts.sansBold, fontSize: 10, lineHeight: 12, color: colors.muted },
  button:     { fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 20 },
  buttonSmall:{ fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 18 },
};

// Elevation tiers. Cards sit softly on the page; floating things (toast, nav) lift more.
export const shadow = {
  card: {
    shadowColor: '#390010',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: '#390010',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// The one brand backdrop, shared by the intro, entry and sign-in screens.
export const gradients = {
  hero: { colors: ['#4A0015', '#730025', '#3B0012'], locations: [0, 0.55, 1] },
  // Scrim laid over photos so white text stays readable.
  scrim: { colors: ['transparent', 'rgba(50,0,15,0.55)', 'rgba(50,0,15,0.94)'], locations: [0, 0.35, 1] },
};

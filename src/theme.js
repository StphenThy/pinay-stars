import { Platform } from 'react-native';

// iOS has no font literally named "serif"; it silently falls back to San Francisco.
export const fonts = {
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }),
};

export const colors = {
  burgundy: '#65001D',
  burgundyDeep: '#4A0015',
  burgundySoft: '#8B1C3D',
  gold: '#F6BE25',
  background: '#FFF9F8',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  blush: '#FBEDEF',
  blushDeep: '#FFE4E8',
  rose: '#99505C',
  text: '#4F3A3E',
  textStrong: '#2E1B1F',
  muted: '#94777C',
  line: '#F0E3E5',
  danger: '#B3261E',
  dangerSoft: '#FDECEA',
  success: '#1E7B4C',
  successSoft: '#E6F4EC',
  info: '#3A5BA0',
  infoSoft: '#E9EEF9',
  warning: '#9A6200',
  warningSoft: '#FFF4DB',
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

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };

export const type = {
  display: { fontFamily: fonts.serif, fontWeight: '700', color: colors.burgundy },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: colors.rose },
};

export const shadow = {
  card: {
    shadowColor: '#390010',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

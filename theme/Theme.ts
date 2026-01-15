export const colors = {
  pinkBase: '#F6C1CC',
  pinkPaywall: '#FAD6DE',
  pinkHeader: '#F2A9B7',
  pinkMid: '#F7C6D0',
  pinkLow: '#EFE1E4',
  pinkMonthFallback: '#E8A5B5',
  black: '#000000',
  white: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#3A2F32',
  keepGreen: '#7CFFB1',
  deletePurple: '#B47BFF',
  accentPinkIcon: '#F2A1B2',
  checkGreen: '#22C55E',
  overlay: 'rgba(0,0,0,0.5)',
  cardBackground: '#FFFFFF',
};

export const gradients = {
  recents: ['#00C89B', '#1E5BFF'] as const,
  random: ['#8B3CFF', '#7DB6FF'] as const,
  onThisDay: ['#FF8C42', '#FFD166'] as const,
  bookmarks: ['#3B0F5F', '#B86CFF'] as const,
  stats: ['#FF6B5E', '#FF4F8B'] as const,
  faq: ['#1B5E55', '#2F7B6E'] as const,
  email: ['#1E63FF', '#3BA6FF'] as const,
  instagram: ['#D245FF', '#FFB84A'] as const,
  rate: ['#F0C433', '#F9E27A'] as const,
};

export const monthColors: Record<string, { bg: string; text: string }> = {
  'Jan 2024': { bg: '#CFEFFF', text: '#000000' },
  'Dec 2023': { bg: '#0B2F5F', text: '#FFFFFF' },
  'Nov 2023': { bg: '#FF4A2F', text: '#000000' },
  'Oct 2023': { bg: '#F2A44A', text: '#000000' },
  'Sep 2023': { bg: '#F4D54A', text: '#000000' },
  'Aug 2023': { bg: '#7CFFB1', text: '#000000' },
  'Jul 2023': { bg: '#E30F0F', text: '#FFFFFF' },
  'Jun 2023': { bg: '#B47BFF', text: '#FFFFFF' },
  'May 2023': { bg: '#00C89B', text: '#000000' },
  'Apr 2023': { bg: '#1E5BFF', text: '#FFFFFF' },
  'Mar 2023': { bg: '#FFB84A', text: '#000000' },
  'Feb 2023': { bg: '#D245FF', text: '#FFFFFF' },
};

export const typography = {
  primaryFont: 'System',
  titleHeavy: {
    fontSize: 46,
    fontWeight: '900' as const,
  },
  logoHeavy: {
    fontSize: 50,
    fontWeight: '900' as const,
  },
  sectionTitle: {
    fontSize: 38,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  small: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  photoCard: 36,
  bigPill: 999,
  paywallToggle: 28,
};

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  stamp: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const iconSizes = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

const Theme = {
  colors,
  gradients,
  monthColors,
  typography,
  spacing,
  radii,
  shadows,
  iconSizes,
};

export default Theme;

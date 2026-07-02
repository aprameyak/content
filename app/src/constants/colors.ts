// Chronicle Design System — Purple Accent
export const Colors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundElevated: '#141414',
  backgroundModal: '#1C1C1C',
  backgroundCard: '#111111',

  // Borders
  border: '#1E1E1E',
  borderLight: '#2A2A2A',
  borderFocus: '#7C3AED',

  // Text
  text: '#F0EDE8',
  textSecondary: '#8A8480',
  textMuted: '#5A5450',
  textDisabled: '#3A3630',

  // Accent (Purple)
  accent: '#7C3AED',         // Violet-600
  accentLight: '#8B5CF6',    // Violet-500
  accentDim: '#5B21B6',      // Violet-700
  accentSurface: '#2D1B69',  // Dark purple surface

  // Status
  error: '#C0392B',
  errorDim: '#7B241C',
  success: '#27AE60',
  warning: '#E67E22',

  // Special
  recordingRed: '#E74C3C',
  recordingRedDim: '#CB4335',
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;

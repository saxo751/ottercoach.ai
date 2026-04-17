import { Platform } from 'react-native';

export const fonts = {
  // Anthropic: Poppins for headings, Lora for body
  heading: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  body: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

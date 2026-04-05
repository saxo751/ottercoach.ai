import { Platform } from 'react-native';

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  body: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
};

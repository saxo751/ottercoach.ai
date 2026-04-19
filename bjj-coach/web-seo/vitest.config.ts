import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const astroContentShim = fileURLToPath(
  new URL('./src/lib/__tests__/astro-content-shim.ts', import.meta.url),
);

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      'astro:content': astroContentShim,
      '@': srcDir,
    },
  },
});

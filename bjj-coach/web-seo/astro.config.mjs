import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://theottercoach.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'never',
});

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://theottercoach.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'never',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: true }),
    sitemap({
      filter: (page) => !page.includes('/draft/'),
    }),
  ],
});

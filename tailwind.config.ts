import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/utils/**/*.ts',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;

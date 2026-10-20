import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/utils/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        // 二次元主色盘：樱花 / 天空 / 紫罗兰 / 薄荷 / 暖阳
        ink: {
          DEFAULT: '#3B3355',
          soft: '#7C749B',
          mute: '#A79FBC',
        },
        sakura: {
          50: '#FFF6FA',
          100: '#FFE8F2',
          200: '#FFD2E5',
          300: '#FFB3D3',
          400: '#FF93C1',
          500: '#FF7FB4',
          600: '#F2569B',
          700: '#D63C82',
        },
        sky: {
          50: '#F2FAFF',
          100: '#E1F3FF',
          200: '#C4E8FF',
          300: '#9BD8FF',
          400: '#7CC8FF',
          500: '#4FAEF5',
          600: '#2D8FD8',
        },
        lumi: {
          50: '#F8F4FF',
          100: '#EEE6FF',
          200: '#DFD0FF',
          300: '#C9B4FF',
          400: '#A88CFF',
          500: '#8E6CF0',
          600: '#7350D8',
        },
        mint: {
          50: '#F1FFFB',
          100: '#DBFBF2',
          200: '#B7F5E3',
          300: '#8BEBCF',
          400: '#5FE0BE',
          500: '#2FC79F',
          600: '#17A382',
        },
        sun: {
          50: '#FFFBF0',
          100: '#FFF2D8',
          200: '#FFE3AC',
          300: '#FFD07C',
          400: '#FFC46B',
          500: '#F5A32C',
          600: '#D9850F',
        },
      },
      fontFamily: {
        rounded: ['PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'ui-rounded', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // 3D 贴纸感：底部实心投影 + 柔和扩散
        sticker: '0 4px 0 0 #FFE1EF',
        'sticker-lg': '0 6px 0 -1px #FFE1EF, 0 18px 34px -22px rgba(120, 84, 168, 0.45)',
        glow: '0 0 0 4px rgba(255, 167, 208, 0.28)',
        pop: '0 14px 34px -16px rgba(242, 86, 155, 0.55)',
      },
      keyframes: {
        'ac-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'ac-pop': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'ac-twinkle': {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%': { opacity: '0.95', transform: 'scale(1.15)' },
        },
      },
      animation: {
        'ac-float': 'ac-float 5s ease-in-out infinite',
        'ac-pop': 'ac-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'ac-twinkle': 'ac-twinkle 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

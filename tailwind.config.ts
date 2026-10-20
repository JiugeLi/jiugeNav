import type { Config } from 'tailwindcss';

/**
 * SoloLink 主题色盘（浅色 · 冷调）
 * ------------------------------------------------------------
 * 常规浅色语义：50/100/200 = 浅底与描边，300 = 中间态，
 * 400/500 = 主强调，600/700 = 深色强调文字。
 * 整体偏蓝灰与靛蓝，不使用粉色。
 */
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
        // 文字与表面
        ink: {
          DEFAULT: '#101828',
          soft: '#475467',
          mute: '#8A94AB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F7F9FE',
          3: '#EEF2FB',
        },
        // 主色：靛蓝
        sakura: {
          50: '#EFF4FF',
          100: '#DFE9FF',
          200: '#C3D6FF',
          300: '#9DBCFF',
          400: '#6D97FF',
          500: '#4F7CFF',
          600: '#3560E0',
          700: '#2848B8',
        },
        // 青色：辅助色
        sky: {
          50: '#ECFBFD',
          100: '#D3F5FA',
          200: '#A9EBF4',
          300: '#6ED9E8',
          400: '#2FB8D8',
          500: '#1A9CBB',
          600: '#147D97',
        },
        // 靛紫：渐变搭档
        lumi: {
          50: '#F4F1FF',
          100: '#E9E3FF',
          200: '#D4C9FF',
          300: '#B5A2FF',
          400: '#8F72FF',
          500: '#7C5CF5',
          600: '#6444D6',
        },
        // 薄荷绿：成功
        mint: {
          50: '#ECFDF7',
          100: '#D3FBEE',
          200: '#A6F2DC',
          300: '#63E3C2',
          400: '#2EC4A8',
          500: '#17A289',
          600: '#0F816D',
        },
        // 暖金：少量点缀
        sun: {
          50: '#FFF8E8',
          100: '#FFEFC9',
          200: '#FFE095',
          300: '#FFCB5C',
          400: '#F5B027',
          500: '#D98F10',
          600: '#B47309',
        },
      },
      fontFamily: {
        rounded: ['PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'ui-rounded', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      boxShadow: {
        // 浅色底的柔和层叠阴影，不用位移
        sticker: '0 1px 2px rgba(16, 24, 40, 0.05)',
        'sticker-lg': '0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 28px -18px rgba(16, 24, 40, 0.16)',
        glow: '0 0 0 3px rgba(79, 124, 255, 0.16)',
        pop: '0 20px 44px -24px rgba(16, 24, 40, 0.28)',
      },
    },
  },
  plugins: [],
} satisfies Config;

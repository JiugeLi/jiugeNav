import type { Config } from 'tailwindcss';

/**
 * SoloLink 主题色盘（深色 · 冷调二次元）
 * ------------------------------------------------------------
 * 注意：本项目是深色底，色阶方向与常规相反——
 *   50 / 100 / 200 = 深色表面、描边（低对比）
 *   300            = 中间态（暗号图标、弱强调）
 *   400 / 500      = 主强调色（清晰可见）
 *   600 / 700      = 高亮（用于小字、链接、hover）
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
          DEFAULT: '#E7ECFF',
          soft: '#A3AEDE',
          mute: '#707DA8',
        },
        surface: {
          DEFAULT: '#151B3D',
          2: '#1B2249',
          3: '#232B5C',
        },
        // 主色：宝蓝（原樱花位）
        sakura: {
          50: '#141A3D',
          100: '#1D2551',
          200: '#2A3875',
          300: '#3F5BB8',
          400: '#4F7CFF',
          500: '#6F96FF',
          600: '#93B2FF',
          700: '#B6CCFF',
        },
        // 青色：科技感辅助色
        sky: {
          50: '#0D2530',
          100: '#123444',
          200: '#1A4D63',
          300: '#2586A4',
          400: '#2FB8D8',
          500: '#45D6EC',
          600: '#75E6F5',
        },
        // 紫罗兰：渐变搭档
        lumi: {
          50: '#191137',
          100: '#221849',
          200: '#32256B',
          300: '#563FB0',
          400: '#7C5CF5',
          500: '#9A7DFF',
          600: '#B9A2FF',
        },
        // 薄荷绿：成功 / 健康
        mint: {
          50: '#0C2724',
          100: '#113833',
          200: '#174E47',
          300: '#1F8478',
          400: '#2EC4A8',
          500: '#46DDC1',
          600: '#75EAD5',
        },
        // 暖金：少量点缀
        sun: {
          50: '#2A1F0F',
          100: '#3A2B13',
          200: '#57401B',
          300: '#9C7223',
          400: '#F0B23C',
          500: '#FFC963',
          600: '#FFD98F',
        },
      },
      fontFamily: {
        rounded: ['PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'ui-rounded', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // 深色底用「实心投影 + 内侧高光」模拟贴纸质感
        sticker: '0 4px 0 0 #0D1229',
        'sticker-lg': '0 6px 0 -1px #0D1229, 0 22px 38px -26px rgba(0, 0, 0, 0.9)',
        glow: '0 0 0 4px rgba(79, 124, 255, 0.22)',
        pop: '0 16px 38px -18px rgba(79, 124, 255, 0.55)',
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

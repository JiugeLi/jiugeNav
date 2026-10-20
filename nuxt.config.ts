export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: ['@nuxtjs/tailwindcss', 'nitro-cloudflare-dev'],

  // 纯前端渲染：数据只在登录后由浏览器带 X-User-Id 请求，不需要 SSR
  ssr: false,

  devtools: { enabled: false },

  runtimeConfig: {
    public: {
      // 配置后登录框才显示 Google 按钮：NUXT_PUBLIC_GOOGLE_CLIENT_ID
      googleClientId: '',
    },
  },

  nitro: {
    preset: 'cloudflare_module',
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: 'SoloLink · 我的导航主页',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SoloLink：可自定义分组、带点击统计与链接体检的个人书签导航。' },
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },
});

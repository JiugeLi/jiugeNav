<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Loader2, Lock } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiPost } from '~/utils/api';
import { useStore } from '~/composables/useStore';
import type { UserSession } from '~/utils/session';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const store = useStore();
const config = useRuntimeConfig();

const password = ref('');
const error = ref('');
const loading = ref(false);
const googleReady = ref(false);

const googleClientId = config.public.googleClientId;

onMounted(() => {
  if (!googleClientId) return;

  // Google Identity Services：按需加载脚本并渲染官方按钮
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => {
    const google = (window as any).google;
    if (!google) return;

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: { credential: string }) => {
        loading.value = true;
        error.value = '';
        try {
          const data = await apiPost<{ success: boolean; user: UserSession }>('/api/auth/google', {
            idToken: response.credential,
          });
          await store.signIn(data.user);
          emit('close');
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Google 登录失败';
        } finally {
          loading.value = false;
        }
      },
    });

    google.accounts.id.renderButton(document.getElementById('gsi-button'), {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 300,
    });

    googleReady.value = true;
  };
  document.head.appendChild(script);
});

async function submitPassword() {
  loading.value = true;
  error.value = '';

  try {
    const { valid } = await apiPost<{ valid: boolean }>('/api/auth/verify', { password: password.value });
    if (!valid) {
      error.value = '密码错误';
      return;
    }

    // 密码登录即管理员会话，固定使用 1 号（admin@local）账号的数据
    await store.signIn({ userId: 1, email: 'admin@local', name: 'Admin', avatar: null, isAdmin: true });
    password.value = '';
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '验证失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal :open="open" width="max-w-sm" @close="emit('close')">
    <template #title>登录 SoloLink</template>

    <div class="p-6 space-y-6">
      <div v-if="googleClientId">
        <div class="text-sm text-slate-600 mb-3 text-center">使用 Google 账号登录</div>
        <div id="gsi-button" class="flex justify-center" />
        <p v-if="!googleReady" class="text-xs text-center text-slate-400">正在加载 Google 登录…</p>
      </div>

      <div v-if="googleClientId" class="relative">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200" /></div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-slate-500">或使用管理员密码</span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="submitPassword">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock :size="18" class="text-slate-400" />
          </div>
          <input
            v-model="password"
            type="password"
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="请输入管理密码"
            autofocus
          >
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{{ error }}</div>

        <button
          type="submit"
          :disabled="loading || !password"
          class="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          登录
        </button>
      </form>
    </div>
  </Modal>
</template>

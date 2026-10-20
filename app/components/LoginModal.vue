<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Link2, Loader2, Lock, Sparkles } from 'lucide-vue-next';
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
    <template #title><Sparkles :size="18" class="text-sakura-500" />欢迎回来</template>

    <div class="p-6 space-y-5">
      <div class="text-center space-y-1 pb-1">
        <div
          class="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white"
          style="background-image: linear-gradient(140deg, #4F7CFF, #5F6FFF 55%, #7C5CF5); box-shadow: 0 6px 14px -8px rgba(53, 96, 224, 0.7)"
        >
          <Link2 :size="26" />
        </div>
        <p class="text-xs font-bold tracking-[0.2em] text-ink-mute">SOLOLINK · 私藏书签站</p>
      </div>

      <div v-if="googleClientId">
        <div class="text-xs font-bold text-ink-soft mb-3 text-center tracking-wider">使用 Google 账号登录</div>
        <div id="gsi-button" class="flex justify-center" />
        <p v-if="!googleReady" class="text-xs text-center text-ink-mute mt-2">正在加载 Google 登录…</p>
      </div>

      <div v-if="googleClientId" class="relative py-1">
        <div class="absolute inset-0 flex items-center"><div class="ac-divider w-full" /></div>
        <div class="relative flex justify-center">
          <span class="px-3 bg-surface text-[11px] font-bold tracking-wider text-ink-mute">或使用管理员密码</span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="submitPassword">
        <div class="relative">
          <Lock :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-sakura-400 pointer-events-none" />
          <input
            v-model="password"
            type="password"
            class="ac-input pl-11"
            placeholder="请输入管理密码"
            autofocus
          >
        </div>

        <div v-if="error" class="p-3 rounded-2xl bg-[#fef3f2] border-2 border-[#fecdc9] text-[#d92d20] text-sm font-semibold text-center">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading || !password" class="ac-btn ac-btn-primary w-full py-3 text-sm">
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <Sparkles v-else :size="16" />
          登录
        </button>
      </form>

      <p class="text-[11px] text-center font-semibold text-ink-mute">✧ 密码仅存在服务端，放心使用 ✧</p>
    </div>
  </Modal>
</template>

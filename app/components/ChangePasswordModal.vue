<script setup lang="ts">
import { ref } from 'vue';
import { Lock } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiPost } from '~/utils/api';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

async function submit() {
  error.value = '';
  success.value = '';

  if (newPassword.value.length < 6) {
    error.value = '密码长度至少 6 位';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;
  try {
    await apiPost('/api/auth/change-password', { newPassword: newPassword.value });
    success.value = '密码修改成功';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => emit('close'), 1500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '密码修改失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal :open="props.open" @close="emit('close')">
    <template #title><Lock :size="18" class="text-sakura-500" />修改管理员密码</template>

    <form class="p-6 space-y-4" @submit.prevent="submit">
      <div v-if="error" class="p-3 rounded-2xl bg-[#2a141c] border-2 border-[#5c2b3c] text-sm font-semibold text-[#ff7d93]">{{ error }}</div>
      <div v-if="success" class="p-3 rounded-2xl bg-[#0c2724] border-2 border-[#174e47] text-sm font-semibold text-[#46ddc1]">{{ success }}</div>

      <div>
        <label class="ac-label">新密码</label>
        <input v-model="newPassword" type="password" minlength="6" required class="ac-input" placeholder="至少 6 位">
      </div>

      <div>
        <label class="ac-label">确认密码</label>
        <input v-model="confirmPassword" type="password" minlength="6" required class="ac-input" placeholder="再次输入新密码">
      </div>
    </form>

    <template #footer>
      <button type="button" class="ac-btn ac-btn-ghost px-5 py-2.5 text-sm" @click="emit('close')">
        取消
      </button>
      <button type="button" :disabled="loading" class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="submit">
        {{ loading ? '修改中…' : '确认修改' }}
      </button>
    </template>
  </Modal>
</template>

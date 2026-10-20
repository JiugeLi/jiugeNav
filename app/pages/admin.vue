<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeft, Calendar, Clock, FolderOpen, Link2, MousePointerClick, RefreshCw, Trash2, Users,
} from 'lucide-vue-next';
import { apiDelete, apiGet } from '~/utils/api';
import { readSession, removeSession } from '~/utils/session';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  created_at: string;
  last_login: string | null;
  linkCount: number;
  groupCount: number;
  totalClicks: number;
}

interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  totalGroups: number;
  totalClicks: number;
  newUsersThisWeek: number;
  newLinksThisWeek: number;
}

const router = useRouter();
const loading = ref(true);
const users = ref<AdminUser[]>([]);
const stats = ref<AdminStats>({
  totalUsers: 0, totalLinks: 0, totalGroups: 0, totalClicks: 0, newUsersThisWeek: 0, newLinksThisWeek: 0,
});

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('zh-CN') : '-');

async function fetchData() {
  loading.value = true;
  try {
    const [statsData, usersData] = await Promise.all([
      apiGet<AdminStats>('/api/admin/stats'),
      apiGet<AdminUser[]>('/api/admin/users'),
    ]);
    stats.value = statsData;
    users.value = usersData;
  } catch (error) {
    console.error('加载管理数据失败', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!readSession()?.isAdmin) {
    await router.push('/');
    return;
  }
  await fetchData();
});

async function removeUser(id: number, email: string) {
  if (!confirm(`确定删除用户 "${email}" 吗？该用户的分组和网站会一并删除。`)) return;

  try {
    await apiDelete(`/api/admin/users?id=${id}`);
    await fetchData();
  } catch (error) {
    console.error('删除用户失败', error);
    alert('删除失败');
  }
}

async function signOut() {
  removeSession();
  await router.push('/');
}

const cards = computed(() => [
  { label: '总用户数', value: stats.value.totalUsers, extra: `+${stats.value.newUsersThisWeek} 本周新增`, icon: Users, emoji: '👤', bg: 'linear-gradient(135deg, #ffb3d3 0%, #ff7fb4 55%, #ff9ecb 100%)', ring: '#ffd9ea' },
  { label: '总链接数', value: stats.value.totalLinks, extra: `+${stats.value.newLinksThisWeek} 本周新增`, icon: Link2, emoji: '🔗', bg: 'linear-gradient(135deg, #9bf2dd 0%, #5fe0be 55%, #67d6ff 100%)', ring: '#c9fbef' },
  { label: '总分组数', value: stats.value.totalGroups, extra: '', icon: FolderOpen, emoji: '📁', bg: 'linear-gradient(135deg, #d3c2ff 0%, #a88cff 55%, #c9a6ff 100%)', ring: '#e6dcff' },
  { label: '总点击量', value: stats.value.totalClicks, extra: '', icon: MousePointerClick, emoji: '💖', bg: 'linear-gradient(135deg, #ffe3ac 0%, #ffc46b 55%, #ffb0a0 100%)', ring: '#fff0d2' },
]);
</script>

<template>
  <div class="min-h-screen relative text-ink font-rounded">
    <AnimeBackdrop />

    <header class="sticky top-0 z-10 ac-glass border-b-2 border-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <NuxtLink to="/" class="w-9 h-9 rounded-full bg-white border-2 border-sakura-100 flex items-center justify-center text-ink-soft hover:text-sakura-600 hover:border-sakura-300 transition-colors shrink-0">
            <ArrowLeft :size="17" />
          </NuxtLink>
          <h1 class="text-lg sm:text-xl font-extrabold truncate flex items-center gap-2">
            <span class="ac-gradient-text">SoloLink</span>
            <span class="ac-chip">✧ 管理后台</span>
          </h1>
        </div>
        <button class="ac-btn ac-btn-ghost px-3.5 py-2 text-xs shrink-0" @click="signOut">
          退出登录
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4 relative z-10">
      <div class="w-12 h-12 rounded-full border-4 border-sakura-100 border-t-sakura-400 animate-spin" />
      <p class="text-sm font-bold text-ink-soft animate-ac-float">读取数据中 ✧</p>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="card in cards"
          :key="card.label"
          class="relative overflow-hidden rounded-3xl p-5 text-white border-2 border-white/70 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
          :style="{ backgroundImage: card.bg, boxShadow: `0 6px 0 -1px ${card.ring}, 0 22px 34px -24px rgba(120, 84, 168, 0.75)` }"
        >
          <div class="absolute inset-0 opacity-40" style="background-image: radial-gradient(rgba(255, 255, 255, 0.95) 1px, transparent 1px); background-size: 14px 14px" />
          <span class="absolute -right-1 -bottom-3 text-5xl opacity-20 select-none">{{ card.emoji }}</span>
          <div class="relative flex items-start justify-between gap-2">
            <div>
              <p class="text-white/85 text-xs font-bold tracking-wider">{{ card.label }}</p>
              <p class="text-3xl font-extrabold mt-1 leading-none" style="text-shadow: 0 2px 0 rgba(120, 40, 80, 0.18)">{{ card.value }}</p>
              <p v-if="card.extra" class="text-white/75 text-[11px] font-bold mt-1.5">{{ card.extra }}</p>
            </div>
            <div class="w-10 h-10 rounded-2xl bg-white/30 border border-white/50 flex items-center justify-center shrink-0">
              <component :is="card.icon" :size="19" />
            </div>
          </div>
        </div>
      </div>

      <div class="ac-card overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-sakura-50 to-lumi-50/60 border-b-2 border-sakura-100">
          <h2 class="text-base font-extrabold text-ink flex items-center gap-2">
            <span class="text-sakura-400">✦</span>用户列表
          </h2>
          <button class="w-8 h-8 rounded-full bg-white border-2 border-sakura-100 flex items-center justify-center text-ink-soft hover:text-sakura-600 hover:rotate-90 transition-all" title="刷新" @click="fetchData">
            <RefreshCw :size="15" />
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-sakura-50/50">
              <tr>
                <th v-for="title in ['用户', '链接数', '分组数', '点击量', '注册时间', '最后登录', '操作']" :key="title" class="px-5 py-3 text-left text-[11px] font-extrabold tracking-widest text-ink-mute whitespace-nowrap">
                  {{ title }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sakura-50">
              <tr v-for="user in users" :key="user.id" class="hover:bg-sakura-50/50 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <img v-if="user.avatar" :src="user.avatar" alt="" class="w-10 h-10 rounded-2xl border-2 border-sakura-100">
                    <div v-else class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold border-2 border-white/60 shrink-0" style="background-image: linear-gradient(135deg, #ffa6cc, #a88cff)">
                      {{ (user.name || user.email)[0]?.toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-extrabold text-sm text-ink truncate">{{ user.name || '未命名用户' }}</div>
                      <div class="text-[11px] font-semibold text-ink-mute truncate">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span class="ac-chip"><Link2 :size="11" />{{ user.linkCount }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="ac-chip" style="background: #f6f1ff; color: #7350d8; border-color: #e2d8ff"><FolderOpen :size="11" />{{ user.groupCount }}</span>
                </td>
                <td class="px-5 py-3.5 text-sm font-extrabold text-ink">{{ user.totalClicks }}</td>
                <td class="px-5 py-3.5 text-xs font-semibold text-ink-soft whitespace-nowrap">
                  <span class="flex items-center gap-1"><Calendar :size="13" class="text-sakura-300" />{{ formatDate(user.created_at) }}</span>
                </td>
                <td class="px-5 py-3.5 text-xs font-semibold text-ink-soft whitespace-nowrap">
                  <span class="flex items-center gap-1"><Clock :size="13" class="text-sky-300" />{{ formatDate(user.last_login) }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <button class="p-2 rounded-full text-ink-mute hover:text-red-500 hover:bg-red-50 transition-colors" title="删除用户" @click="removeUser(user.id, user.email)">
                    <Trash2 :size="15" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="users.length === 0" class="text-center py-12 text-sm font-bold text-ink-mute">暂无用户 (｡•́︿•̀｡)</div>
      </div>
    </div>
  </div>
</template>

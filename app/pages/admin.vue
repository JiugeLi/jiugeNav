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
  { label: '总用户数', value: stats.value.totalUsers, extra: `+${stats.value.newUsersThisWeek} 本周新增`, icon: Users, color: 'from-blue-500 to-blue-600' },
  { label: '总链接数', value: stats.value.totalLinks, extra: `+${stats.value.newLinksThisWeek} 本周新增`, icon: Link2, color: 'from-emerald-500 to-emerald-600' },
  { label: '总分组数', value: stats.value.totalGroups, extra: '', icon: FolderOpen, color: 'from-violet-500 to-violet-600' },
  { label: '总点击量', value: stats.value.totalClicks, extra: '', icon: MousePointerClick, color: 'from-amber-500 to-orange-500' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft :size="20" class="text-slate-600" />
          </NuxtLink>
          <h1 class="text-2xl font-bold text-slate-900">SoloLink 管理后台</h1>
        </div>
        <button class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" @click="signOut">
          退出登录
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in cards"
          :key="card.label"
          class="bg-gradient-to-br rounded-2xl p-6 text-white shadow-lg"
          :class="card.color"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-white/80 text-sm font-medium">{{ card.label }}</p>
              <p class="text-3xl font-bold mt-2">{{ card.value }}</p>
              <p v-if="card.extra" class="text-white/70 text-xs mt-1">{{ card.extra }}</p>
            </div>
            <component :is="card.icon" :size="32" class="opacity-80" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">用户列表</h2>
          <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="刷新" @click="fetchData">
            <RefreshCw :size="18" class="text-slate-600" />
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="title in ['用户', '链接数', '分组数', '点击量', '注册时间', '最后登录', '操作']" :key="title" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  {{ title }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img v-if="user.avatar" :src="user.avatar" alt="" class="w-10 h-10 rounded-full">
                    <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                      {{ (user.name || user.email)[0]?.toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-medium text-slate-900">{{ user.name || '未命名用户' }}</div>
                      <div class="text-sm text-slate-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Link2 :size="12" />{{ user.linkCount }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                    <FolderOpen :size="12" />{{ user.groupCount }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-900">{{ user.totalClicks }}</td>
                <td class="px-6 py-4 text-slate-500 text-sm">
                  <span class="flex items-center gap-1"><Calendar :size="14" />{{ formatDate(user.created_at) }}</span>
                </td>
                <td class="px-6 py-4 text-slate-500 text-sm">
                  <span class="flex items-center gap-1"><Clock :size="14" />{{ formatDate(user.last_login) }}</span>
                </td>
                <td class="px-6 py-4">
                  <button class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="删除用户" @click="removeUser(user.id, user.email)">
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="users.length === 0" class="text-center py-12 text-slate-500">暂无用户</div>
      </div>
    </div>
  </div>
</template>

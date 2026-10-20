<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  CheckCircle, ChevronRight, Edit2, FolderOpen, LayoutGrid, LogOut, Menu, Plus, Search, Settings, Trash2, X,
} from 'lucide-vue-next';
import LoginModal from '~/components/LoginModal.vue';
import GroupModal from '~/components/GroupModal.vue';
import WebsiteModal from '~/components/WebsiteModal.vue';
import SettingsModal from '~/components/SettingsModal.vue';
import ChangePasswordModal from '~/components/ChangePasswordModal.vue';
import LinkCheckerModal from '~/components/LinkCheckerModal.vue';
import StatCards from '~/components/StatCards.vue';
import WebsiteLogo from '~/components/WebsiteLogo.vue';
import type { Group, Website } from '~/utils/types';

const store = useStore();
const {
  session, groups, websites, stats, activeGroupId, searchQuery, loading,
  visibleWebsites, groupCount, init, loadData, signOut,
  saveGroup, deleteGroup, saveWebsite, deleteWebsite, openWebsite,
} = store;

const sidebarOpen = ref(false);
const modal = ref<'' | 'login' | 'group' | 'website' | 'settings' | 'password' | 'checker'>('');
const editingGroup = ref<Group | null>(null);
const editingWebsite = ref<Website | null>(null);

onMounted(async () => {
  await init();
  if (!session.value) modal.value = 'login';
});

function handleSignOut() {
  signOut();
  modal.value = 'login';
}

function openGroupModal(group: Group | null) {
  editingGroup.value = group;
  modal.value = 'group';
}

function openWebsiteModal(site: Website | null) {
  editingWebsite.value = site;
  modal.value = 'website';
}

async function submitGroup(data: Partial<Group>) {
  try {
    await saveGroup(data, editingGroup.value?.id);
    modal.value = '';
  } catch (error) {
    alert(error instanceof Error ? error.message : '保存分组失败');
  }
}

async function submitWebsite(data: Partial<Website>) {
  try {
    await saveWebsite(data, editingWebsite.value?.id);
    modal.value = '';
  } catch (error) {
    alert(error instanceof Error ? error.message : '保存网站失败，请稍后重试');
  }
}

async function removeGroup(id: number) {
  if (!confirm('确定删除此分组及其所有网站吗？')) return;
  try {
    await deleteGroup(id);
  } catch (error) {
    alert(error instanceof Error ? error.message : '删除分组失败');
  }
}

async function removeWebsite(id: number) {
  if (!confirm('确定删除此网站吗？')) return;
  try {
    await deleteWebsite(id);
  } catch (error) {
    console.error(error);
  }
}

function selectGroup(id: number) {
  activeGroupId.value = id;
  sidebarOpen.value = false;
}
</script>

<template>
  <div class="h-screen flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
    <div v-if="loading" class="flex items-center justify-center h-screen w-full bg-slate-50">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>

    <template v-else>
      <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" @click="sidebarOpen = false" />

      <!-- 侧边栏：分组 + 账号 -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col h-full overflow-hidden shadow-2xl lg:shadow-none"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <LayoutGrid class="text-blue-600" :size="24" />
            SoloLink
          </h1>
          <button class="lg:hidden p-2 text-slate-400 hover:text-slate-600" @click="sidebarOpen = false">
            <X :size="20" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div class="flex items-center justify-between px-2 mb-2">
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Groups</h2>
            <button
              v-if="session"
              class="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
              title="新建分组"
              @click="openGroupModal(null)"
            >
              <Plus :size="16" />
            </button>
          </div>

          <div
            v-for="group in groups"
            :key="group.id"
            class="group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
            :class="activeGroupId === group.id
              ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            @click="selectGroup(group.id)"
          >
            <div class="flex items-center gap-3 truncate flex-1">
              <span class="text-lg transition-transform duration-200" :class="activeGroupId === group.id ? 'scale-110' : 'group-hover:scale-110'">
                {{ group.icon || '📁' }}
              </span>
              <span class="font-medium truncate">{{ group.name }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="activeGroupId === group.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-600'"
              >
                {{ groupCount(group.id) }}
              </span>
            </div>

            <div v-if="session" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm" title="编辑分组" @click.stop="openGroupModal(group)">
                <Edit2 :size="14" />
              </button>
              <button class="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 shadow-sm" title="删除分组" @click.stop="removeGroup(group.id)">
                <Trash2 :size="14" />
              </button>
            </div>
            <ChevronRight v-else-if="activeGroupId === group.id" :size="16" class="text-blue-400" />
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50/50">
          <div v-if="session" class="space-y-2">
            <button
              class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
              @click="modal = 'settings'"
            >
              <Settings :size="18" />
              设置
            </button>
            <button
              class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              @click="handleSignOut"
            >
              <LogOut :size="18" />
              退出登录
            </button>
          </div>
          <button
            v-else
            class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            @click="modal = 'login'"
          >
            <Settings :size="18" />
            登录
          </button>
        </div>
      </aside>

      <main class="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/50">
        <div class="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0" />

        <header class="px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between sticky top-0 z-20 glass mb-6">
          <div class="flex items-center gap-4 lg:hidden">
            <button class="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg" @click="sidebarOpen = true">
              <Menu :size="24" />
            </button>
            <span class="font-bold text-slate-900">SoloLink</span>
          </div>

          <div class="hidden lg:block relative w-full max-w-md group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search class="text-slate-400 group-focus-within:text-blue-500 transition-colors" :size="20" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索网站..."
              class="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            >
          </div>

          <div v-if="session" class="flex items-center gap-3 ml-auto lg:ml-0">
            <button
              class="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-all active:scale-95"
              title="检查所有链接"
              @click="modal = 'checker'"
            >
              <CheckCircle :size="18" />
              <span class="hidden sm:inline">检查链接</span>
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all active:scale-95"
              @click="openWebsiteModal(null)"
            >
              <Plus :size="18" />
              <span class="hidden sm:inline">添加网站</span>
            </button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-6 lg:px-8 pb-8 z-10 custom-scrollbar">
          <div class="max-w-[1920px] mx-auto">
            <StatCards :stats="stats" />

            <div v-if="visibleWebsites.length === 0" class="flex flex-col items-center justify-center h-[50vh] text-center">
              <div class="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <FolderOpen :size="64" class="text-slate-300" />
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">暂无网站</h3>
              <p class="text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
                {{ searchQuery ? `未找到 "${searchQuery}" 相关的网站` : '该分组暂无网站，点击下方按钮添加' }}
              </p>
              <div v-if="session && !searchQuery" class="flex gap-4">
                <button
                  v-if="groups.length === 0"
                  class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                  @click="openGroupModal(null)"
                >
                  <Plus :size="20" />
                  创建第一个分组
                </button>
                <button
                  v-else
                  class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
                  @click="openWebsiteModal(null)"
                >
                  <Plus :size="20" />
                  添加网站
                </button>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
              <div
                v-for="site in visibleWebsites"
                :key="site.id"
                class="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-100 hover:border-blue-100 relative cursor-pointer hover:-translate-y-1"
                @click="openWebsite(site)"
              >
                <div class="flex items-center gap-4 h-full">
                  <div class="w-14 h-14 flex-shrink-0 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                    <WebsiteLogo :website="site" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{{ site.name }}</h3>
                    <div v-if="(site.click_count ?? 0) > 0" class="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <span>🔥</span>
                      <span>{{ site.click_count }}</span>
                    </div>
                  </div>
                </div>

                <div class="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl z-10 text-center pointer-events-none">
                  <p class="text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                    {{ site.description || site.url }}
                  </p>
                </div>

                <div v-if="session" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg p-1 border border-slate-100 z-20">
                  <button class="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors" title="编辑" @click.stop="openWebsiteModal(site)">
                    <Edit2 :size="14" />
                  </button>
                  <button class="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors" title="删除" @click.stop="removeWebsite(site.id)">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoginModal :open="modal === 'login'" @close="modal = ''" />
      <GroupModal :open="modal === 'group'" :initial="editingGroup" @close="modal = ''; editingGroup = null" @submit="submitGroup" />
      <WebsiteModal
        :open="modal === 'website'"
        :initial="editingWebsite"
        :groups="groups"
        :group-id="activeGroupId || groups[0]?.id || 0"
        @close="modal = ''; editingWebsite = null"
        @submit="submitWebsite"
      />
      <SettingsModal
        :open="modal === 'settings'"
        :is-admin="store.isAdmin.value"
        @close="modal = ''"
        @changed="loadData"
        @change-password="modal = 'password'"
      />
      <ChangePasswordModal :open="modal === 'password'" @close="modal = ''" />
      <LinkCheckerModal :open="modal === 'checker'" @close="modal = ''" @changed="loadData" />
    </template>
  </div>
</template>

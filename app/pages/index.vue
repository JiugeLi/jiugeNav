<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  CheckCircle, Edit2, FolderOpen, Link2, LogIn, LogOut, Menu, Plus, Search, Settings, Trash2, X,
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
  session, groups, stats, activeGroupId, searchQuery, loading,
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

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const activeGroupName = computed(() => groups.value.find((g) => g.id === activeGroupId.value)?.name ?? '全部网站');
</script>

<template>
  <div class="h-screen flex overflow-hidden relative text-ink font-rounded">
    <div v-if="loading" class="flex items-center justify-center h-screen w-full relative z-10">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full border-4 border-sakura-100 border-t-sakura-400 animate-spin" />
        <p class="text-sm font-bold text-ink-soft">加载中 ✧</p>
      </div>
    </div>

    <template v-else>
      <div v-if="sidebarOpen" class="fixed inset-0 bg-[#0b1220]/40 backdrop-blur-sm z-30 lg:hidden" @click="sidebarOpen = false" />

      <!-- 侧边栏 -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0 ac-glass border-r-2 border-[#e4eaf6] transform transition-transform duration-300 ease-out lg:transform-none flex flex-col h-full overflow-hidden"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        style="box-shadow: 10px 0 40px -32px rgba(16, 24, 40, 0.12)"
      >
        <div class="px-5 pt-5 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0"
                 style="background-image: linear-gradient(140deg, #4F7CFF, #5F6FFF 55%, #7C5CF5); box-shadow: 0 6px 14px -8px rgba(53, 96, 224, 0.7)">
              <Link2 :size="20" />
            </div>
            <div class="leading-tight">
              <h1 class="text-xl font-extrabold ac-gradient-text">SoloLink</h1>
              <p class="text-[10px] font-bold tracking-[0.2em] text-ink-mute">PERSONAL LINK DECK</p>
            </div>
          </div>
          <button class="lg:hidden p-2 rounded-full text-ink-soft hover:bg-[#eff3fb]" @click="sidebarOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="px-5">
          <div class="ac-divider" />
        </div>

        <div class="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 class="ac-section-title">✦ 分组</h2>
          <button
            v-if="session"
            class="w-7 h-7 rounded-full flex items-center justify-center text-sakura-600 bg-sakura-100 border border-sakura-200 hover:bg-sakura-200 transition-all"
            title="新建分组"
            @click="openGroupModal(null)"
          >
            <Plus :size="15" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 custom-scrollbar">
          <div
            v-for="group in groups"
            :key="group.id"
            class="group relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 border-2"
            :class="activeGroupId === group.id
              ? 'text-white border-transparent'
              : 'text-ink-soft border-transparent hover:bg-[#eff3fb] hover:text-ink hover:border-sakura-100'"
            :style="activeGroupId === group.id
              ? { backgroundImage: 'linear-gradient(135deg, #4F7CFF, #5F6FFF 48%, #7C5CF5)', boxShadow: '0 8px 18px -12px rgba(53, 96, 224, 0.7)' }
              : undefined"
            @click="selectGroup(group.id)"
          >
            <div class="flex items-center gap-2.5 truncate flex-1 min-w-0">
              <span class="text-lg ">{{ group.icon || '📁' }}</span>
              <span class="font-bold text-sm truncate">{{ group.name }}</span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <span
                class="text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                :class="activeGroupId === group.id ? 'bg-white/25 text-white' : 'bg-sakura-50 text-sakura-600 border border-sakura-100'"
              >
                {{ groupCount(group.id) }}
              </span>

              <div v-if="session" class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="p-1 rounded-full hover:bg-[#eff3fb] transition-colors"
                  :class="activeGroupId === group.id ? 'text-white' : 'text-ink-soft hover:text-sakura-600'"
                  title="编辑分组"
                  @click.stop="openGroupModal(group)"
                >
                  <Edit2 :size="13" />
                </button>
                <button
                  class="p-1 rounded-full hover:bg-[#eff3fb] transition-colors"
                  :class="activeGroupId === group.id ? 'text-white' : 'text-ink-soft hover:text-red-500'"
                  title="删除分组"
                  @click.stop="removeGroup(group.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>

          <p v-if="groups.length === 0" class="px-3 py-6 text-center text-xs font-bold text-ink-mute">
            还没有分组<br>
            <span class="text-sakura-400">点上面的 ＋ 创建 ✧</span>
          </p>
        </div>

        <div class="p-3 border-t-2 border-[#e4eaf6] space-y-2">
          <template v-if="session">
            <button class="ac-btn ac-btn-ghost w-full py-2.5 text-sm" @click="modal = 'settings'">
              <Settings :size="16" />
              设置
            </button>
            <button class="ac-btn ac-btn-ghost w-full py-2.5 text-sm hover:!text-[#d92d20] hover:!border-[#fecdc9]" @click="handleSignOut">
              <LogOut :size="16" />
              退出登录
            </button>
          </template>
          <button v-else class="ac-btn ac-btn-primary w-full py-2.5 text-sm" @click="modal = 'login'">
            <LogIn :size="16" />
            登录
          </button>
        </div>
      </aside>

      <!-- 主区域 -->
      <main class="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header class="px-4 lg:px-8 py-3 lg:py-4 flex items-center gap-3 sticky top-0 z-20 ac-glass border-b-2 border-[#e4eaf6]">
          <button class="lg:hidden p-2 rounded-2xl bg-surface-2 border-2 border-sakura-100 text-sakura-600 shrink-0" @click="sidebarOpen = true">
            <Menu :size="20" />
          </button>

          <div class="relative w-full max-w-md group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute group-focus-within:text-sakura-500 transition-colors" :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索网站、描述…"
              class="w-full pl-11 pr-4 py-2.5 rounded-full bg-surface-2 border-2 border-sakura-100 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-sakura-400 transition-all"
              style="box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)"
            >
          </div>

          <div v-if="session" class="flex items-center gap-2 ml-auto shrink-0">
            <button
              class="ac-btn ac-btn-mint px-3 sm:px-4 py-2.5 text-sm"
              title="检查所有链接"
              @click="modal = 'checker'"
            >
              <CheckCircle :size="17" />
              <span class="hidden sm:inline">检查链接</span>
            </button>
            <button class="ac-btn ac-btn-primary px-3 sm:px-4 py-2.5 text-sm" @click="openWebsiteModal(null)">
              <Plus :size="17" />
              <span class="hidden sm:inline">添加网站</span>
            </button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-4 lg:px-8 pt-5 pb-10 custom-scrollbar">
          <div class="max-w-[1920px] mx-auto">
            <div class="flex items-end justify-between mb-3 px-1">
              <h2 class="text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
                <span class="text-sakura-400">✦</span>
                {{ activeGroupName }}
              </h2>
              <p class="text-xs font-bold text-ink-mute">
                共 <span class="text-sakura-600">{{ visibleWebsites.length }}</span> 个收藏
              </p>
            </div>

            <StatCards :stats="stats" />

            <div v-if="visibleWebsites.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="relative w-28 h-28 rounded-full flex items-center justify-center mb-5 bg-gradient-to-br from-sakura-50 to-lumi-50 border-2 border-dashed border-sakura-200">
                <FolderOpen :size="48" class="text-sakura-400" />
                <span class="absolute -top-2 -right-1 text-2xl">🌙</span>
              </div>
              <h3 class="text-lg font-extrabold text-ink mb-1.5">
                {{ searchQuery ? '没有找到结果呢 (｡•́︿•̀｡)' : '这里还空空的～' }}
              </h3>
              <p class="text-sm text-ink-soft max-w-sm mx-auto leading-relaxed mb-6">
                {{ searchQuery ? `换个关键词试试，比如去掉 "${searchQuery}"` : '添加第一个网站，建立你的个人链接库 ✧' }}
              </p>
              <div v-if="session && !searchQuery" class="flex gap-3">
                <button v-if="groups.length === 0" class="ac-btn ac-btn-lumi px-5 py-2.5 text-sm" @click="openGroupModal(null)">
                  <Plus :size="17" />创建第一个分组
                </button>
                <button v-else class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="openWebsiteModal(null)">
                  <Plus :size="17" />添加网站
                </button>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 pb-20">
              <div
                v-for="site in visibleWebsites"
                :key="site.id"
                class="group ac-card ac-card-hover p-3.5 cursor-pointer overflow-hidden"
                @click="openWebsite(site)"
              >
                <div class="flex items-center gap-3">
                  <div class="w-[52px] h-[52px] shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-sakura-100 bg-gradient-to-br from-sakura-50 to-lumi-50 ">
                    <WebsiteLogo :website="site" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-extrabold text-sm truncate text-ink group-hover:text-sakura-600 transition-colors">{{ site.name }}</h3>
                    <p class="text-[11px] font-semibold text-ink-mute truncate mt-0.5">{{ hostOf(site.url) }}</p>
                    <div v-if="(site.click_count ?? 0) > 0" class="mt-1">
                      <span class="ac-chip">🔥 {{ site.click_count }}</span>
                    </div>
                  </div>
                </div>

                <!-- 悬浮说明 -->
                <div class="absolute inset-0 flex items-center justify-center p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[22px] z-10 pointer-events-none"
                     style="background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 255, 0.97)); backdrop-filter: blur(2px)">
                  <p class="text-xs font-semibold text-ink-soft line-clamp-3 leading-relaxed text-center">
                    {{ site.description || site.url }}
                  </p>
                </div>

                <div v-if="session" class="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 rounded-full p-1 bg-surface-3 border border-sakura-100 z-20 shadow-sm">
                  <button class="p-1.5 rounded-full text-ink-soft hover:text-sakura-600 hover:bg-sakura-50 transition-colors" title="编辑" @click.stop="openWebsiteModal(site)">
                    <Edit2 :size="13" />
                  </button>
                  <button class="p-1.5 rounded-full text-ink-soft hover:text-[#d92d20] hover:bg-[#fef3f2] transition-colors" title="删除" @click.stop="removeWebsite(site.id)">
                    <Trash2 :size="13" />
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  CheckCircle, ChevronDown, Edit2, FolderOpen, FolderPlus, Home, Link2, LogIn, LogOut, Menu,
  MoreHorizontal, Plus, Search, Settings, Shield, Trash2, X,
} from 'lucide-vue-next';
import LoginModal from '~/components/LoginModal.vue';
import GroupModal from '~/components/GroupModal.vue';
import WebsiteModal from '~/components/WebsiteModal.vue';
import SettingsModal from '~/components/SettingsModal.vue';
import ChangePasswordModal from '~/components/ChangePasswordModal.vue';
import LinkCheckerModal from '~/components/LinkCheckerModal.vue';
import LinkCard from '~/components/LinkCard.vue';
import type { Group, Website } from '~/utils/types';

const store = useStore();
const {
  session, groups, websites, activeGroupId, searchQuery, loading,
  visibleWebsites, frequentWebsites, groupCount, init, loadData, signOut,
  saveGroup, deleteGroup, saveWebsite, deleteWebsite, openWebsite,
} = store;

const router = useRouter();

const sidebarOpen = ref(false);
const menu = ref<'' | 'more' | 'user' | 'tabs'>('');
const modal = ref<'' | 'login' | 'group' | 'website' | 'settings' | 'password' | 'checker'>('');

const editingGroup = ref<Group | null>(null);
const editingWebsite = ref<Website | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// 「All Links」标签栏直接展示的分组数，其余收进 … 菜单
const VISIBLE_TABS = 6;

function onKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.value?.focus();
  }
  if (event.key === 'Escape') menu.value = '';
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  await init();
  if (!session.value) modal.value = 'login';
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
});

const userInitial = computed(() => (session.value?.name || session.value?.email || '?').slice(0, 1).toUpperCase());
const showFrequent = computed(() => !activeGroupId.value && !searchQuery.value.trim() && frequentWebsites.value.length > 0);
const tabGroups = computed(() => groups.value.slice(0, VISIBLE_TABS));
const overflowGroups = computed(() => groups.value.slice(VISIBLE_TABS));
const overflowActive = computed(() => overflowGroups.value.some((g) => g.id === activeGroupId.value));

const sectionTitle = computed(() => {
  if (searchQuery.value.trim()) return 'Search Results';
  return 'All Links';
});

function runMenu(action: () => void) {
  menu.value = '';
  action();
}

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

function selectGroup(id: number | null) {
  activeGroupId.value = id;
  searchQuery.value = '';
  sidebarOpen.value = false;
  menu.value = '';
}
</script>

<template>
  <div class="h-screen flex overflow-hidden relative text-ink">
    <div v-if="loading" class="flex items-center justify-center h-screen w-full">
      <div class="w-10 h-10 rounded-full border-4 border-sakura-100 border-t-sakura-500 animate-spin" />
    </div>

    <template v-else>
      <div v-if="sidebarOpen" class="fixed inset-0 bg-[#0b1220]/30 z-30 lg:hidden" @click="sidebarOpen = false" />

      <!-- 侧边栏 -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-surface-2 border-r border-[#e9eef7] flex-col h-full"
        :class="sidebarOpen ? 'flex' : 'hidden lg:flex'"
      >
        <div class="px-6 pt-7 pb-8 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                 style="background-image: linear-gradient(140deg, #6d97ff, #4f7cff 55%, #5f6fff)">
              <Link2 :size="22" />
            </div>
            <div class="leading-tight">
              <h1 class="text-xl font-bold text-ink">SoloLink</h1>
              <p class="text-xs text-ink-soft">Personal Link Deck</p>
            </div>
          </div>
          <button class="lg:hidden p-2 rounded-lg text-ink-soft hover:bg-surface-3" @click="sidebarOpen = false">
            <X :size="18" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          <button class="ac-nav-item" :class="{ 'is-active': !activeGroupId }" @click="selectGroup(null)">
            <Home :size="20" class="text-sakura-500 shrink-0" />
            <span class="flex-1 text-left truncate">Home</span>
            <span class="text-xs text-ink-soft tabular-nums">{{ websites.length }}</span>
          </button>

          <div
            v-for="group in groups"
            :key="group.id"
            class="group ac-nav-item cursor-pointer"
            :class="{ 'is-active': activeGroupId === group.id }"
            @click="selectGroup(group.id)"
          >
            <span class="w-5 text-center text-lg leading-none shrink-0">{{ group.icon || '📁' }}</span>
            <span class="flex-1 truncate">{{ group.name }}</span>
            <div v-if="session" class="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <button class="p-1 rounded-md text-ink-mute hover:text-sakura-600 hover:bg-white" title="编辑分组" @click.stop="openGroupModal(group)">
                <Edit2 :size="13" />
              </button>
              <button class="p-1 rounded-md text-ink-mute hover:text-[#d92d20] hover:bg-white" title="删除分组" @click.stop="removeGroup(group.id)">
                <Trash2 :size="13" />
              </button>
            </div>
            <span class="text-xs text-ink-soft tabular-nums shrink-0" :class="session ? 'group-hover:hidden' : ''">{{ groupCount(group.id) }}</span>
          </div>

          <button v-if="session" class="ac-nav-item text-ink-mute" @click="openGroupModal(null)">
            <FolderPlus :size="20" class="shrink-0" />
            <span class="flex-1 text-left">New group</span>
          </button>
        </nav>

        <div class="mx-6 ac-divider" />
        <div class="p-3 space-y-1">
          <template v-if="session">
            <button class="ac-nav-item text-ink-soft" @click="modal = 'settings'">
              <Settings :size="20" class="shrink-0" />
              <span>Settings</span>
            </button>
            <button class="ac-nav-item text-ink-soft" @click="modal = 'checker'">
              <CheckCircle :size="20" class="shrink-0" />
              <span>Check links</span>
            </button>
          </template>
          <button v-else class="ac-nav-item text-sakura-600" @click="modal = 'login'">
            <LogIn :size="20" class="shrink-0" />
            <span>Sign in</span>
          </button>
        </div>
      </aside>

      <!-- 主区域 -->
      <main class="flex-1 h-full overflow-y-auto custom-scrollbar relative">
        <!-- Hero -->
        <section class="relative">
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <img src="/hero-lake.svg" alt="" class="absolute inset-y-0 right-0 h-full w-full lg:w-[78%] object-cover object-right">
            <div class="absolute inset-0" style="background-image: linear-gradient(90deg, #f5f7fc 22%, rgba(245, 247, 252, 0.6) 48%, rgba(245, 247, 252, 0) 72%)" />
            <div class="absolute inset-x-0 bottom-0 h-28" style="background-image: linear-gradient(180deg, rgba(245, 247, 252, 0), #f5f7fc)" />
          </div>

          <!-- 顶部操作 -->
          <div class="relative z-20 flex items-center gap-3 px-5 lg:px-14 pt-6">
            <button class="lg:hidden p-2.5 rounded-full bg-white/80 text-ink-soft" @click="sidebarOpen = true">
              <Menu :size="20" />
            </button>

            <div class="ml-auto flex items-center gap-3">
              <template v-if="session">
                <button
                  class="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center text-ink-soft hover:text-sakura-600 transition-colors"
                  title="Add link"
                  @click="openWebsiteModal(null)"
                >
                  <Plus :size="18" />
                </button>

                <div class="relative">
                  <button
                    class="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center text-ink-soft hover:text-sakura-600 transition-colors"
                    @click="menu = menu === 'more' ? '' : 'more'"
                  >
                    <MoreHorizontal :size="18" />
                  </button>
                  <div v-if="menu === 'more'" class="ac-menu right-0 top-12">
                    <button class="ac-menu-item" @click="runMenu(() => openWebsiteModal(null))"><Plus :size="16" />Add link</button>
                    <button class="ac-menu-item" @click="runMenu(() => openGroupModal(null))"><FolderPlus :size="16" />New group</button>
                    <button class="ac-menu-item" @click="runMenu(() => (modal = 'checker'))"><CheckCircle :size="16" />Check links</button>
                    <button class="ac-menu-item" @click="runMenu(() => (modal = 'settings'))"><Settings :size="16" />Settings</button>
                  </div>
                </div>

                <div class="relative">
                  <button class="flex items-center gap-1.5" @click="menu = menu === 'user' ? '' : 'user'">
                    <img v-if="session.avatar" :src="session.avatar" alt="" class="w-10 h-10 rounded-full object-cover border-2 border-white">
                    <span v-else class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white"
                          style="background-image: linear-gradient(140deg, #6d97ff, #7c5cf5)">{{ userInitial }}</span>
                    <ChevronDown :size="16" class="text-ink-soft" />
                  </button>
                  <div v-if="menu === 'user'" class="ac-menu right-0 top-12">
                    <div class="px-3 py-2 mb-1 border-b border-[#edf1f8]">
                      <p class="text-sm font-semibold text-ink truncate">{{ session.name || 'Me' }}</p>
                      <p class="text-xs text-ink-mute truncate">{{ session.email }}</p>
                    </div>
                    <button v-if="store.isAdmin.value" class="ac-menu-item" @click="runMenu(() => router.push('/admin'))"><Shield :size="16" />Admin</button>
                    <button class="ac-menu-item hover:!text-[#d92d20]" @click="runMenu(handleSignOut)"><LogOut :size="16" />Sign out</button>
                  </div>
                </div>
              </template>
              <button v-else class="ac-btn ac-btn-primary px-4 py-2 text-sm" @click="modal = 'login'">
                <LogIn :size="16" />Sign in
              </button>
            </div>
          </div>

          <div class="relative z-10 px-5 lg:px-14 pt-6 lg:pt-12 pb-16">
            <h2 class="text-3xl lg:text-[40px] font-bold text-ink tracking-tight">{{ greeting }}</h2>
            <p class="mt-2 text-base lg:text-lg text-ink-soft">A simple place for your favorite links.</p>

            <div class="relative mt-9 max-w-2xl">
              <Search class="absolute left-6 top-1/2 -translate-y-1/2 text-ink-soft" :size="20" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search your links..."
                class="w-full h-14 pl-16 pr-6 sm:pr-24 rounded-full bg-white/95 border border-white text-base text-ink placeholder:text-ink-mute focus:outline-none focus:border-sakura-300 transition-colors"
                style="box-shadow: 0 10px 30px -18px rgba(16, 24, 40, 0.25)"
              >
              <kbd class="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface-3 text-xs font-medium text-ink-soft font-sans">Ctrl K</kbd>
            </div>
          </div>
        </section>

        <div class="relative px-5 lg:px-14 pb-16">
          <!-- Frequently Used -->
          <section v-if="showFrequent" class="mb-10">
            <h2 class="text-xl font-bold text-ink mb-5">Frequently Used</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <LinkCard
                v-for="site in frequentWebsites"
                :key="site.id"
                :site="site"
                :editable="!!session"
                @open="openWebsite(site)"
                @edit="openWebsiteModal(site)"
                @remove="removeWebsite(site.id)"
              />
            </div>
          </section>

          <!-- All Links -->
          <section>
            <div class="relative z-20 flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 class="text-xl font-bold text-ink">{{ sectionTitle }}</h2>

              <div v-if="!searchQuery.trim() && groups.length" class="flex items-center gap-1">
                <button
                  class="px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap"
                  :class="!activeGroupId ? 'bg-sakura-50 text-sakura-600 font-semibold' : 'text-ink-soft hover:text-ink'"
                  @click="selectGroup(null)"
                >All</button>
                <button
                  v-for="group in tabGroups"
                  :key="group.id"
                  class="px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap"
                  :class="activeGroupId === group.id ? 'bg-sakura-50 text-sakura-600 font-semibold' : 'text-ink-soft hover:text-ink'"
                  @click="selectGroup(group.id)"
                >{{ group.name }}</button>

                <div v-if="overflowGroups.length" class="relative">
                  <button
                    class="px-3 py-1.5 rounded-full transition-colors"
                    :class="overflowActive ? 'bg-sakura-50 text-sakura-600' : 'text-ink-soft hover:text-ink'"
                    @click="menu = menu === 'tabs' ? '' : 'tabs'"
                  >
                    <MoreHorizontal :size="18" />
                  </button>
                  <div v-if="menu === 'tabs'" class="ac-menu right-0 top-10">
                    <button
                      v-for="group in overflowGroups"
                      :key="group.id"
                      class="ac-menu-item"
                      :class="{ '!text-sakura-600 font-semibold': activeGroupId === group.id }"
                      @click="selectGroup(group.id)"
                    >
                      <span class="w-4 text-center">{{ group.icon || '📁' }}</span>{{ group.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="visibleWebsites.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-sakura-50 border border-sakura-100">
                <FolderOpen :size="36" class="text-sakura-400" />
              </div>
              <h3 class="text-lg font-bold text-ink mb-1.5">
                {{ searchQuery ? 'No matching links' : 'Nothing here yet' }}
              </h3>
              <p class="text-sm text-ink-soft max-w-sm mx-auto leading-relaxed mb-6">
                {{ searchQuery ? `Try a different keyword than "${searchQuery}".` : 'Add your first link to build your personal deck.' }}
              </p>
              <div v-if="session && !searchQuery">
                <button v-if="groups.length === 0" class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="openGroupModal(null)">
                  <FolderPlus :size="17" />Create a group
                </button>
                <button v-else class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="openWebsiteModal(null)">
                  <Plus :size="17" />Add link
                </button>
              </div>
              <button v-else-if="!session" class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="modal = 'login'">
                <LogIn :size="17" />Sign in
              </button>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <LinkCard
                v-for="site in visibleWebsites"
                :key="site.id"
                :site="site"
                :editable="!!session"
                @open="openWebsite(site)"
                @edit="openWebsiteModal(site)"
                @remove="removeWebsite(site.id)"
              />
            </div>
          </section>
        </div>
      </main>

      <!-- 点空白处关闭下拉菜单 -->
      <div v-if="menu" class="fixed inset-0 z-10" @click="menu = ''" />

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

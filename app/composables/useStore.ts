import type { Group, Stats, Website } from '~/utils/types';
import { readSession, writeSession, removeSession, type UserSession } from '~/utils/session';
import { apiGet, apiPost, apiPut, apiDelete } from '~/utils/api';

const EMPTY_STATS: Stats = { totalLinks: 0, totalClicks: 0, weeklyClicks: 0, newLinksThisWeek: 0 };

/** 全局唯一的数据与操作入口（客户端 SPA，无需 Pinia）。 */
export function useStore() {
  const session = useState<UserSession | null>('session', () => null);
  const groups = useState<Group[]>('groups', () => []);
  const websites = useState<Website[]>('websites', () => []);
  const stats = useState<Stats>('stats', () => ({ ...EMPTY_STATS }));
  const activeGroupId = useState<number | null>('activeGroupId', () => null);
  const searchQuery = useState<string>('search', () => '');
  const loading = useState<boolean>('loading', () => true);

  const isAdmin = computed(() => session.value?.isAdmin ?? false);

  async function loadData() {
    try {
      const [groupData, websiteData, statsData] = await Promise.all([
        apiGet<Group[]>('/api/groups'),
        apiGet<Website[]>('/api/websites'),
        apiGet<Stats>('/api/stats'),
      ]);

      groups.value = groupData;
      websites.value = websiteData;
      stats.value = statsData;
      activeGroupId.value ??= groupData[0]?.id ?? null;
    } catch (error) {
      console.error('加载数据失败', error);
      // 会话失效：清空并回到未登录状态
      if (error instanceof Error && error.message.includes('未登录')) {
        removeSession();
        session.value = null;
      }
    } finally {
      loading.value = false;
    }
  }

  /** 应用启动时调用一次。 */
  async function init() {
    session.value = readSession();
    if (session.value) {
      await loadData();
    } else {
      loading.value = false;
    }
  }

  async function signIn(next: UserSession) {
    writeSession(next);
    session.value = next;
    await loadData();
  }

  function signOut() {
    removeSession();
    session.value = null;
    groups.value = [];
    websites.value = [];
    stats.value = { ...EMPTY_STATS };
  }

  const visibleWebsites = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();
    if (keyword) {
      return websites.value.filter((site) =>
        site.name.toLowerCase().includes(keyword)
        || site.url.toLowerCase().includes(keyword)
        || (site.description ?? '').toLowerCase().includes(keyword),
      );
    }
    return activeGroupId.value
      ? websites.value.filter((site) => site.group_id === activeGroupId.value)
      : websites.value;
  });

  const groupCount = (groupId: number) => websites.value.filter((site) => site.group_id === groupId).length;

  async function saveGroup(data: Partial<Group>, id?: number) {
    if (id) {
      await apiPut(`/api/groups/${id}`, data);
    } else {
      await apiPost('/api/groups', data);
    }
    await loadData();
  }

  async function deleteGroup(id: number) {
    await apiDelete(`/api/groups/${id}`);
    if (activeGroupId.value === id) activeGroupId.value = null;
    await loadData();
  }

  async function saveWebsite(data: Partial<Website>, id?: number) {
    if (id) {
      await apiPut(`/api/websites/${id}`, data);
    } else {
      await apiPost('/api/websites', data);
    }
    await loadData();
  }

  async function deleteWebsite(id: number) {
    await apiDelete(`/api/websites/${id}`);
    await loadData();
  }

  function openWebsite(site: Website) {
    // 点击统计不阻塞跳转
    apiPost(`/api/websites/${site.id}/click`).catch(() => null);
    window.open(site.url, '_blank', 'noopener');
  }

  return {
    session, groups, websites, stats, activeGroupId, searchQuery, loading, isAdmin,
    visibleWebsites, groupCount,
    init, loadData, signIn, signOut,
    saveGroup, deleteGroup, saveWebsite, deleteWebsite, openWebsite,
  };
}

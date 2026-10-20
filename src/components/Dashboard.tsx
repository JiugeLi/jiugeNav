'use client';

import React, { useState, useEffect } from 'react';
import { getUserSession, clearUserSession } from '@/lib/session';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { Group, Website } from '@/types';
import LoginModal from './LoginModal';
import GroupModal from './GroupModal';
import WebsiteModal from './WebsiteModal';
import SettingsModal from './SettingsModal';
import ChangePasswordModal from './ChangePasswordModal';
import LinkCheckerModal from './LinkCheckerModal';
import {
  Search, Plus, Settings, LogOut, Trash2, Edit2,
  LayoutGrid, FolderOpen, Globe, ChevronRight,
  Menu, X, CheckCircle, Link2, MousePointerClick, Calendar,
} from 'lucide-react';

interface Stats {
  totalLinks: number;
  totalClicks: number;
  weeklyClicks: number;
  newLinksThisWeek: number;
}

const EMPTY_STATS: Stats = { totalLinks: 0, totalClicks: 0, weeklyClicks: 0, newLinksThisWeek: 0 };

const STAT_CARDS: Array<{
  key: keyof Stats;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: 'totalLinks', label: '总链接数', icon: <Link2 size={20} />, color: 'from-blue-500 to-blue-600 shadow-blue-500/30' },
  { key: 'totalClicks', label: '总点击量', icon: <MousePointerClick size={20} />, color: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30' },
  { key: 'weeklyClicks', label: '本周点击', icon: <Calendar size={20} />, color: 'from-violet-500 to-violet-600 shadow-violet-500/30' },
  { key: 'newLinksThisWeek', label: '本周新增', icon: <Plus size={20} />, color: 'from-amber-500 to-orange-500 shadow-amber-500/30' },
];

function WebsiteLogo({ website }: { website: Website }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    try {
      const siteUrl = new URL(website.url);
      const saved = website.logo_url?.trim();
      const isGoogleFavicon = saved?.includes('google.com/s2/favicons') || saved?.includes('gstatic.com/faviconV2');

      // 无 logo / 指向 Google 图标服务 / 非 https 时，统一退化到站点自身的 favicon
      setSrc(!saved || isGoogleFavicon || !saved.startsWith('https://') ? `${siteUrl.origin}/favicon.ico` : saved);
    } catch {
      setSrc(null);
    }
  }, [website.logo_url, website.url]);

  if (!src) return <Globe className="text-slate-300" size={24} />;

  return (
    <img
      src={src}
      alt={website.name}
      className="w-10 h-10 object-contain"
      onError={() => setSrc(null)}
    />
  );
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getUserSession>>(null);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [modal, setModal] = useState<'' | 'login' | 'group' | 'website' | 'settings' | 'password' | 'checker'>('');

  const isAdmin = session?.isAdmin ?? false;

  const loadData = async () => {
    try {
      const [groupData, websiteData, statsData] = await Promise.all([
        apiGet<Group[]>('/api/groups'),
        apiGet<Website[]>('/api/websites'),
        apiGet<Stats>('/api/stats'),
      ]);

      setGroups(groupData);
      setWebsites(websiteData);
      setStats(statsData);
      setActiveGroupId((current) => current ?? groupData[0]?.id ?? null);
    } catch (error) {
      console.error('Failed to load data', error);
      // 会话失效：清空本地会话并回到登录
      if (error instanceof Error && error.message.includes('401')) {
        clearUserSession();
        setSession(null);
        setModal('login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = getUserSession();
    setSession(current);

    if (current) {
      loadData();
    } else {
      setLoading(false);
      setModal('login');
    }
  }, []);

  const handleLogin = () => {
    setSession(getUserSession());
    loadData();
  };

  const handleLogout = () => {
    clearUserSession();
    setSession(null);
    setGroups([]);
    setWebsites([]);
    setStats(EMPTY_STATS);
    setModal('login');
  };

  const saveGroup = async (data: Partial<Group>) => {
    try {
      if (editingGroup) {
        await apiPut(`/api/groups/${editingGroup.id}`, data);
      } else {
        await apiPost('/api/groups', data);
      }
      setModal('');
      setEditingGroup(null);
      await loadData();
    } catch (error) {
      console.error('Error saving group', error);
      alert(error instanceof Error ? error.message : '保存分组失败');
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('确定删除此分组及其所有网站吗？')) return;
    try {
      await apiDelete(`/api/groups/${id}`);
      if (activeGroupId === id) setActiveGroupId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting group', error);
      alert(error instanceof Error ? error.message : '删除分组失败');
    }
  };

  const saveWebsite = async (data: Partial<Website>) => {
    try {
      if (editingWebsite) {
        await apiPut(`/api/websites/${editingWebsite.id}`, data);
      } else {
        await apiPost('/api/websites', data);
      }
      setModal('');
      setEditingWebsite(null);
      await loadData();
    } catch (error) {
      console.error('Error saving website', error);
      alert(error instanceof Error ? error.message : '保存网站失败，请稍后重试');
    }
  };

  const deleteWebsite = async (id: number) => {
    if (!confirm('确定删除此网站吗？')) return;
    try {
      await apiDelete(`/api/websites/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting website', error);
    }
  };

  const openWebsite = (website: Website) => {
    // 点击统计不阻塞跳转
    apiPost(`/api/websites/${website.id}/click`).catch(() => null);
    window.open(website.url, '_blank');
  };

  const filterWebsites = (): Website[] => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return websites.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.url.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q)
      );
    }
    return activeGroupId ? websites.filter((w) => w.group_id === activeGroupId) : websites;
  };

  const visibleWebsites = filterWebsites();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏：分组列表 + 账号操作 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out lg:transform-none
        flex flex-col h-full shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <LayoutGrid className="text-blue-600" size={24} />
            SoloLink
          </h1>
          <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Groups</h2>
            {session && (
              <button
                onClick={() => { setEditingGroup(null); setModal('group'); }}
                className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                title="新建分组"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {groups.map((group) => {
            const count = websites.filter((w) => w.group_id === group.id).length;
            const active = activeGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  active ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => { setActiveGroupId(group.id); setSidebarOpen(false); }}
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <span className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {group.icon || '📁'}
                  </span>
                  <span className="font-medium truncate">{group.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </div>

                {session ? (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setModal('group'); }}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm transition-all"
                      title="编辑分组"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 shadow-sm transition-all"
                      title="删除分组"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : active ? (
                  <ChevronRight size={16} className="text-blue-400" />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {session ? (
            <div className="space-y-2">
              <button
                onClick={() => setModal('settings')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
              >
                <Settings size={18} />
                设置
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModal('login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            >
              <Settings size={18} />
              登录
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0" />

        <header className="px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between sticky top-0 z-20 glass mb-6">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-900">SoloLink</span>
          </div>

          <div className="hidden lg:block relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="搜索网站..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {session && (
            <div className="flex items-center gap-3 ml-auto lg:ml-0">
              <button
                onClick={() => setModal('checker')}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-all active:scale-95"
                title="检查所有链接"
              >
                <CheckCircle size={18} />
                <span className="hidden sm:inline">检查链接</span>
              </button>
              <button
                onClick={() => { setEditingWebsite(null); setModal('website'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">添加网站</span>
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8 z-10 custom-scrollbar">
          <div className="max-w-[1920px] mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {STAT_CARDS.map(({ key, label, icon, color }) => (
                <div key={key} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs font-medium">{label}</p>
                      <p className="text-2xl font-bold mt-1">{stats[key]}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {visibleWebsites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <FolderOpen size={64} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">暂无网站</h3>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
                  {searchQuery ? `未找到 "${searchQuery}" 相关的网站` : '该分组暂无网站，点击下方按钮添加'}
                </p>
                {session && !searchQuery && (
                  <div className="flex gap-4">
                    {groups.length === 0 && (
                      <button
                        onClick={() => { setEditingGroup(null); setModal('group'); }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                      >
                        <Plus size={20} />
                        创建第一个分组
                      </button>
                    )}
                    {groups.length > 0 && (
                      <button
                        onClick={() => { setEditingWebsite(null); setModal('website'); }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
                      >
                        <Plus size={20} />
                        添加网站
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                {visibleWebsites.map((website) => (
                  <div
                    key={website.id}
                    onClick={() => openWebsite(website)}
                    className="group bg-white rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-100 hover:border-blue-100 relative cursor-pointer hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4 h-full">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                        <WebsiteLogo website={website} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {website.name}
                        </h3>
                        {(website.click_count ?? 0) > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <span>🔥</span>
                            <span>{website.click_count}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl z-10 text-center pointer-events-none">
                      <p className="text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                        {website.description || website.url}
                      </p>
                    </div>

                    {session && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg p-1 border border-slate-100 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingWebsite(website); setModal('website'); }}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteWebsite(website.id); }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={modal === 'login'}
        onClose={() => setModal('')}
        onLogin={handleLogin}
      />

      <GroupModal
        isOpen={modal === 'group'}
        onClose={() => { setModal(''); setEditingGroup(null); }}
        onSubmit={saveGroup}
        initialData={editingGroup}
      />

      <WebsiteModal
        isOpen={modal === 'website'}
        onClose={() => { setModal(''); setEditingWebsite(null); }}
        onSubmit={saveWebsite}
        initialData={editingWebsite}
        groupId={activeGroupId || groups[0]?.id || 0}
        groups={groups}
      />

      <SettingsModal
        isOpen={modal === 'settings'}
        onClose={() => setModal('')}
        onDataChange={loadData}
        onOpenChangePassword={() => setModal('password')}
        isAdmin={isAdmin}
      />

      <ChangePasswordModal
        isOpen={modal === 'password'}
        onClose={() => setModal('')}
      />

      <LinkCheckerModal
        isOpen={modal === 'checker'}
        onClose={() => setModal('')}
        onDataChanged={loadData}
      />
    </div>
  );
}

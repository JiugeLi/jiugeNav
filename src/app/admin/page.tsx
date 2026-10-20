'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession, clearUserSession } from '@/lib/session';
import { apiGet, apiClient } from '@/lib/api-client';
import {
  Users, Link2, MousePointerClick, FolderOpen, Trash2, ArrowLeft, RefreshCw, Calendar, Clock,
} from 'lucide-react';

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

const EMPTY_STATS: AdminStats = {
  totalUsers: 0, totalLinks: 0, totalGroups: 0, totalClicks: 0, newUsersThisWeek: 0, newLinksThisWeek: 0,
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('zh-CN') : '-');

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        apiGet<AdminStats>('/api/admin/stats'),
        apiGet<AdminUser[]>('/api/admin/users'),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getUserSession()?.isAdmin) {
      router.push('/');
      return;
    }
    fetchData();
  }, [router]);

  const handleDeleteUser = async (id: number, email: string) => {
    if (!confirm(`确定删除用户 "${email}" 吗？该用户的分组和网站会一并删除。`)) return;

    try {
      await apiClient('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ id }) });
      fetchData();
    } catch (error) {
      console.error('Failed to delete user', error);
      alert('删除失败');
    }
  };

  const handleLogout = () => {
    clearUserSession();
    router.push('/');
  };

  const cards = [
    { label: '总用户数', value: stats.totalUsers, extra: `+${stats.newUsersThisWeek} 本周新增`, icon: <Users size={32} />, color: 'from-blue-500 to-blue-600' },
    { label: '总链接数', value: stats.totalLinks, extra: `+${stats.newLinksThisWeek} 本周新增`, icon: <Link2 size={32} />, color: 'from-emerald-500 to-emerald-600' },
    { label: '总分组数', value: stats.totalGroups, extra: '', icon: <FolderOpen size={32} />, color: 'from-violet-500 to-violet-600' },
    { label: '总点击量', value: stats.totalClicks, extra: '', icon: <MousePointerClick size={32} />, color: 'from-amber-500 to-orange-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">SoloLink 管理后台</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                  {card.extra && <p className="text-white/70 text-xs mt-1">{card.extra}</p>}
                </div>
                <span className="opacity-80">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">用户列表</h2>
            <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="刷新">
              <RefreshCw size={18} className="text-slate-600" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {['用户', '链接数', '分组数', '点击量', '注册时间', '最后登录', '操作'].map((title) => (
                    <th key={title} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                            {(user.name || user.email)[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{user.name || '未命名用户'}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Link2 size={12} />{user.linkCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                        <FolderOpen size={12} />{user.groupCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{user.totalClicks}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1"><Clock size={14} />{formatDate(user.last_login)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="删除用户"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && <div className="text-center py-12 text-slate-500">暂无用户</div>}
        </div>
      </div>
    </div>
  );
}

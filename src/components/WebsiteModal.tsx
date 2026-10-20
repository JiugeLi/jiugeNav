'use client';

import React, { useState, useEffect } from 'react';
import { Website, Group } from '@/types';
import { Globe, ImageIcon, Link as LinkIcon, FileText, Check, Loader2, Sparkles, FolderOpen } from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import Modal from './Modal';

interface WebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Website>) => void;
  initialData?: Website | null;
  groupId: number;
  groups: Group[];
}

interface SiteMeta {
  title: string;
  description: string;
  logoUrl: string;
  url: string;
}

const emptyForm = (groupId: number): Partial<Website> => ({
  name: '',
  url: '',
  description: '',
  logo_url: '',
  logo_type: 'default',
  sort_order: 0,
  group_id: groupId,
});

export default function WebsiteModal({ isOpen, onClose, onSubmit, initialData, groupId, groups }: WebsiteModalProps) {
  const [form, setForm] = useState<Partial<Website>>(emptyForm(groupId));
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setForm(initialData ?? emptyForm(groupId));
  }, [initialData, isOpen, groupId]);

  const update = (patch: Partial<Website>) => setForm((prev) => ({ ...prev, ...patch }));

  /** 抓取目标站点的标题 / 描述 / 图标 */
  const analyze = async () => {
    if (!form.url) return;
    setAnalyzing(true);

    try {
      const meta = await apiPost<SiteMeta>('/api/websites/analyze', { url: form.url });
      update({
        name: meta.title || form.name,
        description: meta.description || form.description,
        logo_url: meta.logoUrl || form.logo_url,
        url: meta.url || form.url,
        logo_type: 'auto',
      });
    } catch (error) {
      console.error('Error analyzing url:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, group_id: form.group_id ?? groupId });
  };

  const handleUrlBlur = () => {
    // 新增网站且还没填名字时，失焦自动识别
    if (!initialData && !form.name && form.url) analyze();
  };

  return (
    <Modal
      title={initialData ? <><Globe size={20} className="text-blue-500" />编辑网站</> : <><Sparkles size={20} className="text-blue-500" />添加网站</>}
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            取消
          </button>
          <button
            type="submit"
            form="website-form"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
          >
            <Check size={16} />
            保存
          </button>
        </>
      }
    >
      <form id="website-form" onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <LinkIcon size={16} className="text-slate-400" />
            网址
            <span className="text-slate-400 font-normal text-xs ml-auto">输入网址可自动识别</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.url}
              onChange={(e) => update({ url: e.target.value })}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
              placeholder="example.com"
              required
              onBlur={handleUrlBlur}
            />
            <button
              type="button"
              onClick={analyze}
              disabled={analyzing || !form.url}
              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              {analyzing ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} />智能识别</>}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FolderOpen size={16} className="text-slate-400" />
            分组
          </label>
          <select
            value={form.group_id}
            onChange={(e) => update({ group_id: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Globe size={16} className="text-slate-400" />
              名称
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
              placeholder="网站名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <ImageIcon size={16} className="text-slate-400" />
              图标地址
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={form.logo_url ?? ''}
                onChange={(e) => update({ logo_url: e.target.value })}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
                placeholder="留空则使用站点 favicon"
              />
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  <Globe className="text-slate-300" size={20} />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              描述
            </label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 min-h-[80px] resize-none"
              placeholder="选填"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

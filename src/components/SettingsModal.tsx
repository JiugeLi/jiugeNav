'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, AlertTriangle, Check, Loader2, Lock, Shield } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api-client';
import Modal from './Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void;
  onOpenChangePassword: () => void;
  isAdmin?: boolean;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function SettingsModal({
  isOpen,
  onClose,
  onDataChange,
  onOpenChangePassword,
  isAdmin = false,
}: SettingsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const data = await apiGet('/api/groups/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sololink-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: '导出成功' });
    } catch (error) {
      console.error('Export failed', error);
      setMessage({ type: 'error', text: '导出失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const replace = confirm('导入会与现有数据合并。\n\n点击「确定」合并导入，点击「取消」放弃导入。');
    if (!replace) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const json = JSON.parse(await file.text());
      await apiPost('/api/groups/import', { data: json.data, mode: 'merge' });
      setMessage({ type: 'success', text: '导入成功' });
      onDataChange();
      setTimeout(onClose, 1200);
    } catch (error) {
      console.error('Import failed', error);
      setMessage({ type: 'error', text: '导入失败，文件格式不正确' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal title="设置与数据" isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {isAdmin && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">账号安全</h3>

            <button
              onClick={() => { onClose(); router.push('/admin'); }}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-red-600">
                <Shield size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-900">管理后台</div>
                <div className="text-xs text-slate-500">用户、链接、数据管理</div>
              </div>
            </button>

            <button
              onClick={() => { onClose(); onOpenChangePassword(); }}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-purple-600">
                <Lock size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-900">修改密码</div>
                <div className="text-xs text-slate-500">更改管理员密码</div>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">数据管理</h3>

          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-60"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
              <Download size={20} />
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-900">导出数据</div>
              <div className="text-xs text-slate-500">下载 JSON 备份</div>
            </div>
          </button>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-60"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-900">导入数据</div>
              <div className="text-xs text-slate-500">从 JSON 备份恢复</div>
            </div>
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">SoloLink v1.0.0</p>
      </div>
    </Modal>
  );
}

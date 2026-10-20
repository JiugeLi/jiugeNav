'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import Modal from './Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) return setError('密码长度至少 6 位');
    if (newPassword !== confirmPassword) return setError('两次输入的密码不一致');

    setLoading(true);
    try {
      await apiPost('/api/auth/change-password', { newPassword });
      setSuccess('密码修改成功');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<><Lock size={20} className="text-blue-600" />修改管理员密码</>}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            取消
          </button>
          <button
            type="submit"
            form="password-form"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? '修改中...' : '确认修改'}
          </button>
        </>
      }
    >
      <form id="password-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="至少 6 位"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="再次输入新密码"
            required
            minLength={6}
          />
        </div>
      </form>
    </Modal>
  );
}

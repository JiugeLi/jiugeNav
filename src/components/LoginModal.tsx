'use client';

import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { saveUserSession, type UserSession } from '@/lib/session';
import { apiPost } from '@/lib/api-client';
import Modal from './Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishLogin = (session: UserSession) => {
    saveUserSession(session);
    onLogin();
    onClose();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { valid } = await apiPost<{ valid: boolean }>('/api/auth/verify', { password });

      if (!valid) {
        setError('密码错误');
        return;
      }

      // 密码登录即管理员会话，固定使用 1 号（admin@local）账号的数据
      finishLogin({ userId: 1, email: 'admin@local', name: 'Admin', avatar: null, isAdmin: true });
      setPassword('');
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (res: { credential?: string }) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiPost<{ success: boolean; user?: UserSession; message?: string }>(
        '/api/auth/google',
        { idToken: res.credential }
      );

      if (data.success && data.user) {
        finishLogin(data.user);
      } else {
        setError(data.message || 'Google 登录失败');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="登录 SoloLink" isOpen={isOpen} onClose={onClose} width="max-w-sm">
      <div className="p-6 space-y-6">
        <div>
          <div className="text-sm text-slate-600 mb-3 text-center">使用 Google 账号登录</div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google 登录失败')}
              useOneTap
              text="continue_with"
              shape="rectangular"
              size="large"
              width="300"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">或使用管理员密码</span>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="请输入管理密码"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            登录
          </button>
        </form>
      </div>
    </Modal>
  );
}

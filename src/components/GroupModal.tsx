'use client';

import React, { useState, useEffect } from 'react';
import { Group } from '@/types';
import { Check } from 'lucide-react';
import Modal from './Modal';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Group>) => void;
  initialData?: Group | null;
}

const ICONS = [
  '📁', '🏠', '💼', '🔧', '🎮', '🎬', '🎵', '📚',
  '🛒', '💰', '📰', '🔬', '🎨', '✈️', '🍔', '⚽',
  '💻', '📱', '🌐', '🔒', '📧', '📷', '🎯', '⭐',
  '🚀', '💡', '🔥', '❤️', '🌟', '🎁', '🏆', '📌',
];

export default function GroupModal({ isOpen, onClose, onSubmit, initialData }: GroupModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');

  useEffect(() => {
    setName(initialData?.name ?? '');
    setIcon(initialData?.icon ?? '📁');
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, icon, sort_order: initialData?.sort_order ?? 0 });
  };

  return (
    <Modal
      title={initialData ? '编辑分组' : '新建分组'}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            取消
          </button>
          <button
            type="submit"
            form="group-form"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2"
          >
            <Check size={16} />
            保存
          </button>
        </>
      }
    >
      <form id="group-form" onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">分组名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
            placeholder="例如：开发工具"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">图标</label>
          <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto custom-scrollbar p-2 border border-slate-200 rounded-xl">
            {ICONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors ${
                  icon === option ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-slate-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

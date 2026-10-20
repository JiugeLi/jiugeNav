'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class，默认 max-w-md */
  width?: string;
}

/** 统一的弹窗外壳：遮罩、标题栏、可滚动内容区、可选底部操作栏。 */
export default function Modal({ title, isOpen, onClose, children, footer, width = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative bg-white rounded-2xl w-full ${width} shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">{title}</h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

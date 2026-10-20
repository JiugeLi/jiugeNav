'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Trash2, CheckSquare, Square } from 'lucide-react';
import { apiGet, apiClient } from '@/lib/api-client';
import Modal from './Modal';

interface CheckResult {
  id: number;
  name: string;
  url: string;
  status: 'checking' | 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

interface BatchResponse {
  total: number;
  batchIndex: number;
  batchSize: number;
  isLastBatch: boolean;
  results: CheckResult[];
  progress: number;
}

interface LinkCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

const isBadLink = (r: CheckResult) => r.status !== 'ok' && r.status !== 'checking';

export default function LinkCheckerModal({ isOpen, onClose, onDataChanged }: LinkCheckerModalProps) {
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const startCheck = async () => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setResults([]);
    setSelectedIds(new Set());
    setProgress(0);
    setCheckedCount(0);
    setChecking(true);

    try {
      let batchIndex = 0;
      let collected: CheckResult[] = [];

      while (!signal.aborted) {
        const batch = await apiGet<BatchResponse>(`/api/websites/check?batch=${batchIndex}`, signal);

        if (batchIndex === 0) {
          setTotal(batch.total);
          // 先占位，避免结果区在第一批返回前空白
          collected = Array.from({ length: batch.total }, (_, i) => ({
            id: -1 - i, name: '检查中...', url: '', status: 'checking' as const,
          }));
        }

        batch.results.forEach((result, i) => {
          collected[batchIndex * batch.batchSize + i] = result;
        });

        setResults([...collected]);
        setCheckedCount(Math.min((batchIndex + 1) * batch.batchSize, batch.total));
        setProgress(batch.progress);

        if (batch.isLastBatch) break;
        batchIndex++;
      }

      if (!signal.aborted) {
        setSelectedIds(new Set(collected.filter(isBadLink).map((r) => r.id)));
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error('Link check failed:', error);
        alert('链接检查失败，请稍后重试');
      }
    } finally {
      setChecking(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 个链接吗？`)) return;

    setDeleting(true);
    try {
      const response = await apiClient('/api/websites/check', {
        method: 'DELETE',
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      alert(`已删除 ${selectedIds.size} 个链接`);
      onDataChanged();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const okCount = results.filter((r) => r.status === 'ok').length;
  const badLinks = results.filter(isBadLink);
  const pendingCount = results.filter((r) => r.status === 'checking').length;

  const statusIcon = (result: CheckResult) => {
    if (result.status === 'checking') return <Loader2 className="text-blue-500 animate-spin" size={20} />;
    if (result.status === 'ok') return <CheckCircle className="text-green-500" size={20} />;
    if (result.status === 'timeout') return <AlertCircle className="text-orange-500" size={20} />;
    return <XCircle className="text-red-500" size={20} />;
  };

  const statusText = (result: CheckResult) => {
    if (result.status === 'checking') return <span className="text-blue-600 text-xs">检查中...</span>;
    if (result.status === 'ok') return <span className="text-green-600 text-xs">正常 ({result.statusCode})</span>;
    if (result.status === 'timeout') return <span className="text-orange-600 text-xs">超时</span>;
    return <span className="text-red-600 text-xs">错误 ({result.statusCode || result.error})</span>;
  };

  return (
    <Modal
      title={<><CheckCircle size={20} className="text-blue-600" />链接检查器</>}
      isOpen={isOpen}
      onClose={() => { abortRef.current?.abort(); setChecking(false); onClose(); }}
      width="max-w-3xl"
      footer={results.length > 0 ? (
        <>
          <div className="flex gap-2 mr-auto">
            {checking ? (
              <button onClick={() => abortRef.current?.abort()} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                停止检查
              </button>
            ) : (
              <button onClick={startCheck} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                重新检查
              </button>
            )}
          </div>
          {selectedIds.size > 0 && !checking && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              删除选中的 {selectedIds.size} 个链接
            </button>
          )}
        </>
      ) : undefined}
    >
      <div className="p-6">
        {results.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-slate-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">开始检查链接</h3>
            <p className="text-slate-500 mb-6">检测 404、超时等异常情况，检查后可批量清理失效链接</p>
            <button
              onClick={startCheck}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md mx-auto"
            >
              <CheckCircle size={18} />
              开始检查
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {checking && (
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium text-slate-700">正在检查... ({checkedCount}/{total})</span>
                  <span className="font-medium text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '总链接数', value: results.length, className: 'bg-slate-50 text-slate-900' },
                { label: '正常链接', value: okCount, className: 'bg-green-50 text-green-600' },
                { label: '失效链接', value: badLinks.length, className: 'bg-red-50 text-red-600' },
                { label: '待检查', value: pendingCount, className: 'bg-blue-50 text-blue-600' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 text-center ${item.className.split(' ')[0]}`}>
                  <div className={`text-xl font-bold ${item.className.split(' ')[1]}`}>{item.value}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>

            {!checking && badLinks.length > 0 && (
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <span className="text-sm text-slate-600">
                  已选择 <span className="font-bold text-red-600">{selectedIds.size}</span> 个链接待删除
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIds(new Set(badLinks.map((r) => r.id)))}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    全选失效链接
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    取消全选
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {results.map((link) => {
                const bad = isBadLink(link);
                const selected = selectedIds.has(link.id);

                return (
                  <div
                    key={link.id}
                    className={`rounded-xl p-3 flex items-start gap-3 border ${
                      link.status === 'checking' ? 'bg-blue-50 border-blue-100'
                        : link.status === 'ok' ? 'bg-green-50 border-green-100'
                        : selected ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100'
                    }`}
                  >
                    {bad && !checking && (
                      <button onClick={() => toggleSelection(link.id)} className="flex-shrink-0 mt-0.5">
                        {selected
                          ? <CheckSquare className="text-red-600" size={20} />
                          : <Square className="text-slate-400" size={20} />}
                      </button>
                    )}

                    {statusIcon(link)}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{link.name}</div>
                      <div className="text-sm text-slate-500 truncate">{link.url}</div>
                      {statusText(link)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

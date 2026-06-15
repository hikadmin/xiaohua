'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { type Period, type PeriodInfoResult } from './shared';

// ============ Action Option Component ============
function ActionOption({
  variant, icon, title, desc, onClick,
}: {
  variant: 'primary' | 'sage' | 'danger';
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const colors = {
    primary: { bg: 'rgba(224,122,95,0.12)', border: 'rgba(224,122,95,0.25)', iconBg: 'linear-gradient(135deg, #e07a5f, #d4a574)' },
    sage: { bg: 'rgba(129,178,154,0.12)', border: 'rgba(129,178,154,0.25)', iconBg: 'linear-gradient(135deg, #81b29a, #6b9e85)' },
    danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  };
  const c = colors[variant];

  return (
    <motion.button
      className="flex items-center gap-3.5 p-4 rounded-[14px] transition-all w-full text-left"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.iconBg }}>
        <span style={{ color: '#0f1419' }}>{icon}</span>
      </div>
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="text-xs" style={{ color: '#6b7280' }}>{desc}</p>
      </div>
    </motion.button>
  );
}

interface ActionSheetProps {
  open: boolean;
  dateStr: string;
  day: number;
  calMonth: number;
  setActionSheet: React.Dispatch<React.SetStateAction<{ open: boolean; dateStr: string; day: number }>>;
  periods: Period[];
  hasActivePeriod: () => Period | null;
  getPeriodInfo: (dateStr: string) => PeriodInfoResult;
  startPeriod: (dateStr: string) => void;
  endPeriod: (dateStr: string) => void;
  updateStart: (dateStr: string) => void;
  cancelActivePeriod: () => void;
  extendPeriod: (dateStr: string) => void;
  fetchPeriods: () => Promise<void>;
  toast: (opts: { description: string }) => void;
}

export default function ActionSheet({
  open, dateStr, day, calMonth, setActionSheet, periods,
  hasActivePeriod, getPeriodInfo, startPeriod, endPeriod,
  updateStart, cancelActivePeriod, extendPeriod, fetchPeriods, toast,
}: ActionSheetProps) {

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        key="action-sheet"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={() => setActionSheet({ open: false, dateStr: '', day: 0 })}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-4 pb-8"
          style={{ background: 'var(--luna-surface)', maxHeight: '80dvh', overflowY: 'auto', paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: 'var(--luna-text-muted)' }} />
          <div className="text-center mb-4">
            <span className="text-base font-medium">
              {calMonth}月{day}日
            </span>
          </div>
          <div className="space-y-2">
            {(() => {
              const active = hasActivePeriod();
              const periodInfo = getPeriodInfo(dateStr);

              if (active) {
                if (dateStr === active.startDate) {
                  return (
                    <>
                      <ActionOption variant="sage" icon={<ArrowRight size={22} />} title="经期走了" desc="标记经期在这一天结束" onClick={() => endPeriod(dateStr)} />
                      <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                    </>
                  );
                } else if (dateStr < active.startDate) {
                  return (
                    <>
                      <ActionOption variant="primary" icon={<ChevronLeft size={22} />} title="修改开始日期" desc="将经期开始提前至此日" onClick={() => updateStart(dateStr)} />
                      <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                    </>
                  );
                } else {
                  return (
                    <>
                      <ActionOption variant="sage" icon={<ArrowRight size={22} />} title="经期走了" desc="标记经期在这一天结束" onClick={() => endPeriod(dateStr)} />
                      <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                    </>
                  );
                }
              } else if (periodInfo.isPeriod) {
                return (
                  <>
                    <ActionOption variant="primary" icon={<Plus size={22} />} title="延长经期" desc="将经期结束日期延后一天" onClick={() => extendPeriod(dateStr)} />
                    <ActionOption variant="danger" icon={<X size={22} />} title="取消经期记录" desc="删除这一天的经期标记"
                      onClick={async () => {
                        const period = periods.find(p => {
                          if (!p.endDate) return dateStr === p.startDate;
                          return dateStr >= p.startDate && dateStr <= p.endDate;
                        });
                        if (period) {
                          await fetch(`/api/periods/${period.id}`, { method: 'DELETE' });
                          setActionSheet({ open: false, dateStr: '', day: 0 });
                          await fetchPeriods();
                          toast({ description: '已取消该日期的经期记录' });
                        }
                      }} />
                  </>
                );
              } else {
                return (
                  <ActionOption variant="primary" icon={<Plus size={22} />} title="经期来了" desc="标记这一天为经期开始" onClick={() => startPeriod(dateStr)} />
                );
              }
            })()}
          </div>
          <div className="text-center py-4 mt-2 cursor-pointer transition-colors"
            style={{ color: 'var(--luna-text-muted)' }}
            onClick={() => setActionSheet({ open: false, dateStr: '', day: 0 })}>
            取消
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}

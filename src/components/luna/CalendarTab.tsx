'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { TKey } from '@/lib/i18n';
import {
  parseDate, daysBetween,
  type CalendarDay, type Period,
} from './shared';

const WEEKDAY_SHORT_KEYS: TKey[] = ['week_sun', 'week_mon', 'week_tue', 'week_wed', 'week_thu', 'week_fri', 'week_sat'];

interface CalendarTabProps {
  calYear: number;
  calMonth: number;
  setCalYear: React.Dispatch<React.SetStateAction<number>>;
  setCalMonth: React.Dispatch<React.SetStateAction<number>>;
  isCurrentMonth: boolean;
  today: Date;
  calendarDays: CalendarDay[];
  periods: Period[];
  setActionSheet: React.Dispatch<React.SetStateAction<{ open: boolean; dateStr: string; day: number }>>;
}

export default function CalendarTab({
  calYear, calMonth, setCalYear, setCalMonth,
  isCurrentMonth, today, calendarDays, periods, setActionSheet,
}: CalendarTabProps) {
  const { t } = useI18n();

  return (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="px-5 pt-12 pb-6"
    >
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#232b35' }}
          onClick={() => {
            let m = calMonth - 1; let y = calYear;
            if (m < 1) { m = 12; y--; }
            setCalMonth(m); setCalYear(y);
          }}>
          <ChevronLeft size={20} style={{ color: '#a8a29e' }} />
        </button>
        <div className="flex items-center gap-3">
          <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
            {t('calendar_month_format', calYear, calMonth)}
          </p>
          {!isCurrentMonth && (
            <button className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(224,122,95,0.15)', color: '#e07a5f' }}
              onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth() + 1); }}>
              {t('calendar_back_today')}
            </button>
          )}
        </div>
        <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#232b35' }}
          onClick={() => {
            let m = calMonth + 1; let y = calYear;
            if (m > 12) { m = 1; y++; }
            setCalMonth(m); setCalYear(y);
          }}>
          <ChevronRight size={20} style={{ color: '#a8a29e' }} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_SHORT_KEYS.map((wk, i) => (
          <div key={i} className="text-center text-xs py-2 font-medium" style={{ color: i === 0 || i === 6 ? '#e07a5f80' : '#6b7280' }}>{t(wk)}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {calendarDays.map((day, i) => {
          if (day.isOtherMonth) {
            return <div key={`empty-${i}`} className="h-10" />;
          }

          let bgStyle: React.CSSProperties = {};
          let textColor = '#f0ece4';
          let borderRadius = '12px';
          let extraClass = '';

          if (day.periodInfo.isPeriod) {
            if (day.periodInfo.isStart && day.periodInfo.isEnd) borderRadius = '20px';
            else if (day.periodInfo.isStart) borderRadius = '20px 4px 4px 20px';
            else if (day.periodInfo.isEnd) borderRadius = '4px 20px 20px 4px';
            else borderRadius = '4px';

            bgStyle = {
              background: '#e07a5f',
              color: '#0f1419',
              fontWeight: 500,
              borderRadius,
            };
            textColor = '#0f1419';

            if (day.periodInfo.isActive) {
              extraClass = '';
              bgStyle.animation = 'period-pulse 2s ease-in-out infinite';
            }
          } else if (day.isPredicted) {
            bgStyle = { background: 'rgba(129,178,154,0.15)' };
            textColor = '#81b29a';
          } else if (day.isFertile) {
            bgStyle = { background: 'rgba(212,165,116,0.15)' };
            textColor = '#d4a574';
          }

          if (day.isToday) {
            if (day.periodInfo.isPeriod) {
              bgStyle = {
                ...bgStyle,
                background: '#e07a5f',
                boxShadow: '0 0 0 3px #d4a574',
                transform: 'scale(1.08)',
                zIndex: 10,
                fontWeight: 700,
              };
            } else {
              bgStyle = {
                ...bgStyle,
                background: 'linear-gradient(135deg, #d4a574, #f2cc8f)',
                color: '#0f1419',
                fontWeight: 700,
                transform: 'scale(1.08)',
                zIndex: 10,
              };
            }
            textColor = '#0f1419';
          }

          return (
            <motion.div
              key={day.dateStr}
              className="h-10 flex items-center justify-center cursor-pointer transition-all"
              style={{
                borderRadius: '12px',
                color: textColor,
                fontSize: 14,
                ...bgStyle,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActionSheet({ open: true, dateStr: day.dateStr, day: day.day })}
            >
              {day.day}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-[20px] p-5" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-medium mb-4">{t('calendar_legend')}</p>
        <div className="space-y-3">
          {[
            { color: '#e07a5f', bg: 'rgba(224,122,95,0.25)', border: '2px solid #e07a5f', label: t('calendar_period_label'), desc: t('calendar_period_desc') },
            { color: '#81b29a', bg: 'transparent', border: '2px dashed #81b29a', label: t('calendar_predicted_period'), desc: t('calendar_predicted_desc') },
            { color: '#d4a574', bg: 'rgba(212,165,116,0.25)', border: '2px solid #d4a574', label: t('calendar_fertile_window'), desc: t('calendar_fertile_desc') },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: '#1a2027' }}>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: item.bg, border: item.border }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle History Summary */}
      {periods.length > 1 && (
        <div className="rounded-[20px] p-5 mt-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-4">{t('calendar_cycle_history')}</p>
          {[...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5).map(period => {
            const startD = parseDate(period.startDate);
            const endD = period.endDate ? parseDate(period.endDate) : null;
            const len = endD ? daysBetween(startD, endD) + 1 : null;
            return (
              <div key={period.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(224,122,95,0.15)' }}>
                  <Droplets size={14} style={{ color: '#e07a5f' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {endD
                      ? t('calendar_date_range', startD.getMonth() + 1, startD.getDate(), endD.getMonth() + 1, endD.getDate())
                      : `${t('home_date_short', startD.getMonth() + 1, startD.getDate())} — ${t('calendar_ongoing')}`
                    }
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a29e' }}>
                  {len !== null ? t('calendar_n_days', len) : t('calendar_ongoing')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

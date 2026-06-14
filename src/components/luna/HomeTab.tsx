'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Activity, Droplets, ArrowRight } from 'lucide-react';
import {
  StaggerIn, formatDateChinese, PHASE_INFO, RING_TICK_MARKS,
  DAILY_TIPS, MOOD_EMOJIS, FLOW_LABELS, parseDate, renderMoodEmoji,
  type DailyRecord, type CycleInfo, type CycleStats, type TabPage,
} from './shared';

interface HomeTabProps {
  today: Date;
  cycleInfo: CycleInfo;
  cycleStats: CycleStats;
  records: DailyRecord[];
  dailyTipIndex: number;
  setDailyTipIndex: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab: (tab: TabPage) => void;
  setLogTab: (tab: 'record' | 'history') => void;
  ringAnimated: boolean;
  themeColor: string;
  onBellClick: () => void;
}

export default function HomeTab({
  today, cycleInfo, cycleStats, records, dailyTipIndex,
  setDailyTipIndex, setActiveTab, setLogTab, ringAnimated, themeColor, onBellClick,
}: HomeTabProps) {
  const phaseData = PHASE_INFO[cycleInfo.phase] || PHASE_INFO.follicular;

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="px-5 pt-12 pb-6"
    >
      {/* Header */}
      <StaggerIn delay={0.05}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm" style={{ color: '#a8a29e' }}>今天</p>
            <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
              {formatDateChinese(today)}
            </p>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={onBellClick}>
            <Bell size={18} style={{ color: '#a8a29e' }} />
          </button>
        </div>
      </StaggerIn>

      {/* Phase Card */}
      <StaggerIn delay={0.1}>
        <div className="rounded-[20px] p-5 mb-4 transition-all"
          style={{
            background: `linear-gradient(135deg, ${phaseData.color}10, #232b35)`,
            border: `1px solid ${phaseData.color}30`,
          }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">{phaseData.icon}</span>
            <div className="w-2.5 h-2.5 rounded-full"
              style={{ background: phaseData.color, boxShadow: `0 0 10px ${phaseData.color}80` }} />
            <span className="text-sm font-medium" style={{ color: phaseData.color }}>
              {phaseData.name} 第{cycleInfo.phaseDay}天
            </span>
          </div>
          <p className="text-lg font-light mb-2">{phaseData.desc}</p>
          <p className="text-sm" style={{ color: '#a8a29e' }}>{phaseData.tip}</p>
        </div>
      </StaggerIn>

      {/* Cycle Ring */}
      <StaggerIn delay={0.2}>
        <div className="flex flex-col items-center my-6">
          <div className="relative" style={{ width: 240, height: 240 }}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={themeColor} />
                  <stop offset="50%" stopColor="#d4a574" />
                  <stop offset="100%" stopColor="#81b29a" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle cx="120" cy="120" r="105" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              {/* Subtle tick marks */}
              {RING_TICK_MARKS.map((tick, i) => (
                <line key={i} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
              {/* Progress */}
              <circle
                cx="120" cy="120" r="105" fill="none"
                stroke="url(#ringGradient)" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 105}
                strokeDashoffset={ringAnimated ? 2 * Math.PI * 105 * (1 - (cycleInfo.phaseDay / cycleInfo.cycleLength)) : 2 * Math.PI * 105}
                style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              {/* Glow */}
              <circle
                cx="120" cy="120" r="105" fill="none"
                stroke="url(#ringGradient)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 105}
                strokeDashoffset={ringAnimated ? 2 * Math.PI * 105 * (1 - (cycleInfo.phaseDay / cycleInfo.cycleLength)) : 2 * Math.PI * 105}
                filter="blur(6px)" opacity={0.4}
                style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            {/* Center Content */}
            <div className="absolute inset-[25px] rounded-full flex flex-col items-center justify-center">
              <p className="text-xs mb-0.5" style={{ color: '#6b7280' }}>下次经期预计</p>
              <motion.p
                className="text-4xl font-light"
                style={{ fontFamily: 'Georgia, serif' }}
                key={cycleInfo.daysUntilNext}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {cycleInfo.daysUntilNext}
              </motion.p>
              <p className="text-sm" style={{ color: '#a8a29e' }}>天后</p>
            </div>
          </div>
        </div>
      </StaggerIn>

      {/* Stats Grid */}
      <StaggerIn delay={0.3}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] p-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} style={{ color: '#81b29a' }} />
              <p className="text-xs" style={{ color: '#6b7280' }}>周期长度</p>
            </div>
            <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
              {cycleStats.avgCycle}
              <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
            </p>
          </div>
          <div className="rounded-[20px] p-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={14} style={{ color: themeColor }} />
              <p className="text-xs" style={{ color: '#6b7280' }}>经期长度</p>
            </div>
            <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
              {cycleStats.avgPeriod}
              <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
            </p>
          </div>
        </div>
      </StaggerIn>

      {/* Cycle Phase Timeline */}
      <StaggerIn delay={0.35}>
        <div className="rounded-[20px] p-5 mt-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-4">周期阶段</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
            {/* Period phase */}
            <div
              className="rounded-l-full transition-all"
              style={{
                width: `${(cycleInfo.periodLength / cycleInfo.cycleLength) * 100}%`,
                background: themeColor,
                boxShadow: cycleInfo.phase === 'period' ? `0 0 8px ${themeColor}80` : 'none',
              }} />
            {/* Follicular phase */}
            <div
              className="transition-all"
              style={{
                width: `${((13 - cycleInfo.periodLength) / cycleInfo.cycleLength) * 100}%`,
                background: cycleInfo.phase === 'follicular' ? '#81b29a' : '#81b29a60',
                boxShadow: cycleInfo.phase === 'follicular' ? '0 0 8px #81b29a80' : 'none',
              }} />
            {/* Ovulation phase */}
            <div
              className="transition-all"
              style={{
                width: `${(3 / cycleInfo.cycleLength) * 100}%`,
                background: cycleInfo.phase === 'ovulation' ? '#d4a574' : '#d4a57460',
                boxShadow: cycleInfo.phase === 'ovulation' ? '0 0 8px #d4a57480' : 'none',
              }} />
            {/* Luteal phase */}
            <div
              className="rounded-r-full transition-all"
              style={{
                width: `${((cycleInfo.cycleLength - 16) / cycleInfo.cycleLength) * 100}%`,
                background: cycleInfo.phase === 'luteal' ? '#f2cc8f' : '#f2cc8f60',
                boxShadow: cycleInfo.phase === 'luteal' ? '0 0 8px #f2cc8f80' : 'none',
              }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#6b7280' }}>
            <span style={{ color: cycleInfo.phase === 'period' ? themeColor : '#6b7280' }}>经期</span>
            <span style={{ color: cycleInfo.phase === 'follicular' ? '#81b29a' : '#6b7280' }}>卵泡期</span>
            <span style={{ color: cycleInfo.phase === 'ovulation' ? '#d4a574' : '#6b7280' }}>排卵</span>
            <span style={{ color: cycleInfo.phase === 'luteal' ? '#f2cc8f' : '#6b7280' }}>黄体期</span>
          </div>
        </div>
      </StaggerIn>

      {/* Recent Records */}
      {records.length > 0 && (
        <StaggerIn delay={0.4}>
          <div className="mt-4 rounded-[20px] p-5" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium">最近记录</p>
              <button className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a29e' }}
                onClick={() => { setActiveTab('log'); setLogTab('history'); }}>
                查看全部
              </button>
            </div>
            {records.slice(0, 3).map(record => {
              const d = parseDate(record.date);
              const symptoms = JSON.parse(record.symptoms || '[]');
              return (
                <div key={record.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: `${phaseData.color}15` }}>
                    {renderMoodEmoji(record.mood, 'text-sm w-5 h-5') || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.getMonth() + 1}月{d.getDate()}日</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {symptoms.slice(0, 2).map((s: string, i: number) => (
                        <span key={i} className="text-[11px] px-1.5 py-0.5 rounded-md"
                          style={{ background: `${themeColor}1a`, color: themeColor }}>
                          {s}
                        </span>
                      ))}
                      {symptoms.length > 2 && (
                        <span className="text-[11px] px-1.5 py-0.5" style={{ color: '#6b7280' }}>
                          +{symptoms.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#6b7280' }}>
                    {FLOW_LABELS[record.flow]}
                  </span>
                </div>
              );
            })}
          </div>
        </StaggerIn>
      )}

      {/* Daily Health Tip */}
      <StaggerIn delay={0.45}>
        <div className="mt-4 rounded-[20px] p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${phaseData.color}15, #232b3580)`,
            border: `1px solid ${phaseData.color}20`,
            backdropFilter: 'blur(20px)',
          }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: phaseData.color, filter: 'blur(30px)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${phaseData.color}20` }}>
              <span className="text-lg">💡</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">今日小贴士</p>
              <motion.p
                className="text-sm leading-relaxed"
                style={{ color: '#a8a29e' }}
                key={dailyTipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {DAILY_TIPS[cycleInfo.phase]?.[dailyTipIndex] || DAILY_TIPS.follicular[0]}
              </motion.p>
            </div>
            <button className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setDailyTipIndex(prev => (prev + 1) % 5)}>
              <ArrowRight size={14} style={{ color: '#a8a29e' }} />
            </button>
          </div>
        </div>
      </StaggerIn>

      {/* Cycle Trend Mini Chart */}
      {cycleStats.cycleLengths.length > 0 && (
        <StaggerIn delay={0.5}>
          <div className="mt-4 rounded-[20px] p-5" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium">周期趋势</p>
              <span className="text-xs" style={{ color: '#6b7280' }}>最近{Math.min(cycleStats.cycleLengths.length, 6)}个周期</span>
            </div>
            <div className="flex items-end gap-2 h-20">
              {cycleStats.cycleLengths.slice(-6).map((len, i) => {
                const maxLen = Math.max(...cycleStats.cycleLengths.slice(-6));
                const minLen = Math.min(...cycleStats.cycleLengths.slice(-6));
                const range = maxLen - minLen || 1;
                const height = 20 + ((len - minLen) / range) * 60;
                const isLast = i === cycleStats.cycleLengths.slice(-6).length - 1;
                return (
                  <motion.div key={i} className="flex-1 flex flex-col items-center gap-1"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}>
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>{len}</span>
                    <motion.div
                      className="w-full rounded-t-md"
                      style={{
                        height,
                        background: isLast
                          ? `linear-gradient(to top, ${themeColor}, ${themeColor}cc)`
                          : 'rgba(255,255,255,0.08)',
                        minHeight: 8,
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.15 * i, duration: 0.4 }}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[11px]" style={{ color: '#6b7280' }}>平均 {cycleStats.avgCycle} 天</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: themeColor }} />
                <span className="text-[11px]" style={{ color: '#6b7280' }}>最近</span>
              </div>
            </div>
          </div>
        </StaggerIn>
      )}
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, FileText, User, Plus, Bell, ChevronLeft, ChevronRight,
  Droplets, Moon, Sun, Shield, Lock, Eye, Database, Cloud, RotateCcw,
  Download, Globe, Info, MessageSquare, X, ArrowRight, Target,
  TrendingUp, Activity, Heart, Clock, Crosshair, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============ Types ============
interface Period {
  id: string;
  startDate: string;
  endDate: string | null;
}

interface DailyRecord {
  id: string;
  date: string;
  flow: number;
  mood: number;
  symptoms: string;
  note: string;
}

interface UserProfile {
  id: string;
  name: string;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
}

interface Setting {
  id: string;
  key: string;
  value: string;
}

type TabPage = 'home' | 'calendar' | 'log' | 'profile';

// ============ Constants ============
const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const FLOW_LABELS = ['', '点滴', '少量', '中等', '大量'];
const MOOD_LABELS = ['', '开心', '平静', '低落', '烦躁', '焦虑'];
const MOOD_EMOJIS = ['', '😊', '😌', '😔', '😤', '😰'];
const DEFAULT_SYMPTOMS = ['痛经', '腰酸', '头痛', '疲劳', '腹胀', '乳房胀痛'];

const PHASE_INFO: Record<string, { name: string; desc: string; tip: string; color: string; icon: string }> = {
  period: { name: '经期', desc: '休养期', tip: '注意保暖休息，避免剧烈运动', color: '#e07a5f', icon: '🩸' },
  follicular: { name: '卵泡期', desc: '能量回升期', tip: '雌激素水平上升，适合进行高强度运动和创造性工作', color: '#81b29a', icon: '🌱' },
  ovulation: { name: '排卵期', desc: '高峰期', tip: '精力充沛，社交能力和创造力最佳', color: '#d4a574', icon: '✨' },
  luteal: { name: '黄体期', desc: '平缓期', tip: '注意情绪波动，适合轻度运动和放松', color: '#f2cc8f', icon: '🌙' },
};

// ============ Utility Functions ============
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateChinese(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS_FULL[date.getDay()]}`;
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============ Stagger animation wrapper ============
function StaggerIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ============ Main Component ============
export default function LunaApp() {
  const [activeTab, setActiveTab] = useState<TabPage>('home');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  // Action sheet state
  const [actionSheet, setActionSheet] = useState<{
    open: boolean;
    dateStr: string;
    day: number;
  }>({ open: false, dateStr: '', day: 0 });

  // Symptom sheet state
  const [symptomSheetOpen, setSymptomSheetOpen] = useState(false);
  const [newSymptom, setNewSymptom] = useState('');

  // Log state
  const [logTab, setLogTab] = useState<'record' | 'history'>('record');
  const [currentFlow, setCurrentFlow] = useState(2);
  const [currentMood, setCurrentMood] = useState(2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');

  const { toast } = useToast();

  // ============ Data Fetching ============
  const fetchPeriods = useCallback(async () => {
    try {
      const res = await fetch('/api/periods');
      if (res.ok) setPeriods(await res.json());
    } catch {}
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) setRecords(await res.json());
    } catch {}
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) setProfile(await res.json());
    } catch {}
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch {}
  }, []);

  const seedData = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedData();
      await Promise.all([fetchPeriods(), fetchRecords(), fetchProfile(), fetchSettings()]);
      setIsLoaded(true);
      // Trigger ring animation after load
      setTimeout(() => setRingAnimated(true), 300);
    };
    init();
  }, [seedData, fetchPeriods, fetchRecords, fetchProfile, fetchSettings]);

  // ============ Period Logic ============
  function getPeriodInfo(dateStr: string) {
    let isPeriod = false;
    let isStart = false;
    let isEnd = false;
    let isActive = false;

    for (const period of periods) {
      if (period.startDate && !period.endDate) {
        if (dateStr === period.startDate) {
          isPeriod = true; isStart = true; isEnd = true; isActive = true;
          break;
        }
        // Active period extends from start to today
        const startD = parseDate(period.startDate);
        const checkD = parseDate(dateStr);
        if (checkD > startD && checkD <= new Date()) {
          isPeriod = true;
          if (dateStr === period.startDate) isStart = true;
          isActive = true;
          break;
        }
      } else if (period.startDate && period.endDate) {
        if (dateStr >= period.startDate && dateStr <= period.endDate) {
          isPeriod = true;
          if (dateStr === period.startDate) isStart = true;
          if (dateStr === period.endDate) isEnd = true;
          break;
        }
      }
    }
    return { isPeriod, isStart, isEnd, isActive };
  }

  function hasActivePeriod(): Period | null {
    return periods.find(p => p.startDate && !p.endDate) || null;
  }

  function getCycleInfo() {
    const cycleLength = profile?.cycleLength || 28;
    const periodLength = profile?.periodLength || 5;
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];

    if (!lastPeriod) {
      return {
        phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength,
        cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: null,
      };
    }

    const lastStart = parseDate(lastPeriod.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysSinceStart = daysBetween(lastStart, now);

    if (daysSinceStart < 0) {
      return {
        phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength,
        cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: lastPeriod.startDate,
      };
    }

    const dayInCycle = (daysSinceStart % cycleLength) + 1;
    const nextPeriodDate = addDays(lastStart, cycleLength);
    const daysUntilNext = Math.max(0, daysBetween(now, nextPeriodDate));

    let phase: string;
    if (dayInCycle <= periodLength) {
      phase = 'period';
    } else if (dayInCycle <= 13) {
      phase = 'follicular';
    } else if (dayInCycle <= 16) {
      phase = 'ovulation';
    } else {
      phase = 'luteal';
    }

    return {
      phase, phaseDay: dayInCycle, daysUntilNext,
      cycleLength, periodLength, nextPeriodDate, lastPeriodStart: lastPeriod.startDate,
    };
  }

  function getPredictedPeriodDays(): string[] {
    const cycleLength = profile?.cycleLength || 28;
    const periodLength = profile?.periodLength || 5;
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod || !lastPeriod.endDate) return [];

    const lastEnd = parseDate(lastPeriod.endDate);
    const nextStart = addDays(lastEnd, cycleLength - periodLength + 1);
    const days: string[] = [];
    for (let i = 0; i < periodLength; i++) {
      days.push(formatDateStr(addDays(nextStart, i)));
    }
    return days;
  }

  function getFertileDays(): string[] {
    const cycleLength = profile?.cycleLength || 28;
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod) return [];

    const lastStart = parseDate(lastPeriod.startDate);
    const ovulationDay = addDays(lastStart, cycleLength - 14);
    const days: string[] = [];
    for (let i = -4; i <= 1; i++) {
      days.push(formatDateStr(addDays(ovulationDay, i)));
    }
    return days;
  }

  // ============ API Actions ============
  async function startPeriod(dateStr: string) {
    await fetch('/api/periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateStr }),
    });
    setActionSheet({ open: false, dateStr: '', day: 0 });
    await fetchPeriods();
    toast({ description: '已记录经期开始 💖' });
  }

  async function endPeriod(dateStr: string) {
    const active = hasActivePeriod();
    if (!active) return;
    if (dateStr < active.startDate) {
      toast({ description: '结束日期不能早于开始日期' });
      return;
    }
    await fetch(`/api/periods/${active.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: dateStr }),
    });
    setActionSheet({ open: false, dateStr: '', day: 0 });
    await fetchPeriods();
    toast({ description: '经期已结束，记录完成 ✅' });
  }

  async function updateStart(dateStr: string) {
    const active = hasActivePeriod();
    if (!active) return;
    await fetch(`/api/periods/${active.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateStr }),
    });
    setActionSheet({ open: false, dateStr: '', day: 0 });
    await fetchPeriods();
    toast({ description: '开始日期已更新' });
  }

  async function cancelActivePeriod() {
    const active = hasActivePeriod();
    if (!active) return;
    await fetch(`/api/periods/${active.id}`, { method: 'DELETE' });
    setActionSheet({ open: false, dateStr: '', day: 0 });
    await fetchPeriods();
    toast({ description: '已取消当前记录' });
  }

  async function extendPeriod(dateStr: string) {
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod) return;
    await fetch(`/api/periods/${lastPeriod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: dateStr }),
    });
    setActionSheet({ open: false, dateStr: '', day: 0 });
    await fetchPeriods();
    toast({ description: '经期已延长' });
  }

  async function saveRecord() {
    const todayStr = formatDateStr(new Date());
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: todayStr,
        flow: currentFlow,
        mood: currentMood,
        symptoms: selectedSymptoms,
        note: noteText,
      }),
    });
    await fetchRecords();
    setNoteText('');
    toast({ description: '记录已保存 ✨' });
  }

  async function toggleSetting(key: string, currentValue: string) {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: newValue }),
    });
    await fetchSettings();
  }

  // ============ Calendar Generation ============
  function generateCalendarDays() {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayStr = formatDateStr(new Date());
    const predictedDays = getPredictedPeriodDays();
    const fertileDays = getFertileDays();

    const days: Array<{
      day: number;
      dateStr: string;
      isToday: boolean;
      isOtherMonth: boolean;
      periodInfo: ReturnType<typeof getPeriodInfo>;
      isPredicted: boolean;
      isFertile: boolean;
    }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        day: 0, dateStr: '', isToday: false, isOtherMonth: true,
        periodInfo: { isPeriod: false, isStart: false, isEnd: false, isActive: false },
        isPredicted: false, isFertile: false,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const periodInfo = getPeriodInfo(dateStr);
      const isPredicted = predictedDays.includes(dateStr) && !periodInfo.isPeriod;
      const isFertile = fertileDays.includes(dateStr) && !periodInfo.isPeriod && !isPredicted;

      days.push({ day, dateStr, isToday, isOtherMonth: false, periodInfo, isPredicted, isFertile });
    }

    return days;
  }

  // ============ Cycle Statistics ============
  const cycleStats = useMemo(() => {
    const sortedPeriods = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];

    for (let i = 1; i < sortedPeriods.length; i++) {
      if (sortedPeriods[i].endDate) {
        const cycleLen = daysBetween(parseDate(sortedPeriods[i - 1].startDate), parseDate(sortedPeriods[i].startDate));
        if (cycleLen > 15 && cycleLen < 50) cycleLengths.push(cycleLen);
      }
      if (sortedPeriods[i].endDate) {
        const periodLen = daysBetween(parseDate(sortedPeriods[i].startDate), parseDate(sortedPeriods[i].endDate!)) + 1;
        if (periodLen > 0 && periodLen < 15) periodLengths.push(periodLen);
      }
    }

    const avgCycle = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : (profile?.cycleLength || 28);
    const avgPeriod = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : (profile?.periodLength || 5);

    return {
      avgCycle,
      avgPeriod,
      totalCycles: sortedPeriods.length,
      cycleLengths,
      periodLengths,
    };
  }, [periods, profile]);

  // ============ Render Helpers ============
  const cycleInfo = getCycleInfo();
  const phaseData = PHASE_INFO[cycleInfo.phase] || PHASE_INFO.follicular;
  const allSymptoms = [...DEFAULT_SYMPTOMS, ...customSymptoms];
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth() + 1;

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-[#0f1419] text-[#f0ece4] flex flex-col overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full opacity-30 blur-[80px]"
          style={{
            width: 300, height: 300,
            background: `linear-gradient(135deg, ${phaseData.color}40, transparent)`,
            top: -80, right: -80,
            animation: 'blob-float 20s ease-in-out infinite',
            transition: 'background 1s ease',
          }} />
        <div className="absolute rounded-full opacity-25 blur-[60px]"
          style={{
            width: 250, height: 250,
            background: 'linear-gradient(135deg, #81b29a, transparent)',
            bottom: 200, left: -80,
            animation: 'blob-float 20s ease-in-out infinite',
            animationDelay: '-7s',
          }} />
        <div className="absolute rounded-full opacity-20 blur-[50px]"
          style={{
            width: 180, height: 180,
            background: 'linear-gradient(135deg, #d4a574, transparent)',
            bottom: -40, right: -40,
            animation: 'blob-float 20s ease-in-out infinite',
            animationDelay: '-14s',
          }} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden safe-top" style={{ paddingBottom: 90 }}>
        <AnimatePresence mode="wait">
          {/* ============ HOME TAB ============ */}
          {activeTab === 'home' && (
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
                    style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                          <stop offset="0%" stopColor={phaseData.color} />
                          <stop offset="50%" stopColor="#d4a574" />
                          <stop offset="100%" stopColor="#81b29a" />
                        </linearGradient>
                      </defs>
                      {/* Track */}
                      <circle cx="120" cy="120" r="105" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                      {/* Subtle tick marks */}
                      {[...Array(28)].map((_, i) => {
                        const angle = (i / 28) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 120 + 105 * Math.cos(rad);
                        const y1 = 120 + 105 * Math.sin(rad);
                        const x2 = 120 + 98 * Math.cos(rad);
                        const y2 = 120 + 98 * Math.sin(rad);
                        return (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                        );
                      })}
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
                      <Droplets size={14} style={{ color: '#e07a5f' }} />
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
                        background: '#e07a5f',
                        boxShadow: cycleInfo.phase === 'period' ? '0 0 8px #e07a5f80' : 'none',
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
                    <span style={{ color: cycleInfo.phase === 'period' ? '#e07a5f' : '#6b7280' }}>经期</span>
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
                            {MOOD_EMOJIS[record.mood] || '📝'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{d.getMonth() + 1}月{d.getDate()}日</p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {symptoms.slice(0, 2).map((s: string, i: number) => (
                                <span key={i} className="text-[11px] px-1.5 py-0.5 rounded-md"
                                  style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>
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
            </motion.div>
          )}

          {/* ============ CALENDAR TAB ============ */}
          {activeTab === 'calendar' && (
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
                    {calYear}年{calMonth}月
                  </p>
                  {!isCurrentMonth && (
                    <button className="text-xs px-3 py-1 rounded-full transition-all hover:scale-105"
                      style={{ background: 'rgba(224,122,95,0.15)', color: '#e07a5f' }}
                      onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth() + 1); }}>
                      回到今天
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
                {WEEKDAYS_SHORT.map((d, i) => (
                  <div key={i} className="text-center text-xs py-2 font-medium" style={{ color: i === 0 || i === 6 ? '#e07a5f80' : '#6b7280' }}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-5">
                {generateCalendarDays().map((day, i) => {
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
                <p className="text-sm font-medium mb-4">日历图例</p>
                <div className="space-y-3">
                  {[
                    { color: '#e07a5f', bg: 'rgba(224,122,95,0.25)', border: '2px solid #e07a5f', label: '经期', desc: '点击日期可记录或取消' },
                    { color: '#81b29a', bg: 'transparent', border: '2px dashed #81b29a', label: '预测经期', desc: '根据周期推算的下次日期' },
                    { color: '#d4a574', bg: 'rgba(212,165,116,0.25)', border: '2px solid #d4a574', label: '易孕期', desc: '排卵期前后，受孕几率较高' },
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
                  <p className="text-sm font-medium mb-4">周期历史</p>
                  {[...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5).map(period => {
                    const startD = parseDate(period.startDate);
                    const endD = period.endDate ? parseDate(period.endDate) : null;
                    const len = endD ? daysBetween(startD, endD) + 1 : '进行中';
                    return (
                      <div key={period.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(224,122,95,0.15)' }}>
                          <Droplets size={14} style={{ color: '#e07a5f' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{startD.getMonth() + 1}月{startD.getDate()}日 — {endD ? `${endD.getMonth() + 1}月${endD.getDate()}日` : '进行中'}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a29e' }}>
                          {typeof len === 'number' ? `${len}天` : len}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ============ LOG TAB ============ */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-5 pt-12 pb-6"
            >
              {/* Header */}
              <div className="text-center mb-4">
                <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>健康记录</p>
                <p className="text-sm mt-1" style={{ color: '#a8a29e' }}>{formatDateChinese(today)}</p>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-[14px] p-1 mb-5" style={{ background: '#1a2027' }}>
                <button
                  className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'record' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`}
                  style={logTab === 'record' ? { background: '#232b35' } : {}}
                  onClick={() => setLogTab('record')}>
                  记录
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'history' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`}
                  style={logTab === 'history' ? { background: '#232b35' } : {}}
                  onClick={() => setLogTab('history')}>
                  历史记录
                </button>
              </div>

              {logTab === 'record' ? (
                <>
                  {/* Flow Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets size={14} style={{ color: '#e07a5f' }} />
                      <p className="text-sm font-medium">流量</p>
                    </div>
                    <div className="flex gap-3 justify-between">
                      {[1, 2, 3, 4].map(level => (
                        <button
                          key={level}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all flex-1"
                          style={{
                            background: currentFlow === level ? 'rgba(224,122,95,0.15)' : '#1a2027',
                            border: currentFlow === level ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)',
                          }}
                          onClick={() => setCurrentFlow(level)}>
                          <div className="rounded-full transition-all"
                            style={{
                              width: 14 + level * 4,
                              height: 14 + level * 4,
                              background: currentFlow === level ? '#e07a5f' : '#4b5563',
                              boxShadow: currentFlow === level ? '0 0 12px #e07a5f60' : 'none',
                            }} />
                          <span className="text-xs" style={{ color: currentFlow === level ? '#e07a5f' : '#a8a29e' }}>
                            {FLOW_LABELS[level]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={14} style={{ color: '#d4a574' }} />
                      <p className="text-sm font-medium">症状</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allSymptoms.map(symptom => (
                        <button
                          key={symptom}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                          style={{
                            background: selectedSymptoms.includes(symptom) ? 'rgba(224,122,95,0.15)' : '#1a2027',
                            border: selectedSymptoms.includes(symptom) ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)',
                            color: selectedSymptoms.includes(symptom) ? '#e07a5f' : '#f0ece4',
                          }}
                          onClick={() => {
                            setSelectedSymptoms(prev =>
                              prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
                            );
                          }}>
                          {symptom}
                        </button>
                      ))}
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                        style={{ background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.1)', color: '#6b7280' }}
                        onClick={() => setSymptomSheetOpen(true)}>
                        <Plus size={14} />
                        自定义
                      </button>
                    </div>
                  </div>

                  {/* Mood Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={14} style={{ color: '#81b29a' }} />
                      <p className="text-sm font-medium">情绪</p>
                    </div>
                    <div className="flex justify-between gap-1.5">
                      {[1, 2, 3, 4, 5].map(mood => (
                        <button
                          key={mood}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all flex-1"
                          style={{
                            background: currentMood === mood ? 'rgba(224,122,95,0.15)' : 'transparent',
                            border: currentMood === mood ? '1px solid rgba(224,122,95,0.2)' : '1px solid transparent',
                          }}
                          onClick={() => setCurrentMood(mood)}>
                          <span className="text-xl">{MOOD_EMOJIS[mood]}</span>
                          <span className="text-[11px]" style={{ color: currentMood === mood ? '#e07a5f' : '#6b7280' }}>
                            {MOOD_LABELS[mood]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={14} style={{ color: '#a8a29e' }} />
                      <p className="text-sm font-medium">备注</p>
                    </div>
                    <textarea
                      className="w-full rounded-xl p-3 text-sm outline-none transition-all"
                      style={{
                        background: '#1a2027',
                        border: '1.5px solid rgba(255,255,255,0.06)',
                        color: '#f0ece4',
                        resize: 'none',
                      }}
                      rows={3}
                      placeholder="记录更多细节..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                    />
                  </div>

                  {/* Save Button */}
                  <motion.button
                    className="w-full py-4 rounded-2xl font-medium text-lg"
                    style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={saveRecord}
                  >
                    保存记录
                  </motion.button>
                </>
              ) : (
                /* History Section */
                <div className="space-y-3">
                  {records.length === 0 ? (
                    <div className="text-center py-12" style={{ color: '#6b7280' }}>
                      <FileText size={40} className="mx-auto mb-3 opacity-30" />
                      <p>暂无记录</p>
                      <p className="text-xs mt-1">点击「记录」开始记录吧</p>
                    </div>
                  ) : (
                    records.map(record => {
                      const d = parseDate(record.date);
                      const symptoms = JSON.parse(record.symptoms || '[]');
                      const todayStr = formatDateStr(new Date());
                      const isToday = record.date === todayStr;
                      return (
                        <motion.div
                          key={record.id}
                          className="rounded-2xl p-4"
                          style={{
                            background: isToday ? 'rgba(224,122,95,0.08)' : '#232b35',
                            border: isToday ? '1px solid rgba(224,122,95,0.2)' : '1px solid rgba(255,255,255,0.06)',
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{d.getMonth() + 1}月{d.getDate()}日</span>
                              {isToday && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(224,122,95,0.2)', color: '#e07a5f' }}>
                                  今天
                                </span>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: '#6b7280' }}>
                              {MOOD_EMOJIS[record.mood]} {MOOD_LABELS[record.mood]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs" style={{ color: '#6b7280' }}>流量:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map(l => (
                                <div key={l} className="w-2 rounded-full" style={{
                                  height: 6 + l * 2,
                                  background: l <= record.flow ? '#e07a5f' : 'rgba(255,255,255,0.06)',
                                }} />
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: '#e07a5f' }}>{FLOW_LABELS[record.flow]}</span>
                          </div>
                          {symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              {symptoms.map((s: string, i: number) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                                  style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {record.note && (
                            <p className="text-xs mt-2" style={{ color: '#a8a29e' }}>{record.note}</p>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ============ PROFILE TAB ============ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-5 pt-12 pb-6"
            >
              {/* User Info */}
              <StaggerIn delay={0.05}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #e07a5f, #81b29a)' }}>
                    <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>
                      {profile?.name?.charAt(0) || 'L'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{profile?.name || 'Luna'}</p>
                    <p className="text-sm" style={{ color: '#a8a29e' }}>已记录 {records.length} 天 · {cycleStats.totalCycles} 个周期</p>
                  </div>
                </div>
              </StaggerIn>

              {/* Health Profile */}
              <StaggerIn delay={0.1}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-4">健康档案</p>
                  <div className="space-y-4">
                    {[
                      { label: '平均周期', value: `${cycleStats.avgCycle} 天`, icon: <TrendingUp size={16} style={{ color: '#81b29a' }} /> },
                      { label: '平均经期', value: `${cycleStats.avgPeriod} 天`, icon: <Droplets size={16} style={{ color: '#e07a5f' }} /> },
                      { label: '上次经期', value: periods.length > 0 ? formatShortDate([...periods].sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate) : '暂无记录', icon: <Calendar size={16} style={{ color: '#d4a574' }} /> },
                      { label: '周期规律', value: '规律', icon: <Check size={16} style={{ color: '#81b29a' }} /> },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-sm" style={{ color: '#a8a29e' }}>{item.label}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </StaggerIn>

              {/* Notification Settings */}
              <StaggerIn delay={0.15}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">提醒设置</p>
                  {[
                    { key: 'period_reminder', icon: Bell, label: '经期提醒', desc: '经期开始前1天提醒' },
                    { key: 'record_reminder', icon: Clock, label: '记录提醒', desc: '每日21:00 提醒记录' },
                    { key: 'ovulation_reminder', icon: Crosshair, label: '排卵期提醒', desc: '易孕期开始时提醒' },
                  ].map(item => {
                    const setting = settings.find(s => s.key === item.key);
                    const isActive = setting?.value === 'true';
                    return (
                      <div key={item.key} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                        onClick={() => toggleSetting(item.key, setting?.value || 'false')}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                          <item.icon size={20} style={{ color: '#a8a29e' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-medium">{item.label}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                        </div>
                        <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300"
                          style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                          <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300"
                            style={{ background: '#f0ece4', left: isActive ? '23px' : '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </StaggerIn>

              {/* Privacy & Security */}
              <StaggerIn delay={0.2}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">隐私与安全</p>
                  {[
                    { icon: Shield, label: '应用锁', desc: 'Face ID / 指纹解锁', toggle: true, toggleKey: 'app_lock' },
                    { icon: Eye, label: '隐私模式', desc: '伪装成计算器图标', arrow: true },
                    { icon: Lock, label: '数据加密', desc: '端到端加密存储', arrow: true },
                  ].map((item, i) => {
                    const setting = item.toggleKey ? settings.find(s => s.key === item.toggleKey) : null;
                    const isActive = setting?.value === 'true';
                    return (
                      <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                        onClick={() => {
                          if (item.toggleKey) toggleSetting(item.toggleKey, setting?.value || 'false');
                          else toast({ description: `${item.label}功能开发中` });
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                          <item.icon size={20} style={{ color: '#a8a29e' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-medium">{item.label}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                        </div>
                        {item.toggle ? (
                          <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300"
                            style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                            <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300"
                              style={{ background: '#f0ece4', left: isActive ? '23px' : '3px' }} />
                          </div>
                        ) : (
                          <ChevronRight size={20} style={{ color: '#6b7280' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </StaggerIn>

              {/* Appearance */}
              <StaggerIn delay={0.25}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">外观主题</p>
                  {[
                    { icon: Moon, label: '深色模式', desc: '保护眼睛，节省电量', toggle: true, toggleKey: 'dark_mode' },
                    { icon: Sun, label: '主题颜色', desc: '自定义界面配色', arrow: true },
                  ].map((item, i) => {
                    const setting = item.toggleKey ? settings.find(s => s.key === item.toggleKey) : null;
                    const isActive = setting?.value === 'true';
                    return (
                      <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                        onClick={() => {
                          if (item.toggleKey) toggleSetting(item.toggleKey, setting?.value || 'false');
                          else toast({ description: '主题设置功能开发中' });
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                          <item.icon size={20} style={{ color: '#a8a29e' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-medium">{item.label}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                        </div>
                        {item.toggle ? (
                          <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300"
                            style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                            <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300"
                              style={{ background: '#f0ece4', left: isActive ? '23px' : '3px' }} />
                          </div>
                        ) : (
                          <ChevronRight size={20} style={{ color: '#6b7280' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </StaggerIn>

              {/* Data Management */}
              <StaggerIn delay={0.3}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">数据管理</p>
                  {[
                    { icon: Download, label: '导出数据', desc: '导出为 PDF / CSV' },
                    { icon: Cloud, label: '云同步', desc: '连接云端备份' },
                    { icon: RotateCcw, label: '恢复数据', desc: '从备份恢复' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                      onClick={() => toast({ description: `${item.label}功能开发中` })}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                        <item.icon size={20} style={{ color: '#a8a29e' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-medium">{item.label}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                      </div>
                      <ChevronRight size={20} style={{ color: '#6b7280' }} />
                    </div>
                  ))}
                </div>
              </StaggerIn>

              {/* Other */}
              <StaggerIn delay={0.35}>
                <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">其他</p>
                  {[
                    { icon: Globe, label: '语言', desc: '简体中文' },
                    { icon: Info, label: '关于我们', desc: '版本 1.0.0' },
                    { icon: MessageSquare, label: '意见反馈', desc: '帮助我们改进' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                      onClick={() => toast({ description: `${item.label}功能开发中` })}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                        <item.icon size={20} style={{ color: '#a8a29e' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-medium">{item.label}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                      </div>
                      <ChevronRight size={20} style={{ color: '#6b7280' }} />
                    </div>
                  ))}
                </div>
              </StaggerIn>

              {/* Security Note */}
              <div className="mt-4 text-center mb-4">
                <p className="text-xs" style={{ color: '#6b7280' }}>您的数据采用端到端加密存储</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>仅存储于您的设备与加密云端</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============ Bottom Navigation ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{ background: 'linear-gradient(to top, #0f1419 80%, transparent)' }}>
        <div className="flex justify-around items-center pb-5 pt-2">
          {[
            { page: 'home' as TabPage, icon: Home, label: '首页' },
            { page: 'calendar' as TabPage, icon: Calendar, label: '日历' },
          ].map(item => (
            <button
              key={item.page}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all"
              style={{ background: activeTab === item.page ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              onClick={() => setActiveTab(item.page)}
            >
              <item.icon size={22} style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          ))}

          {/* FAB Button */}
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center -mt-5"
            style={{
              background: 'linear-gradient(135deg, #e07a5f, #d4a574)',
              boxShadow: '0 8px 24px rgba(224,122,95,0.35)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              const todayStr = formatDateStr(new Date());
              setActionSheet({ open: true, dateStr: todayStr, day: new Date().getDate() });
            }}
          >
            <Plus size={26} style={{ color: '#0f1419', strokeWidth: 2.5 }} />
          </motion.button>

          {[
            { page: 'log' as TabPage, icon: FileText, label: '记录' },
            { page: 'profile' as TabPage, icon: User, label: '我的' },
          ].map(item => (
            <button
              key={item.page}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all"
              style={{ background: activeTab === item.page ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              onClick={() => setActiveTab(item.page)}
            >
              <item.icon size={22} style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ============ Action Sheet ============ */}
      <AnimatePresence>
        {actionSheet.open && (
          <motion.div
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
              style={{ background: '#1a2027', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />
              <div className="text-center mb-4">
                <span className="text-base font-medium">
                  {calMonth}月{actionSheet.day}日
                </span>
              </div>
              <div className="space-y-2">
                {(() => {
                  const active = hasActivePeriod();
                  const periodInfo = getPeriodInfo(actionSheet.dateStr);

                  if (active) {
                    if (actionSheet.dateStr === active.startDate) {
                      return (
                        <>
                          <ActionOption variant="sage" icon={<ArrowRight size={22} />} title="经期走了" desc="标记经期在这一天结束" onClick={() => endPeriod(actionSheet.dateStr)} />
                          <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                        </>
                      );
                    } else if (actionSheet.dateStr < active.startDate) {
                      return (
                        <>
                          <ActionOption variant="primary" icon={<ChevronLeft size={22} />} title="修改开始日期" desc="将经期开始提前至此日" onClick={() => updateStart(actionSheet.dateStr)} />
                          <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                        </>
                      );
                    } else {
                      return (
                        <>
                          <ActionOption variant="sage" icon={<ArrowRight size={22} />} title="经期走了" desc="标记经期在这一天结束" onClick={() => endPeriod(actionSheet.dateStr)} />
                          <ActionOption variant="danger" icon={<X size={22} />} title="取消本次记录" desc="删除当前进行中的经期" onClick={cancelActivePeriod} />
                        </>
                      );
                    }
                  } else if (periodInfo.isPeriod) {
                    return (
                      <>
                        <ActionOption variant="primary" icon={<Plus size={22} />} title="延长经期" desc="将经期结束日期延后一天" onClick={() => extendPeriod(actionSheet.dateStr)} />
                        <ActionOption variant="danger" icon={<X size={22} />} title="取消经期记录" desc="删除这一天的经期标记"
                          onClick={async () => {
                            const period = periods.find(p => {
                              if (!p.endDate) return actionSheet.dateStr === p.startDate;
                              return actionSheet.dateStr >= p.startDate && actionSheet.dateStr <= p.endDate;
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
                      <ActionOption variant="primary" icon={<Plus size={22} />} title="经期来了" desc="标记这一天为经期开始" onClick={() => startPeriod(actionSheet.dateStr)} />
                    );
                  }
                })()}
              </div>
              <div className="text-center py-4 mt-2 cursor-pointer transition-colors"
                style={{ color: '#6b7280' }}
                onClick={() => setActionSheet({ open: false, dateStr: '', day: 0 })}>
                取消
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Add Symptom Sheet ============ */}
      <AnimatePresence>
        {symptomSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setSymptomSheetOpen(false); setNewSymptom(''); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
              style={{ background: '#1a2027' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />
              <div className="text-center mb-4"><span className="font-medium">添加自定义症状</span></div>
              <div className="mb-4">
                <input type="text"
                  className="w-full rounded-xl p-3 text-sm outline-none transition-all"
                  style={{ background: '#232b35', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }}
                  placeholder="输入症状名称..."
                  value={newSymptom}
                  onChange={e => setNewSymptom(e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSymptom.trim()) {
                      setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                      setNewSymptom('');
                      setSymptomSheetOpen(false);
                      toast({ description: '已添加自定义症状' });
                    }
                  }} />
              </div>
              <motion.button
                className="w-full py-4 rounded-2xl font-medium text-lg"
                style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (newSymptom.trim()) {
                    setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                    setNewSymptom('');
                    setSymptomSheetOpen(false);
                    toast({ description: '已添加自定义症状 ✨' });
                  } else {
                    toast({ description: '请输入症状名称' });
                  }
                }}>
                添加
              </motion.button>
              <div className="text-center py-4 cursor-pointer transition-colors"
                style={{ color: '#6b7280' }}
                onClick={() => { setSymptomSheetOpen(false); setNewSymptom(''); }}>
                取消
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Loading Overlay ============ */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: '#0f1419' }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #e07a5f, #81b29a)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>L</span>
              </motion.div>
              <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>Luna</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>经期追踪</p>
              <motion.div
                className="w-16 h-1 rounded-full mx-auto mt-4"
                style={{ background: 'linear-gradient(90deg, #e07a5f, #81b29a)' }}
                animate={{ scaleX: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

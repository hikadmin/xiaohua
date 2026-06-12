'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, FileText, User, Plus, Bell, ChevronLeft, ChevronRight,
  Droplets, Moon, Sun, Shield, Lock, Eye, Database, Cloud, RotateCcw,
  Download, Globe, Info, MessageSquare, X, Check, ArrowRight
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

const PHASE_INFO: Record<string, { name: string; desc: string; tip: string; color: string }> = {
  period: { name: '经期', desc: '休养期', tip: '注意保暖休息，避免剧烈运动', color: '#e07a5f' },
  follicular: { name: '卵泡期', desc: '能量回升期', tip: '雌激素水平上升，适合进行高强度运动和创造性工作', color: '#81b29a' },
  ovulation: { name: '排卵期', desc: '高峰期', tip: '精力充沛，社交能力和创造力最佳', color: '#d4a574' },
  luteal: { name: '黄体期', desc: '平缓期', tip: '注意情绪波动，适合轻度运动和放松', color: '#f2cc8f' },
};

// ============ Utility Functions ============
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateChinese(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS_FULL[date.getDay()]}`;
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

// ============ Main Component ============
export default function LunaApp() {
  const [activeTab, setActiveTab] = useState<TabPage>('home');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

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
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['痛经', '疲劳']);
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

    // Find the most recent period
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];

    if (!lastPeriod) {
      return {
        phase: 'follicular',
        phaseDay: 1,
        daysUntilNext: cycleLength,
        cycleLength,
        periodLength,
        nextPeriodDate: null,
      };
    }

    const lastStart = parseDate(lastPeriod.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceStart = daysBetween(lastStart, today);

    if (daysSinceStart < 0) {
      return {
        phase: 'follicular',
        phaseDay: 1,
        daysUntilNext: cycleLength,
        cycleLength,
        periodLength,
        nextPeriodDate: null,
      };
    }

    const dayInCycle = (daysSinceStart % cycleLength) + 1;
    const nextPeriodDate = addDays(lastStart, cycleLength);
    const daysUntilNext = daysBetween(today, nextPeriodDate);

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
      phase,
      phaseDay: dayInCycle,
      daysUntilNext: Math.max(0, daysUntilNext),
      cycleLength,
      periodLength,
      nextPeriodDate,
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
    toast({ description: '已记录经期开始' });
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
    toast({ description: '经期已结束，记录完成' });
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
    toast({ description: '记录已保存' });
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

    // Empty cells for days before the first
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        day: 0,
        dateStr: '',
        isToday: false,
        isOtherMonth: true,
        periodInfo: { isPeriod: false, isStart: false, isEnd: false, isActive: false },
        isPredicted: false,
        isFertile: false,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const periodInfo = getPeriodInfo(dateStr);
      const isPredicted = predictedDays.includes(dateStr) && !periodInfo.isPeriod;
      const isFertile = fertileDays.includes(dateStr) && !periodInfo.isPeriod;

      days.push({ day, dateStr, isToday, isOtherMonth: false, periodInfo, isPredicted, isFertile });
    }

    return days;
  }

  // ============ Render Helpers ============
  const cycleInfo = getCycleInfo();
  const phaseData = PHASE_INFO[cycleInfo.phase] || PHASE_INFO.follicular;
  const today = new Date();
  const allSymptoms = [...DEFAULT_SYMPTOMS, ...customSymptoms];

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-[#0f1419] text-[#f0ece4] flex flex-col overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute rounded-full opacity-40 blur-[60px]"
          style={{
            width: 300, height: 300,
            background: 'linear-gradient(135deg, #e07a5f, transparent)',
            top: -100, right: -100,
            animation: 'blob-float 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full opacity-40 blur-[60px]"
          style={{
            width: 250, height: 250,
            background: 'linear-gradient(135deg, #81b29a, transparent)',
            bottom: 200, left: -100,
            animation: 'blob-float 20s ease-in-out infinite',
            animationDelay: '-7s',
          }}
        />
        <div
          className="absolute rounded-full opacity-40 blur-[60px]"
          style={{
            width: 200, height: 200,
            background: 'linear-gradient(135deg, #d4a574, transparent)',
            bottom: -50, right: -50,
            animation: 'blob-float 20s ease-in-out infinite',
            animationDelay: '-14s',
          }}
        />
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
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-sm" style={{ color: '#a8a29e' }}>今天</p>
                  <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                    {formatDateChinese(today)}
                  </p>
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Bell size={18} style={{ color: '#a8a29e' }} />
                </button>
              </div>

              {/* Phase Card */}
              <div className="rounded-[20px] p-5 mb-4"
                style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full"
                    style={{ background: phaseData.color, boxShadow: `0 0 12px ${phaseData.color}` }} />
                  <span className="text-sm font-medium" style={{ color: phaseData.color }}>
                    {phaseData.name} 第{cycleInfo.phaseDay}天
                  </span>
                </div>
                <p className="text-lg font-light mb-2">{phaseData.desc}</p>
                <p className="text-sm" style={{ color: '#a8a29e' }}>{phaseData.tip}</p>
              </div>

              {/* Cycle Ring */}
              <div className="flex flex-col items-center my-6">
                <div className="relative" style={{ width: 260, height: 260 }}>
                  <svg width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e07a5f" />
                        <stop offset="50%" stopColor="#d4a574" />
                        <stop offset="100%" stopColor="#81b29a" />
                      </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    {/* Progress */}
                    <circle
                      cx="130" cy="130" r="120" fill="none"
                      stroke="url(#ringGradient)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={754}
                      strokeDashoffset={754 * (1 - (cycleInfo.phaseDay / cycleInfo.cycleLength))}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                    {/* Glow */}
                    <circle
                      cx="130" cy="130" r="120" fill="none"
                      stroke="url(#ringGradient)" strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={754}
                      strokeDashoffset={754 * (1 - (cycleInfo.phaseDay / cycleInfo.cycleLength))}
                      filter="blur(8px)" opacity={0.5}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                  </svg>
                  {/* Center Content */}
                  <div className="absolute inset-[30px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95">
                    <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(circle, rgba(224,122,95,0.1) 0%, transparent 70%)' }} />
                    <p className="text-sm mb-1" style={{ color: '#6b7280' }}>下次经期预计</p>
                    <p className="text-4xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                      {cycleInfo.daysUntilNext}
                    </p>
                    <p className="text-sm" style={{ color: '#a8a29e' }}>天后</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] p-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7280' }}>周期长度</p>
                  <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                    {cycleInfo.cycleLength}
                    <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
                  </p>
                </div>
                <div className="rounded-[20px] p-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7280' }}>经期长度</p>
                  <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                    {cycleInfo.periodLength}
                    <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
                  </p>
                </div>
              </div>

              {/* Recent Records Preview */}
              {records.length > 0 && (
                <div className="mt-4 rounded-[20px] p-5" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium mb-3">最近记录</p>
                  {records.slice(0, 2).map(record => {
                    const d = parseDate(record.date);
                    const symptoms = JSON.parse(record.symptoms || '[]');
                    return (
                      <div key={record.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{d.getMonth() + 1}月{d.getDate()}日</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {symptoms.slice(0, 3).map((s: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: '#6b7280' }}>
                          {FLOW_LABELS[record.flow]} · {MOOD_EMOJIS[record.mood]}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                <button className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#232b35' }}
                  onClick={() => {
                    let m = calMonth - 1;
                    let y = calYear;
                    if (m < 1) { m = 12; y--; }
                    setCalMonth(m);
                    setCalYear(y);
                  }}>
                  <ChevronLeft size={20} style={{ color: '#a8a29e' }} />
                </button>
                <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>
                  {calYear}年{calMonth}月
                </p>
                <button className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#232b35' }}
                  onClick={() => {
                    let m = calMonth + 1;
                    let y = calYear;
                    if (m > 12) { m = 1; y++; }
                    setCalMonth(m);
                    setCalYear(y);
                  }}>
                  <ChevronRight size={20} style={{ color: '#a8a29e' }} />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <div key={i} className="text-center text-xs py-2" style={{ color: '#6b7280' }}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {generateCalendarDays().map((day, i) => {
                  if (day.isOtherMonth) {
                    return <div key={`empty-${i}`} className="w-10 h-10" />;
                  }

                  let bgClass = '';
                  let textColor = '#f0ece4';
                  let borderRadius = '12px';
                  let extraStyle: React.CSSProperties = {};

                  if (day.periodInfo.isPeriod) {
                    bgClass = 'bg-[#e07a5f]';
                    textColor = '#0f1419';
                    if (day.periodInfo.isStart && day.periodInfo.isEnd) borderRadius = '20px';
                    else if (day.periodInfo.isStart) borderRadius = '20px 4px 4px 20px';
                    else if (day.periodInfo.isEnd) borderRadius = '4px 20px 20px 4px';
                    else borderRadius = '4px';
                    if (day.periodInfo.isActive) {
                      extraStyle = { animation: 'period-pulse 2s ease-in-out infinite' };
                    }
                  } else if (day.isPredicted) {
                    bgClass = '';
                    extraStyle = { background: 'rgba(129,178,154,0.2)' };
                    textColor = '#81b29a';
                  } else if (day.isFertile) {
                    bgClass = '';
                    extraStyle = { background: 'rgba(212,165,116,0.2)' };
                    textColor = '#d4a574';
                  }

                  if (day.isToday && !day.periodInfo.isPeriod) {
                    extraStyle = {
                      ...extraStyle,
                      background: 'linear-gradient(135deg, #d4a574, #f2cc8f)',
                      color: '#0f1419',
                      fontWeight: 700,
                      transform: 'scale(1.08)',
                      zIndex: 10,
                    };
                    textColor = '#0f1419';
                  }

                  if (day.isToday && day.periodInfo.isPeriod) {
                    extraStyle = {
                      ...extraStyle,
                      background: '#e07a5f',
                      color: '#0f1419',
                      boxShadow: '0 0 0 3px #d4a574',
                      transform: 'scale(1.08)',
                      zIndex: 10,
                    };
                    textColor = '#0f1419';
                  }

                  return (
                    <div
                      key={day.dateStr}
                      className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all active:scale-92 ${bgClass}`}
                      style={{
                        borderRadius,
                        color: textColor,
                        fontSize: 14,
                        fontWeight: day.periodInfo.isPeriod ? 500 : 400,
                        ...extraStyle,
                      }}
                      onClick={() => setActionSheet({ open: true, dateStr: day.dateStr, day: day.day })}
                    >
                      {day.day}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="rounded-[20px] p-5" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-medium mb-4">日历图例</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a2027' }}>
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                      style={{ background: 'rgba(224,122,95,0.25)', border: '2px solid #e07a5f' }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: '#e07a5f' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">经期</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>点击日期可记录或取消</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a2027' }}>
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                      style={{ border: '2px dashed #81b29a' }}>
                      <div className="w-3 h-3 rounded-full" style={{ border: '2px dashed #81b29a' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">预测经期</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>根据周期推算的下次日期</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a2027' }}>
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                      style={{ background: 'rgba(212,165,116,0.25)', border: '2px solid #d4a574' }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: '#d4a574' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">易孕期</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>排卵期前后，受孕几率较高</p>
                    </div>
                  </div>
                </div>
              </div>
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
                  onClick={() => setLogTab('record')}
                >
                  记录
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'history' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`}
                  style={logTab === 'history' ? { background: '#232b35' } : {}}
                  onClick={() => setLogTab('history')}
                >
                  历史记录
                </button>
              </div>

              {logTab === 'record' ? (
                <>
                  {/* Flow Section */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">流量</p>
                    <div className="flex gap-3 justify-between">
                      {[1, 2, 3, 4].map(level => (
                        <button
                          key={level}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all flex-1 ${currentFlow === level ? 'border-[#e07a5f]' : ''}`}
                          style={{
                            background: currentFlow === level ? 'rgba(224,122,95,0.15)' : '#1a2027',
                            border: currentFlow === level ? '1px solid #e07a5f' : '1px solid rgba(255,255,255,0.08)',
                          }}
                          onClick={() => setCurrentFlow(level)}
                        >
                          <div
                            className="rounded-full transition-all"
                            style={{
                              width: 16 + level * 4,
                              height: 16 + level * 4,
                              background: currentFlow === level ? '#e07a5f' : '#6b7280',
                              boxShadow: currentFlow === level ? '0 0 12px #e07a5f' : 'none',
                            }}
                          />
                          <span className="text-xs" style={{ color: currentFlow === level ? '#e07a5f' : '#a8a29e' }}>
                            {FLOW_LABELS[level]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms Section */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">症状</p>
                    <div className="flex flex-wrap gap-2">
                      {allSymptoms.map(symptom => (
                        <button
                          key={symptom}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all ${selectedSymptoms.includes(symptom) ? 'border-[#e07a5f]' : ''}`}
                          style={{
                            background: selectedSymptoms.includes(symptom) ? 'rgba(224,122,95,0.15)' : '#1a2027',
                            border: selectedSymptoms.includes(symptom) ? '1px solid #e07a5f' : '1px solid rgba(255,255,255,0.08)',
                            color: selectedSymptoms.includes(symptom) ? '#e07a5f' : '#f0ece4',
                          }}
                          onClick={() => {
                            setSelectedSymptoms(prev =>
                              prev.includes(symptom)
                                ? prev.filter(s => s !== symptom)
                                : [...prev, symptom]
                            );
                          }}
                        >
                          {symptom}
                        </button>
                      ))}
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: 'transparent',
                          border: '1px dashed rgba(255,255,255,0.08)',
                          color: '#6b7280',
                        }}
                        onClick={() => setSymptomSheetOpen(true)}
                      >
                        <Plus size={14} />
                        自定义
                      </button>
                    </div>
                  </div>

                  {/* Mood Section */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">情绪</p>
                    <div className="flex justify-between gap-2">
                      {[1, 2, 3, 4, 5].map(mood => (
                        <button
                          key={mood}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all flex-1"
                          style={{
                            background: currentMood === mood ? 'rgba(224,122,95,0.15)' : 'transparent',
                          }}
                          onClick={() => setCurrentMood(mood)}
                        >
                          <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
                          <span className="text-xs" style={{ color: currentMood === mood ? '#e07a5f' : '#a8a29e' }}>
                            {MOOD_LABELS[mood]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note Section */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">备注</p>
                    <textarea
                      className="w-full rounded-xl p-3 text-sm outline-none transition-all"
                      style={{
                        background: '#1a2027',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#f0ece4',
                        resize: 'none',
                      }}
                      rows={3}
                      placeholder="记录更多细节..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onFocus={e => e.currentTarget.style.borderColor = '#d4a574'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    className="w-full py-4 rounded-2xl font-medium text-lg transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
                    onClick={saveRecord}
                  >
                    保存记录
                  </button>
                </>
              ) : (
                /* History Section */
                <div className="space-y-3">
                  {records.length === 0 ? (
                    <div className="text-center py-12" style={{ color: '#6b7280' }}>
                      <p>暂无记录</p>
                    </div>
                  ) : (
                    records.map(record => {
                      const d = parseDate(record.date);
                      const symptoms = JSON.parse(record.symptoms || '[]');
                      return (
                        <div key={record.id} className="rounded-2xl p-4"
                          style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{d.getMonth() + 1}月{d.getDate()}日</span>
                            <span className="text-xs" style={{ color: '#6b7280' }}>{MOOD_LABELS[record.mood]}</span>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs" style={{ color: '#6b7280' }}>流量:</span>
                            <span className="text-xs" style={{ color: '#e07a5f' }}>{FLOW_LABELS[record.flow]}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {symptoms.map((s: string, i: number) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                          {record.note && (
                            <p className="text-xs mt-2" style={{ color: '#a8a29e' }}>{record.note}</p>
                          )}
                        </div>
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e07a5f, #81b29a)' }}>
                  <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>
                    {profile?.name?.charAt(0) || 'L'}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{profile?.name || 'Luna'}</p>
                  <p className="text-sm" style={{ color: '#a8a29e' }}>已记录 {records.length} 天</p>
                </div>
              </div>

              {/* Health Profile */}
              <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-medium mb-4">健康档案</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#a8a29e' }}>平均周期</span>
                    <span className="text-sm font-medium">{profile?.cycleLength || 28} 天</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#a8a29e' }}>平均经期</span>
                    <span className="text-sm font-medium">{profile?.periodLength || 5} 天</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#a8a29e' }}>上次经期</span>
                    <span className="text-sm font-medium">
                      {periods.length > 0 ? (() => {
                        const d = parseDate(periods.sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate);
                        return `${d.getMonth() + 1}月${d.getDate()}日`;
                      })() : '暂无记录'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#a8a29e' }}>周期规律</span>
                    <span className="text-sm font-medium" style={{ color: '#81b29a' }}>规律</span>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-medium mb-3">提醒设置</p>
                {[
                  { key: 'period_reminder', icon: Bell, label: '经期提醒', desc: '经期开始前1天提醒' },
                  { key: 'record_reminder', icon: Calendar, label: '记录提醒', desc: '每日21:00 提醒记录' },
                  { key: 'ovulation_reminder', icon: Droplets, label: '排卵期提醒', desc: '易孕期开始时提醒' },
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
                      <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all"
                        style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                        <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all"
                          style={{
                            background: '#f0ece4',
                            left: isActive ? '23px' : '3px',
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Privacy & Security */}
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
                        <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all"
                          style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                          <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all"
                            style={{ background: '#f0ece4', left: isActive ? '23px' : '3px' }} />
                        </div>
                      ) : (
                        <ChevronRight size={20} style={{ color: '#6b7280' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Appearance */}
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
                        <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all"
                          style={{ background: isActive ? '#e07a5f' : '#1a2027' }}>
                          <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all"
                            style={{ background: '#f0ece4', left: isActive ? '23px' : '3px' }} />
                        </div>
                      ) : (
                        <ChevronRight size={20} style={{ color: '#6b7280' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Data Management */}
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

              {/* Other */}
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
        style={{ background: 'linear-gradient(to top, #0f1419 70%, transparent)' }}>
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
              <item.icon size={24} style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }} />
              <span className="text-[11px]" style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          ))}

          {/* FAB Button */}
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center -mt-5 transition-all active:scale-95 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #e07a5f, #d4a574)',
              boxShadow: '0 8px 24px rgba(224,122,95,0.4)',
            }}
            onClick={() => {
              const todayStr = formatDateStr(new Date());
              const periodInfo = getPeriodInfo(todayStr);
              setActionSheet({ open: true, dateStr: todayStr, day: new Date().getDate() });
            }}
          >
            <Plus size={28} style={{ color: '#0f1419', strokeWidth: 2.5 }} />
          </button>

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
              <item.icon size={24} style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }} />
              <span className="text-[11px]" style={{ color: activeTab === item.page ? '#e07a5f' : '#6b7280' }}>
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
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-3 pb-8"
              style={{ background: '#1a2027', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />

              {/* Title */}
              <div className="text-center mb-4">
                <span className="text-sm" style={{ color: '#6b7280' }}>
                  {calMonth}月{actionSheet.day}日
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {(() => {
                  const active = hasActivePeriod();
                  const periodInfo = getPeriodInfo(actionSheet.dateStr);

                  if (active) {
                    if (actionSheet.dateStr === active.startDate) {
                      return (
                        <>
                          <ActionOption
                            variant="sage"
                            icon={<ArrowRight size={22} />}
                            title="经期走了"
                            desc="标记经期在这一天结束"
                            onClick={() => endPeriod(actionSheet.dateStr)}
                          />
                          <ActionOption
                            variant="danger"
                            icon={<X size={22} />}
                            title="取消本次记录"
                            desc="删除当前进行中的经期"
                            onClick={cancelActivePeriod}
                          />
                        </>
                      );
                    } else if (actionSheet.dateStr < active.startDate) {
                      return (
                        <>
                          <ActionOption
                            variant="primary"
                            icon={<ChevronLeft size={22} />}
                            title="修改开始日期"
                            desc="将经期开始提前至此日"
                            onClick={() => updateStart(actionSheet.dateStr)}
                          />
                          <ActionOption
                            variant="danger"
                            icon={<X size={22} />}
                            title="取消本次记录"
                            desc="删除当前进行中的经期"
                            onClick={cancelActivePeriod}
                          />
                        </>
                      );
                    } else {
                      return (
                        <>
                          <ActionOption
                            variant="sage"
                            icon={<ArrowRight size={22} />}
                            title="经期走了"
                            desc="标记经期在这一天结束"
                            onClick={() => endPeriod(actionSheet.dateStr)}
                          />
                          <ActionOption
                            variant="danger"
                            icon={<X size={22} />}
                            title="取消本次记录"
                            desc="删除当前进行中的经期"
                            onClick={cancelActivePeriod}
                          />
                        </>
                      );
                    }
                  } else if (periodInfo.isPeriod) {
                    return (
                      <>
                        <ActionOption
                          variant="primary"
                          icon={<Plus size={22} />}
                          title="延长经期"
                          desc="将经期结束日期延后一天"
                          onClick={() => extendPeriod(actionSheet.dateStr)}
                        />
                        <ActionOption
                          variant="danger"
                          icon={<X size={22} />}
                          title="取消经期记录"
                          desc="删除这一天的经期标记"
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
                          }}
                        />
                      </>
                    );
                  } else {
                    return (
                      <ActionOption
                        variant="primary"
                        icon={<Plus size={22} />}
                        title="经期来了"
                        desc="标记这一天为经期开始"
                        onClick={() => startPeriod(actionSheet.dateStr)}
                      />
                    );
                  }
                })()}
              </div>

              {/* Cancel */}
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
              {/* Handle */}
              <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />

              {/* Title */}
              <div className="text-center mb-4">
                <span className="font-medium">添加自定义症状</span>
              </div>

              {/* Input */}
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full rounded-xl p-3 text-sm outline-none transition-all"
                  style={{
                    background: '#232b35',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f0ece4',
                  }}
                  placeholder="输入症状名称..."
                  value={newSymptom}
                  onChange={e => setNewSymptom(e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = '#d4a574'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSymptom.trim()) {
                      setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                      setNewSymptom('');
                      setSymptomSheetOpen(false);
                      toast({ description: '已添加自定义症状' });
                    }
                  }}
                />
              </div>

              {/* Add Button */}
              <button
                className="w-full py-4 rounded-2xl font-medium text-lg transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
                onClick={() => {
                  if (newSymptom.trim()) {
                    setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                    setNewSymptom('');
                    setSymptomSheetOpen(false);
                    toast({ description: '已添加自定义症状' });
                  } else {
                    toast({ description: '请输入症状名称' });
                  }
                }}
              >
                添加
              </button>

              {/* Cancel */}
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
      {!isLoaded && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: '#0f1419' }}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e07a5f, #81b29a)' }}>
              <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>L</span>
            </div>
            <p className="text-lg font-light" style={{ fontFamily: 'Georgia, serif' }}>Luna</p>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>经期追踪</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Action Option Component ============
function ActionOption({
  variant,
  icon,
  title,
  desc,
  onClick,
}: {
  variant: 'primary' | 'sage' | 'danger';
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  const colors = {
    primary: { bg: 'rgba(224,122,95,0.15)', border: 'rgba(224,122,95,0.3)', iconBg: 'linear-gradient(135deg, #e07a5f, #d4a574)' },
    sage: { bg: 'rgba(129,178,154,0.15)', border: 'rgba(129,178,154,0.3)', iconBg: 'linear-gradient(135deg, #81b29a, #6b9e85)' },
    danger: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  };

  const c = colors[variant];

  return (
    <button
      className="flex items-center gap-3.5 p-4 rounded-[14px] transition-all active:scale-[0.98] w-full text-left"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
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
    </button>
  );
}

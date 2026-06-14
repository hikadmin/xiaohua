'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, FileText, User, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  type Period, type DailyRecord, type UserProfile, type Setting, type TabPage,
  type CycleInfo, type CycleStats, type CalendarDay, type PeriodInfoResult,
  PHASE_INFO, FLOW_LABELS, MOOD_LABELS, formatDateStr, parseDate, daysBetween, addDays,
} from '@/components/luna/shared';
import HomeTab from '@/components/luna/HomeTab';
import CalendarTab from '@/components/luna/CalendarTab';
import LogTab from '@/components/luna/LogTab';
import ProfileTab from '@/components/luna/ProfileTab';
import ActionSheet from '@/components/luna/ActionSheet';
import SymptomSheet from '@/components/luna/SymptomSheet';
import ProfileEditSheet from '@/components/luna/ProfileEditSheet';
import DeleteConfirmDialog from '@/components/luna/DeleteConfirmDialog';
import FeedbackSheet from '@/components/luna/FeedbackSheet';
import {
  periodsApi, recordsApi, profileApi, settingsApi, feedbackApi, seedApi, exportApi,
  ApiError,
} from '@/services/api';
import { getWallpaper, getThemeColor, subscribeTheme, applyThemeToDOM, THEME_COLORS, setWallpaper as setWallpaperStore, setThemeColor as setThemeColorStore } from '@/lib/theme-store';

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
  const [currentFlow, setCurrentFlow] = useState(0);
  const [currentMood, setCurrentMood] = useState(2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');

  // Profile editing state
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCycleLength, setEditCycleLength] = useState(28);
  const [editPeriodLength, setEditPeriodLength] = useState(5);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; recordId: string; date: string }>({ open: false, recordId: '', date: '' });

  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('功能建议');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Avatar edit state
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Global theme state
  const [wallpaper, setWallpaperState] = useState<string | null>(null);
  const [themeColor, setThemeColorState] = useState('#e07a5f');
  const wallpaperInputRef = React.useRef<HTMLInputElement>(null);

  // Daily tip state
  const [dailyTipIndex, setDailyTipIndex] = useState(() => {
    const t = new Date();
    return (t.getFullYear() * 366 + t.getMonth() * 31 + t.getDate()) % 5;
  });

  const { toast } = useToast();

  // ============ Theme Sync ============
  useEffect(() => {
    // Load initial theme values
    setWallpaperState(getWallpaper());
    setThemeColorState(getThemeColor());
    applyThemeToDOM();

    // Subscribe to theme changes from other components
    const unsub = subscribeTheme(() => {
      setWallpaperState(getWallpaper());
      setThemeColorState(getThemeColor());
      applyThemeToDOM();
    });
    return unsub;
  }, []);

  // ============ Data Fetching (通过 API 服务层) ============
  const fetchPeriods = useCallback(async () => {
    try {
      const data = await periodsApi.getAll();
      setPeriods(data);
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }, [toast]);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await recordsApi.getAll();
      setRecords(data);
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }, [toast]);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileApi.get();
      setProfile(data);
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }, [toast]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }, [toast]);

  const seedData = useCallback(async () => {
    try {
      await seedApi.create();
    } catch {
      // seed 失败静默处理
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedData();
      await Promise.all([fetchPeriods(), fetchRecords(), fetchProfile(), fetchSettings()]);
      setIsLoaded(true);
      setTimeout(() => setRingAnimated(true), 300);
    };
    init();
  }, [seedData, fetchPeriods, fetchRecords, fetchProfile, fetchSettings]);

  // ============ Period Logic (前端仍需用于日历渲染) ============
  function getPeriodInfo(dateStr: string): PeriodInfoResult {
    let isPeriod = false;
    let isStart = false;
    let isEnd = false;
    let isActive = false;

    for (const period of periods) {
      if (period.startDate && !period.endDate) {
        if (dateStr === period.startDate) {
          isPeriod = true; isStart = true; isEnd = true; isActive = true;
          break
        }
        const startD = parseDate(period.startDate);
        const checkD = parseDate(dateStr);
        if (checkD > startD && checkD <= new Date()) {
          isPeriod = true;
          if (dateStr === period.startDate) isStart = true;
          isActive = true;
          break
        }
      } else if (period.startDate && period.endDate) {
        if (dateStr >= period.startDate && dateStr <= period.endDate) {
          isPeriod = true;
          if (dateStr === period.startDate) isStart = true;
          if (dateStr === period.endDate) isEnd = true;
          break
        }
      }
    }
    return { isPeriod, isStart, isEnd, isActive };
  }

  function hasActivePeriod(): Period | null {
    return periods.find(p => p.startDate && !p.endDate) || null;
  }

  function getCycleInfo(): CycleInfo {
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

  // ============ API Actions (通过 API 服务层) ============
  async function startPeriod(dateStr: string) {
    try {
      await periodsApi.create({ startDate: dateStr });
      setActionSheet({ open: false, dateStr: '', day: 0 });
      await fetchPeriods();
      toast({ description: '已记录经期开始 💖' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function endPeriod(dateStr: string) {
    const active = hasActivePeriod();
    if (!active) return;
    if (dateStr < active.startDate) {
      toast({ description: '结束日期不能早于开始日期' });
      return;
    }
    try {
      await periodsApi.update(active.id, { endDate: dateStr });
      setActionSheet({ open: false, dateStr: '', day: 0 });
      await fetchPeriods();
      toast({ description: '经期已结束，记录完成 ✅' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function updateStart(dateStr: string) {
    const active = hasActivePeriod();
    if (!active) return;
    try {
      await periodsApi.update(active.id, { startDate: dateStr });
      setActionSheet({ open: false, dateStr: '', day: 0 });
      await fetchPeriods();
      toast({ description: '开始日期已更新' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function cancelActivePeriod() {
    const active = hasActivePeriod();
    if (!active) return;
    try {
      await periodsApi.delete(active.id);
      setActionSheet({ open: false, dateStr: '', day: 0 });
      await fetchPeriods();
      toast({ description: '已取消当前记录' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function extendPeriod(dateStr: string) {
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod) return;
    try {
      await periodsApi.update(lastPeriod.id, { endDate: dateStr });
      setActionSheet({ open: false, dateStr: '', day: 0 });
      await fetchPeriods();
      toast({ description: '经期已延长' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function saveRecord() {
    const todayStr = formatDateStr(new Date());
    try {
      await recordsApi.upsert({
        date: todayStr,
        flow: currentFlow,
        mood: currentMood,
        symptoms: selectedSymptoms,
        note: noteText,
      });
      await fetchRecords();
      setNoteText('');
      toast({ description: '记录已保存 ✨' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function toggleSetting(key: string, currentValue: string) {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await settingsApi.update({ key, value: newValue });
      await fetchSettings();
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function saveProfile() {
    try {
      await profileApi.update({
        name: editName,
        avatar: editAvatar,
        cycleLength: editCycleLength,
        periodLength: editPeriodLength,
      });
      await fetchProfile();
      setProfileEditOpen(false);
      toast({ description: '个人资料已更新 ✅' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function submitFeedback() {
    if (!feedbackContent.trim()) {
      toast({ description: '请输入反馈内容' });
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await feedbackApi.create({
        category: feedbackCategory,
        content: feedbackContent.trim(),
        contact: feedbackContact.trim(),
      });
      setFeedbackOpen(false);
      setFeedbackContent('');
      setFeedbackContact('');
      setFeedbackCategory('功能建议');
      toast({ description: '感谢您的反馈！我们会认真处理 💖' });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({ description: error.message });
      } else {
        toast({ description: '提交失败，请稍后重试' });
      }
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ description: '图片大小不能超过2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setEditAvatar(result);
    };
    reader.readAsDataURL(file);
  }

  async function deleteRecord(id: string) {
    const d = deleteConfirm.date;
    try {
      await recordsApi.deleteByDate(d);
      setDeleteConfirm({ open: false, recordId: '', date: '' });
      await fetchRecords();
      toast({ description: '记录已删除' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  async function exportCSV() {
    try {
      const data = await exportApi.getData();
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + data.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luna_records_${formatDateStr(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ description: '数据导出成功 📁' });
    } catch (error) {
      if (error instanceof ApiError) toast({ description: error.message });
    }
  }

  // ============ Calendar Generation ============
  function generateCalendarDays(): CalendarDay[] {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayStr = formatDateStr(new Date());
    const predictedDays = getPredictedPeriodDays();
    const fertileDays = getFertileDays();

    const days: CalendarDay[] = [];

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
  const cycleStats: CycleStats = useMemo(() => {
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
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth() + 1;
  const calendarDays = generateCalendarDays();

  // ============ RENDER ============
  return (
    <div className="min-h-screen text-[#f0ece4] flex flex-col overflow-hidden relative"
      style={{ background: wallpaper ? 'transparent' : '#0f1419' }}>
      {/* Wallpaper Layer */}
      {wallpaper && (
        <div className="fixed inset-0 z-0">
          <img src={wallpaper} alt="壁纸" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(15, 20, 25, 0.55)' }} />
        </div>
      )}
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
          {activeTab === 'home' && (
            <HomeTab
              today={today}
              cycleInfo={cycleInfo}
              cycleStats={cycleStats}
              records={records}
              dailyTipIndex={dailyTipIndex}
              setDailyTipIndex={setDailyTipIndex}
              setActiveTab={setActiveTab}
              setLogTab={setLogTab}
              ringAnimated={ringAnimated}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab
              calYear={calYear}
              calMonth={calMonth}
              setCalYear={setCalYear}
              setCalMonth={setCalMonth}
              isCurrentMonth={isCurrentMonth}
              today={today}
              calendarDays={calendarDays}
              periods={periods}
              setActionSheet={setActionSheet}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'log' && (
            <LogTab
              today={today}
              logTab={logTab}
              setLogTab={setLogTab}
              currentFlow={currentFlow}
              setCurrentFlow={setCurrentFlow}
              currentMood={currentMood}
              setCurrentMood={setCurrentMood}
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={setSelectedSymptoms}
              customSymptoms={customSymptoms}
              noteText={noteText}
              setNoteText={setNoteText}
              records={records}
              saveRecord={saveRecord}
              setSymptomSheetOpen={setSymptomSheetOpen}
              setDeleteConfirm={setDeleteConfirm}
              cycleInfo={cycleInfo}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              records={records}
              periods={periods}
              cycleStats={cycleStats}
              settings={settings}
              cycleInfo={cycleInfo}
              setProfileEditOpen={setProfileEditOpen}
              setEditName={setEditName}
              setEditAvatar={setEditAvatar}
              setEditCycleLength={setEditCycleLength}
              setEditPeriodLength={setEditPeriodLength}
              toggleSetting={toggleSetting}
              exportCSV={exportCSV}
              setFeedbackOpen={setFeedbackOpen}
              toast={toast}
              wallpaper={wallpaper}
              themeColor={themeColor}
              onWallpaperChange={(url: string | null) => {
                setWallpaperStore(url);
                setWallpaperState(url);
              }}
              onThemeColorChange={(color: string) => {
                setThemeColorStore(color);
                setThemeColorState(color);
              }}
              wallpaperInputRef={wallpaperInputRef}
            />
          )}
        </AnimatePresence>
      </main>

      {/* ============ Bottom Navigation ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        style={{ background: wallpaper ? 'rgba(15, 20, 25, 0.85)' : 'linear-gradient(to top, #0f1419 80%, transparent)', backdropFilter: wallpaper ? 'blur(20px)' : 'none' }}>
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
              <item.icon size={22} style={{ color: activeTab === item.page ? themeColor : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? themeColor : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          ))}

          {/* FAB Button */}
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center -mt-5"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
              boxShadow: `0 8px 24px ${themeColor}50`,
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
              <item.icon size={22} style={{ color: activeTab === item.page ? themeColor : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? themeColor : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ============ Action Sheet ============ */}
      <ActionSheet
        open={actionSheet.open}
        dateStr={actionSheet.dateStr}
        day={actionSheet.day}
        calMonth={calMonth}
        setActionSheet={setActionSheet}
        periods={periods}
        hasActivePeriod={hasActivePeriod}
        getPeriodInfo={getPeriodInfo}
        startPeriod={startPeriod}
        endPeriod={endPeriod}
        updateStart={updateStart}
        cancelActivePeriod={cancelActivePeriod}
        extendPeriod={extendPeriod}
        fetchPeriods={fetchPeriods}
        toast={toast}
        themeColor={themeColor}
      />

      {/* ============ Add Symptom Sheet ============ */}
      <SymptomSheet
        open={symptomSheetOpen}
        newSymptom={newSymptom}
        setNewSymptom={setNewSymptom}
        setSymptomSheetOpen={setSymptomSheetOpen}
        setCustomSymptoms={setCustomSymptoms}
        toast={toast}
        themeColor={themeColor}
      />

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
                style={{ background: `linear-gradient(135deg, ${themeColor}, #81b29a)` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>L</span>
              </motion.div>
              <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>Luna</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>经期追踪</p>
              <motion.div
                className="w-16 h-1 rounded-full mx-auto mt-4"
                style={{ background: `linear-gradient(90deg, ${themeColor}, #81b29a)` }}
                animate={{ scaleX: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Profile Edit Sheet ============ */}
      <ProfileEditSheet
        open={profileEditOpen}
        editName={editName}
        setEditName={setEditName}
        editAvatar={editAvatar}
        setEditAvatar={setEditAvatar}
        editCycleLength={editCycleLength}
        setEditCycleLength={setEditCycleLength}
        editPeriodLength={editPeriodLength}
        setEditPeriodLength={setEditPeriodLength}
        setProfileEditOpen={setProfileEditOpen}
        saveProfile={saveProfile}
        handleAvatarUpload={handleAvatarUpload}
        fileInputRef={fileInputRef}
        themeColor={themeColor}
      />

      {/* ============ Delete Confirmation Dialog ============ */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        recordId={deleteConfirm.recordId}
        date={deleteConfirm.date}
        setDeleteConfirm={setDeleteConfirm}
        deleteRecord={deleteRecord}
      />

      {/* ============ Feedback Sheet ============ */}
      <FeedbackSheet
        open={feedbackOpen}
        feedbackCategory={feedbackCategory}
        setFeedbackCategory={setFeedbackCategory}
        feedbackContent={feedbackContent}
        setFeedbackContent={setFeedbackContent}
        feedbackContact={feedbackContact}
        setFeedbackContact={setFeedbackContact}
        feedbackSubmitting={feedbackSubmitting}
        setFeedbackOpen={setFeedbackOpen}
        submitFeedback={submitFeedback}
        themeColor={themeColor}
      />
    </div>
  );
}

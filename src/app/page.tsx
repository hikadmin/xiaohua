'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, FileText, User, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
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
import NotificationPanel, { type LunaNotification } from '@/components/luna/NotificationPanel';
import LockScreen from '@/components/luna/LockScreen';
import { isPinSet, isAppLockEnabled } from '@/lib/lock-utils';
import {
  periodsApi, recordsApi, profileApi, settingsApi, feedbackApi, seedApi, exportApi,
  ApiError,
} from '@/services/api';

// ============ Main Component ============
export default function LunaApp() {
  const { t } = useI18n();
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
    open: boolean; dateStr: string; day: number;
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
  const [selectedDate, setSelectedDate] = useState<string>(formatDateStr(today));
  const [editingDate, setEditingDate] = useState<string | null>(null);

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

  // Notification state
  const [notifications, setNotifications] = useState<LunaNotification[]>([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Profile sheet open state (to hide nav bar)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  // Daily tip state
  const [dailyTipIndex, setDailyTipIndex] = useState(() => {
    const t = new Date();
    return (t.getFullYear() * 366 + t.getMonth() * 31 + t.getDate()) % 5;
  });

  // Theme color state
  const [themeColor, setThemeColorState] = useState('#e07a5f');

  // Wallpaper state
  const [wallpaper, setWallpaperState] = useState('');

  // Theme scope state
  const [themeScope, setThemeScopeState] = useState<'local' | 'global'>('global');

  // App lock state
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('luna_theme_color');
      if (saved) setThemeColorState(saved);
    } catch {}
    try {
      const savedWp = localStorage.getItem('luna_wallpaper');
      if (savedWp) setWallpaperState(savedWp);
    } catch {}
    try {
      const savedScope = localStorage.getItem('luna_theme_scope');
      if (savedScope === 'local' || savedScope === 'global') setThemeScopeState(savedScope);
    } catch {}
  }, []);

  const setThemeColor = useCallback((color: string) => {
    setThemeColorState(color);
    try { localStorage.setItem('luna_theme_color', color); } catch {}
  }, []);

  const setWallpaper = useCallback((wp: string) => {
    setWallpaperState(wp);
    try { if (wp) localStorage.setItem('luna_wallpaper', wp); else localStorage.removeItem('luna_wallpaper'); } catch {}
  }, []);

  const setThemeScope = useCallback((scope: 'local' | 'global') => {
    setThemeScopeState(scope);
    try { localStorage.setItem('luna_theme_scope', scope); } catch {}
  }, []);

  // Apply theme color as CSS custom property when scope is global
  useEffect(() => {
    if (themeScope === 'global') {
      document.documentElement.style.setProperty('--theme-color', themeColor);
    } else {
      document.documentElement.style.removeProperty('--theme-color');
    }
  }, [themeScope, themeColor]);

  // Check if app lock should be shown
  const shouldShowLockScreen = (() => {
    if (isUnlocked) return false;
    try {
      const hasPin = isPinSet();
      const hasLockSetting = settings.find(s => s.key === 'app_lock')?.value === 'true';
      const localStorageEnabled = isAppLockEnabled();
      return (hasLockSetting || localStorageEnabled) && hasPin;
    } catch {
      return false;
    }
  })();

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const { toast } = useToast();

  // ============ Data Fetching ============
  const fetchPeriods = useCallback(async () => {
    try { const data = await periodsApi.getAll(); setPeriods(data); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }, [toast]);

  const fetchRecords = useCallback(async () => {
    try { const data = await recordsApi.getAll(); setRecords(data); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }, [toast]);

  const fetchProfile = useCallback(async () => {
    try { const data = await profileApi.get(); setProfile(data); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }, [toast]);

  const fetchSettings = useCallback(async () => {
    try { const data = await settingsApi.getAll(); setSettings(data); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }, [toast]);

  const seedData = useCallback(async () => {
    // 仅首次安装时初始化，版本更新时迁移
    try {
      const initialized = localStorage.getItem('luna_initialized');
      if (!initialized) {
        await seedApi.create();
        localStorage.setItem('luna_initialized', '2'); // APP_VERSION
      } else {
        const savedVersion = parseInt(initialized);
        if (savedVersion < 2) {
          // 版本迁移：补充新增设置项
          await seedApi.create();
          localStorage.setItem('luna_initialized', '2');
        }
      }
    } catch {}
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

  // ============ Notification Logic ============
  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('luna_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('luna_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Generate notifications from app data when data loads or changes
  useEffect(() => {
    if (!isLoaded) return;
    const newNotifs: LunaNotification[] = [];
    const ci = getCycleInfo();
    const todayStr = formatDateStr(new Date());

    // 1. Period reminder: if period is predicted within 1-3 days
    if (ci.daysUntilNext >= 1 && ci.daysUntilNext <= 3) {
      const existing = notifications.find(n => n.type === 'period' && n.message.includes(String(ci.daysUntilNext)));
      if (!existing) {
        newNotifs.push({
          id: `period-${todayStr}`,
          type: 'period',
          title: t('notif_period_coming'),
          message: `${ci.daysUntilNext}${t('notif_period_days')}`,
          timestamp: Date.now(),
        });
      }
    }

    // 2. Record reminder: if no record for today
    const todayRecord = records.find(r => r.date === todayStr);
    if (!todayRecord) {
      const existing = notifications.find(n => n.type === 'record' && n.id.startsWith('record-'));
      if (!existing) {
        newNotifs.push({
          id: `record-${todayStr}`,
          type: 'record',
          title: t('notif_record_today'),
          message: t('notif_record_today'),
          timestamp: Date.now() - 3600000, // 1 hour ago
        });
      }
    }

    // 3. Ovulation reminder: if in fertile window
    const fertileDays = getFertileDays();
    if (fertileDays.includes(todayStr)) {
      const existing = notifications.find(n => n.type === 'ovulation');
      if (!existing) {
        newNotifs.push({
          id: `ovulation-${todayStr}`,
          type: 'ovulation',
          title: t('notif_fertile'),
          message: t('notif_fertile'),
          timestamp: Date.now() - 7200000, // 2 hours ago
        });
      }
    }

    if (newNotifs.length > 0) {
      setNotifications(prev => {
        // Avoid duplicates: remove old notifications of the same type before adding new ones
        const newIds = newNotifs.map(n => n.id);
        const filtered = prev.filter(n => !newIds.includes(n.id));
        return [...newNotifs, ...filtered];
      });
    }
  }, [isLoaded, periods, records, profile]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ============ Period Logic ============
  function getPeriodInfo(dateStr: string): PeriodInfoResult {
    let isPeriod = false, isStart = false, isEnd = false, isActive = false;
    for (const period of periods) {
      if (period.startDate && !period.endDate) {
        if (dateStr === period.startDate) { isPeriod = true; isStart = true; isEnd = true; isActive = true; break; }
        const startD = parseDate(period.startDate);
        const checkD = parseDate(dateStr);
        if (checkD > startD && checkD <= new Date()) { isPeriod = true; if (dateStr === period.startDate) isStart = true; isActive = true; break; }
      } else if (period.startDate && period.endDate) {
        if (dateStr >= period.startDate && dateStr <= period.endDate) { isPeriod = true; if (dateStr === period.startDate) isStart = true; if (dateStr === period.endDate) isEnd = true; break; }
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
    if (!lastPeriod) return { phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength, cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: null };
    const lastStart = parseDate(lastPeriod.startDate);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const daysSinceStart = daysBetween(lastStart, now);
    if (daysSinceStart < 0) return { phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength, cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: lastPeriod.startDate };
    const dayInCycle = (daysSinceStart % cycleLength) + 1;
    const nextPeriodDate = addDays(lastStart, cycleLength);
    const daysUntilNext = Math.max(0, daysBetween(now, nextPeriodDate));
    let phase: string;
    if (dayInCycle <= periodLength) phase = 'period';
    else if (dayInCycle <= 13) phase = 'follicular';
    else if (dayInCycle <= 16) phase = 'ovulation';
    else phase = 'luteal';
    return { phase, phaseDay: dayInCycle, daysUntilNext, cycleLength, periodLength, nextPeriodDate, lastPeriodStart: lastPeriod.startDate };
  }

  function getPredictedPeriodDays(): string[] {
    const cycleLength = profile?.cycleLength || 28;
    const periodLength = profile?.periodLength || 5;
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod || !lastPeriod.endDate) return [];
    const lastEnd = parseDate(lastPeriod.endDate);
    const nextStart = addDays(lastEnd, cycleLength - periodLength + 1);
    return Array.from({ length: periodLength }, (_, i) => formatDateStr(addDays(nextStart, i)));
  }

  function getFertileDays(): string[] {
    const cycleLength = profile?.cycleLength || 28;
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0];
    if (!lastPeriod) return [];
    const lastStart = parseDate(lastPeriod.startDate);
    const ovulationDay = addDays(lastStart, cycleLength - 14);
    return Array.from({ length: 6 }, (_, i) => formatDateStr(addDays(ovulationDay, i - 4)));
  }

  // ============ API Actions ============
  async function startPeriod(dateStr: string) {
    try { await periodsApi.create({ startDate: dateStr }); setActionSheet({ open: false, dateStr: '', day: 0 }); await fetchPeriods(); toast({ description: t('action_period_started') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }
  async function endPeriod(dateStr: string) {
    const active = hasActivePeriod(); if (!active) return;
    if (dateStr < active.startDate) { toast({ description: t('action_end_before_start') }); return; }
    try { await periodsApi.update(active.id, { endDate: dateStr }); setActionSheet({ open: false, dateStr: '', day: 0 }); await fetchPeriods(); toast({ description: t('action_period_ended') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }
  async function updateStart(dateStr: string) {
    const active = hasActivePeriod(); if (!active) return;
    try { await periodsApi.update(active.id, { startDate: dateStr }); setActionSheet({ open: false, dateStr: '', day: 0 }); await fetchPeriods(); toast({ description: t('action_start_updated') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }
  async function cancelActivePeriod() {
    const active = hasActivePeriod(); if (!active) return;
    try { await periodsApi.delete(active.id); setActionSheet({ open: false, dateStr: '', day: 0 }); await fetchPeriods(); toast({ description: t('action_period_cancelled') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }
  async function extendPeriod(dateStr: string) {
    const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastPeriod = sortedPeriods[0]; if (!lastPeriod) return;
    try { await periodsApi.update(lastPeriod.id, { endDate: dateStr }); setActionSheet({ open: false, dateStr: '', day: 0 }); await fetchPeriods(); toast({ description: t('action_period_extended') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function saveRecord() {
    try { await recordsApi.upsert({ date: formatDateStr(new Date()), flow: currentFlow, mood: currentMood, symptoms: selectedSymptoms, note: noteText }); await fetchRecords(); setNoteText(''); toast({ description: t('log_record_saved') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function saveRecordForDate(date: string) {
    try { await recordsApi.upsert({ date, flow: currentFlow, mood: currentMood, symptoms: selectedSymptoms, note: noteText }); await fetchRecords(); setNoteText(''); setEditingDate(null); toast({ description: t('log_record_saved') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function updateRecord(date: string) {
    try { await recordsApi.updateByDate(date, { flow: currentFlow, mood: currentMood, symptoms: selectedSymptoms, note: noteText }); await fetchRecords(); setNoteText(''); setEditingDate(null); toast({ description: t('log_record_updated') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function toggleSetting(key: string, currentValue: string) {
    const nv = currentValue === 'true' ? 'false' : 'true';
    try { await settingsApi.update({ key, value: nv }); await fetchSettings(); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function saveProfile() {
    try { await profileApi.update({ name: editName, avatar: editAvatar, cycleLength: editCycleLength, periodLength: editPeriodLength }); await fetchProfile(); setProfileEditOpen(false); toast({ description: t('edit_profile_updated') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function submitFeedback() {
    if (!feedbackContent.trim()) { toast({ description: t('feedback_content_required') }); return; }
    setFeedbackSubmitting(true);
    try { await feedbackApi.create({ category: feedbackCategory, content: feedbackContent.trim(), contact: feedbackContact.trim() }); setFeedbackOpen(false); setFeedbackContent(''); setFeedbackContact(''); setFeedbackCategory('功能建议'); toast({ description: t('feedback_success') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); else toast({ description: '提交失败，请稍后重试' }); } finally { setFeedbackSubmitting(false); }
  }



  async function deleteRecord(id: string) {
    try { await recordsApi.deleteByDate(deleteConfirm.date); setDeleteConfirm({ open: false, recordId: '', date: '' }); await fetchRecords(); toast({ description: t('log_record_deleted') }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function exportCSV() {
    try { const data = await exportApi.getData(); const BOM = '\uFEFF'; const blob = new Blob([BOM + data.csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `luna_records_${formatDateStr(new Date())}.csv`; a.click(); URL.revokeObjectURL(url); toast({ description: '数据导出成功 📁' }); } catch (error) { if (error instanceof ApiError) toast({ description: error.message }); }
  }

  async function resetData() {
    try {
      // Clear all data via API
      for (const p of periods) { try { await periodsApi.delete(p.id); } catch {} }
      for (const r of records) { try { await recordsApi.deleteByDate(r.date); } catch {} }
      await seedData();
      await Promise.all([fetchPeriods(), fetchRecords(), fetchProfile(), fetchSettings()]);
      toast({ description: t('reset_success') });
    } catch { toast({ description: '重置失败' }); }
  }

  // ============ Calendar Generation ============
  function generateCalendarDays(): CalendarDay[] {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(calYear, calMonth, 0).getDate();
    const todayStr = formatDateStr(new Date());
    const predictedDays = getPredictedPeriodDays();
    const fertileDays = getFertileDays();
    const days: CalendarDay[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push({ day: 0, dateStr: '', isToday: false, isOtherMonth: true, periodInfo: { isPeriod: false, isStart: false, isEnd: false, isActive: false }, isPredicted: false, isFertile: false });
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const periodInfo = getPeriodInfo(dateStr);
      days.push({ day, dateStr, isToday: dateStr === todayStr, isOtherMonth: false, periodInfo, isPredicted: predictedDays.includes(dateStr) && !periodInfo.isPeriod, isFertile: fertileDays.includes(dateStr) && !periodInfo.isPeriod && !predictedDays.includes(dateStr) });
    }
    return days;
  }

  // ============ Cycle Statistics ============
  const cycleStats: CycleStats = useMemo(() => {
    const sp = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const cl: number[] = [], pl: number[] = [];
    for (let i = 1; i < sp.length; i++) {
      // 周期长度只需两个相邻经期开始日期，不需要endDate
      const c = daysBetween(parseDate(sp[i - 1].startDate), parseDate(sp[i].startDate));
      if (c > 15 && c < 50) cl.push(c);
      // 经期长度需要endDate
      if (sp[i].endDate) { const p = daysBetween(parseDate(sp[i].startDate), parseDate(sp[i].endDate!)) + 1; if (p > 0 && p < 15) pl.push(p); }
    }
    return { avgCycle: cl.length > 0 ? Math.round(cl.reduce((a, b) => a + b, 0) / cl.length) : (profile?.cycleLength || 28), avgPeriod: pl.length > 0 ? Math.round(pl.reduce((a, b) => a + b, 0) / pl.length) : (profile?.periodLength || 5), totalCycles: sp.length, cycleLengths: cl, periodLengths: pl };
  }, [periods, profile]);

  const cycleInfo = getCycleInfo();
  const phaseData = PHASE_INFO[cycleInfo.phase] || PHASE_INFO.follicular;
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth() + 1;
  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-[#0f1419] text-[#f0ece4] flex flex-col overflow-hidden relative">
      {/* Wallpaper Background */}
      {wallpaper && (
        <div className="fixed inset-0 z-0">
          <img src={wallpaper} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(15,20,25,0.75)' }} />
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full opacity-30 blur-[80px]" style={{ width: 300, height: 300, background: `linear-gradient(135deg, ${themeColor}40, transparent)`, top: -80, right: -80, animation: 'blob-float 20s ease-in-out infinite', transition: 'background 1s ease' }} />
        <div className="absolute rounded-full opacity-25 blur-[60px]" style={{ width: 250, height: 250, background: 'linear-gradient(135deg, #81b29a, transparent)', bottom: 200, left: -80, animation: 'blob-float 20s ease-in-out infinite', animationDelay: '-7s' }} />
        <div className="absolute rounded-full opacity-20 blur-[50px]" style={{ width: 180, height: 180, background: `linear-gradient(135deg, ${themeColor}80, transparent)`, bottom: -40, right: -40, animation: 'blob-float 20s ease-in-out infinite', animationDelay: '-14s' }} />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden safe-top" style={{ paddingBottom: 90 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeTab today={today} cycleInfo={cycleInfo} cycleStats={cycleStats} records={records} dailyTipIndex={dailyTipIndex} setDailyTipIndex={setDailyTipIndex} setActiveTab={setActiveTab} setLogTab={setLogTab} ringAnimated={ringAnimated} notificationCount={notifications.length} onOpenNotification={() => setNotificationPanelOpen(true)} />}
          {activeTab === 'calendar' && <CalendarTab calYear={calYear} calMonth={calMonth} setCalYear={setCalYear} setCalMonth={setCalMonth} isCurrentMonth={isCurrentMonth} today={today} calendarDays={calendarDays} periods={periods} setActionSheet={setActionSheet} />}
          {activeTab === 'log' && <LogTab today={today} logTab={logTab} setLogTab={setLogTab} currentFlow={currentFlow} setCurrentFlow={setCurrentFlow} currentMood={currentMood} setCurrentMood={setCurrentMood} selectedSymptoms={selectedSymptoms} setSelectedSymptoms={setSelectedSymptoms} customSymptoms={customSymptoms} noteText={noteText} setNoteText={setNoteText} records={records} saveRecord={saveRecord} saveRecordForDate={saveRecordForDate} updateRecord={updateRecord} setSymptomSheetOpen={setSymptomSheetOpen} setDeleteConfirm={setDeleteConfirm} cycleInfo={cycleInfo} editingDate={editingDate} setEditingDate={setEditingDate} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
          {activeTab === 'profile' && <ProfileTab profile={profile} records={records} periods={periods} cycleStats={cycleStats} settings={settings} cycleInfo={cycleInfo} setProfileEditOpen={setProfileEditOpen} setEditName={setEditName} setEditAvatar={setEditAvatar} setEditCycleLength={setEditCycleLength} setEditPeriodLength={setEditPeriodLength} toggleSetting={toggleSetting} exportCSV={exportCSV} setFeedbackOpen={setFeedbackOpen} toast={toast} resetData={resetData} themeColor={themeColor} setThemeColor={setThemeColor} wallpaper={wallpaper} setWallpaper={setWallpaper} themeScope={themeScope} setThemeScope={setThemeScope} onSheetOpenChange={setProfileSheetOpen} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom transition-transform duration-300" style={{ background: 'linear-gradient(to top, #0f1419 80%, transparent)', transform: (profileSheetOpen || actionSheet.open || profileEditOpen || feedbackOpen || notificationPanelOpen || symptomSheetOpen) ? 'translateY(100%)' : 'translateY(0)' }}>
        <div className="flex justify-around items-center pb-5 pt-2">
          {[
            { page: 'home' as TabPage, icon: Home, label: t('tab_home') },
            { page: 'calendar' as TabPage, icon: Calendar, label: t('tab_calendar') },
          ].map(item => (
            <button key={item.page} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all" style={{ background: activeTab === item.page ? 'rgba(255,255,255,0.05)' : 'transparent' }} onClick={() => setActiveTab(item.page)}>
              <item.icon size={22} style={{ color: activeTab === item.page ? themeColor : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? themeColor : '#6b7280' }}>{item.label}</span>
            </button>
          ))}
          <motion.button className="w-14 h-14 rounded-full flex items-center justify-center -mt-5" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`, boxShadow: `0 8px 24px ${themeColor}59` }} whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => { const todayStr = formatDateStr(new Date()); setActionSheet({ open: true, dateStr: todayStr, day: new Date().getDate() }); }}>
            <Plus size={26} style={{ color: '#0f1419', strokeWidth: 2.5 }} />
          </motion.button>
          {[
            { page: 'log' as TabPage, icon: FileText, label: t('tab_log') },
            { page: 'profile' as TabPage, icon: User, label: t('tab_profile') },
          ].map(item => (
            <button key={item.page} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all" style={{ background: activeTab === item.page ? 'rgba(255,255,255,0.05)' : 'transparent' }} onClick={() => setActiveTab(item.page)}>
              <item.icon size={22} style={{ color: activeTab === item.page ? themeColor : '#6b7280' }} />
              <span className="text-[11px] font-medium" style={{ color: activeTab === item.page ? themeColor : '#6b7280' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Action Sheet */}
      <ActionSheet open={actionSheet.open} dateStr={actionSheet.dateStr} day={actionSheet.day} calMonth={calMonth} setActionSheet={setActionSheet} periods={periods} hasActivePeriod={hasActivePeriod} getPeriodInfo={getPeriodInfo} startPeriod={startPeriod} endPeriod={endPeriod} updateStart={updateStart} cancelActivePeriod={cancelActivePeriod} extendPeriod={extendPeriod} fetchPeriods={fetchPeriods} toast={toast} />

      {/* Symptom Sheet */}
      <SymptomSheet open={symptomSheetOpen} newSymptom={newSymptom} setNewSymptom={setNewSymptom} setSymptomSheetOpen={setSymptomSheetOpen} setCustomSymptoms={setCustomSymptoms} toast={toast} />

      {/* Loading Overlay */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: '#0f1419' }}>
            <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <motion.div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}, #81b29a)` }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>L</span>
              </motion.div>
              <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>Luna</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>经期追踪</p>
              <motion.div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: `linear-gradient(90deg, ${themeColor}, #81b29a)` }} animate={{ scaleX: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Sheet */}
      <ProfileEditSheet open={profileEditOpen} editName={editName} setEditName={setEditName} editAvatar={editAvatar} setEditAvatar={setEditAvatar} editCycleLength={editCycleLength} setEditCycleLength={setEditCycleLength} editPeriodLength={editPeriodLength} setEditPeriodLength={setEditPeriodLength} setProfileEditOpen={setProfileEditOpen} saveProfile={saveProfile} fileInputRef={fileInputRef} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog open={deleteConfirm.open} recordId={deleteConfirm.recordId} date={deleteConfirm.date} setDeleteConfirm={setDeleteConfirm} deleteRecord={deleteRecord} />

      {/* Feedback Sheet */}
      <FeedbackSheet open={feedbackOpen} feedbackCategory={feedbackCategory} setFeedbackCategory={setFeedbackCategory} feedbackContent={feedbackContent} setFeedbackContent={setFeedbackContent} feedbackContact={feedbackContact} setFeedbackContact={setFeedbackContact} feedbackSubmitting={feedbackSubmitting} setFeedbackOpen={setFeedbackOpen} submitFeedback={submitFeedback} />

      {/* Notification Panel */}
      <NotificationPanel open={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} notifications={notifications} onDeleteNotification={deleteNotification} onDeleteAll={deleteAllNotifications} />

      {/* App Lock Screen */}
      <AnimatePresence>
        {shouldShowLockScreen && (
          <LockScreen themeColor={themeColor} onUnlock={handleUnlock} />
        )}
      </AnimatePresence>
    </div>
  );
}

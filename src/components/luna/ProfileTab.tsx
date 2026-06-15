'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, Droplets, Check, Bell, Clock, Crosshair,
  Shield, Eye, Lock, Moon, Sun, Download, Cloud, RotateCcw,
  Globe, Info, MessageSquare, ChevronRight, Target,
  Trash2, Palette, Share2, AlertTriangle, Image as ImageIcon,
} from 'lucide-react';
import { useI18n, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import {
  StaggerIn, formatShortDate,
  type DailyRecord, type UserProfile, type Setting, type Period,
  type CycleStats, type CycleInfo,
} from './shared';
import ImageCropDialog from './ImageCropDialog';
import LockSetupSheet from './LockSetupSheet';

const THEME_COLORS = [
  { name: '暖橙', primary: '#e07a5f', secondary: '#d4a574' },
  { name: '薄荷绿', primary: '#81b29a', secondary: '#6dab8e' },
  { name: '樱花粉', primary: '#e8a0bf', secondary: '#d4869f' },
  { name: '星空紫', primary: '#9b8ec4', secondary: '#8577b0' },
  { name: '海洋蓝', primary: '#5b9bd5', secondary: '#4a8bc4' },
  { name: '日落金', primary: '#d4a574', secondary: '#c49464' },
];

const PRESET_WALLPAPERS = [
  { name: '日落暖光', gradient: 'linear-gradient(135deg, #ff6b35, #f7931e, #ffcc02)' },
  { name: '海洋深蓝', gradient: 'linear-gradient(135deg, #0f3460, #16537e, #1a8a8a)' },
  { name: '森林绿意', gradient: 'linear-gradient(135deg, #134e5e, #1a6b3c, #2ecc71)' },
  { name: '夜空星河', gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { name: '樱花粉黛', gradient: 'linear-gradient(135deg, #ee9ca7, #ffdde1, #f8b4c8)' },
];

interface ProfileTabProps {
  profile: UserProfile | null;
  records: DailyRecord[];
  periods: Period[];
  cycleStats: CycleStats;
  settings: Setting[];
  cycleInfo: CycleInfo;
  setProfileEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditName: React.Dispatch<React.SetStateAction<string>>;
  setEditAvatar: React.Dispatch<React.SetStateAction<string>>;
  setEditCycleLength: React.Dispatch<React.SetStateAction<number>>;
  setEditPeriodLength: React.Dispatch<React.SetStateAction<number>>;
  toggleSetting: (key: string, currentValue: string) => void;
  exportCSV: () => void;
  setFeedbackOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toast: (opts: { description: string }) => void;
  resetData: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  wallpaper: string;
  setWallpaper: (wp: string) => void;
  requestNotificationPermission: () => Promise<boolean>;
  onSheetOpenChange?: (open: boolean) => void;
}

function ResetDataDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);
  const ok = confirmText === t('reset_confirm_text');
  return (
    <AnimatePresence>
      {open && (
    <motion.div key="reset-data-dialog" className="fixed inset-0 z-[200] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="relative w-full max-w-sm rounded-[24px] p-6" style={{ background: 'var(--luna-surface)', border: '1px solid var(--luna-card-border)' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={28} style={{ color: '#ef4444' }} /></div>
          <p className="text-lg font-medium">{t('reset_title')}</p>
        </div>
        {step === 1 ? (
          <>
            <p className="text-sm text-center mb-4" style={{ color: 'var(--luna-text-secondary)' }}>{t('reset_warning')}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--luna-text)' }} onClick={onClose}>{t('reset_cancel')}</button>
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }} onClick={() => setStep(2)}>{t('log_confirm')}</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-center mb-3" style={{ color: '#ef4444' }}>{t('reset_confirm')}</p>
            <p className="text-xs text-center mb-3" style={{ color: 'var(--luna-text-muted)' }}>{t('reset_input_hint')}</p>
            <input type="text" className="w-full px-4 py-3 rounded-xl text-sm text-center outline-none mb-4" style={{ background: 'var(--luna-bg)', border: `1.5px solid var(--luna-card-border)`, color: 'var(--luna-text)' }} placeholder={t('reset_confirm_text')} value={confirmText} onChange={e => setConfirmText(e.target.value)} />
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--luna-text)' }} onClick={() => { setStep(1); setConfirmText(''); }}>{t('reset_cancel')}</button>
              <button className="flex-1 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: ok ? '#ef4444' : 'rgba(239,68,68,0.1)', color: ok ? '#fff' : 'var(--luna-text-muted)', cursor: ok ? 'pointer' : 'not-allowed' }} onClick={() => { if (ok) { onConfirm(); setStep(1); setConfirmText(''); } }}>{t('reset_button')}</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

function BottomSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <AnimatePresence>{open && (
      <motion.div key="bottom-sheet" className="fixed inset-0 z-[200] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <div className="absolute inset-0" style={{ background: 'var(--luna-overlay)' }} />
        <motion.div
          className="relative w-full max-w-md rounded-t-[24px] flex flex-col"
          style={{
            background: 'var(--luna-surface)',
            border: '1px solid var(--luna-card-border)',
            maxHeight: '85dvh',
            paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
          }}
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Fallback for browsers without dvh support */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4 mt-5 flex-shrink-0" style={{ background: 'var(--luna-card-border)' }} />
          <p className="text-lg font-medium text-center mb-4 px-6 flex-shrink-0">{title}</p>
          <div className="flex-1 overflow-y-auto px-6 overscroll-contain min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
          {footer && (
            <div className="flex-shrink-0 px-6 pt-3" style={{ borderTop: '1px solid var(--luna-card-border)' }}>
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}

export default function ProfileTab({
  profile, records, periods, cycleStats, settings, cycleInfo,
  setProfileEditOpen, setEditName, setEditAvatar, setEditCycleLength, setEditPeriodLength,
  toggleSetting, exportCSV, setFeedbackOpen, toast, resetData, themeColor, setThemeColor,
  wallpaper, setWallpaper, requestNotificationPermission, onSheetOpenChange,
}: ProfileTabProps) {
  const { t, locale, setLocale } = useI18n();
  const [resetOpen, setResetOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  // Wallpaper state
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  // Track if any sheet is open to hide nav bar
  const anySheetOpen = langOpen || themeOpen || wallpaperOpen || lockOpen;
  useEffect(() => { onSheetOpenChange?.(anySheetOpen); }, [anySheetOpen, onSheetOpenChange]);

  const [wallpaperImageSrc, setWallpaperImageSrc] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const wallpaperFileRef = useRef<HTMLInputElement>(null);

  const cycleReg = (() => {
    if (cycleStats.cycleLengths.length < 2) return t('profile_insufficient');
    const avg = cycleStats.avgCycle;
    const v = cycleStats.cycleLengths.reduce((s, l) => s + Math.pow(l - avg, 2), 0) / cycleStats.cycleLengths.length;
    return Math.sqrt(v) <= 4 ? t('profile_regular') : t('profile_irregular');
  })();

  // Task 6: Enhanced WeChat share
  const shareWeChat = async () => {
    // Try native share first (works well on mobile, includes WeChat option)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Luna',
          text: '我在使用 Luna 经期追踪应用，推荐给你！',
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback
      }
    }

    // Fallback: generate share image via canvas and copy link
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas');

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 600, 400);
      bgGrad.addColorStop(0, '#1a2027');
      bgGrad.addColorStop(1, '#0f1419');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 400);

      // Accent circle
      const accentGrad = ctx.createRadialGradient(300, 140, 10, 300, 140, 80);
      accentGrad.addColorStop(0, themeColor);
      accentGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = accentGrad;
      ctx.fillRect(0, 0, 600, 400);

      // Logo circle
      ctx.beginPath();
      ctx.arc(300, 130, 40, 0, Math.PI * 2);
      const logoGrad = ctx.createLinearGradient(260, 90, 340, 170);
      logoGrad.addColorStop(0, themeColor);
      logoGrad.addColorStop(1, '#81b29a');
      ctx.fillStyle = logoGrad;
      ctx.fill();

      // Logo text
      ctx.fillStyle = '#0f1419';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('L', 300, 132);

      // App name
      ctx.fillStyle = '#f0ece4';
      ctx.font = '28px Georgia, serif';
      ctx.fillText('Luna', 300, 200);

      // Description
      ctx.fillStyle = '#a8a29e';
      ctx.font = '16px sans-serif';
      ctx.fillText('经期追踪 · 周期管理 · 健康记录', 300, 240);

      // URL
      ctx.fillStyle = themeColor;
      ctx.font = '14px sans-serif';
      ctx.fillText(window.location.host, 300, 300);

      // Copy link to clipboard
      await navigator.clipboard.writeText(`${window.location.href} - Luna 经期追踪`);
      toast({ description: '链接已复制，可分享给好友 📋' });
    } catch {
      toast({ description: '分享功能暂不可用' });
    }
  };

  // Wallpaper: handle file selection
  const handleWallpaperFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ description: '图片大小不能超过5MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setWallpaperImageSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setWallpaper(croppedBase64);
    setCropOpen(false);
    setWallpaperImageSrc('');
    setWallpaperOpen(false);
    toast({ description: t('wallpaper_set') });
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    setWallpaperImageSrc('');
  };

  const selectPresetWallpaper = (gradient: string) => {
    // Create a small canvas to convert gradient to base64
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Parse gradient colors from the string
    const colorMatches = gradient.match(/#[0-9a-fA-F]{6}/g);
    if (!colorMatches || colorMatches.length < 2) return;

    const grad = ctx.createLinearGradient(0, 0, 360, 640);
    colorMatches.forEach((color, i) => {
      grad.addColorStop(i / (colorMatches.length - 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 360, 640);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setWallpaper(base64);
    setWallpaperOpen(false);
    toast({ description: t('wallpaper_set') });
  };

  const removeWallpaper = () => {
    setWallpaper('');
    setWallpaperOpen(false);
    toast({ description: t('wallpaper_removed') });
  };

  const appLockOn = settings.find(s => s.key === 'app_lock')?.value === 'true';

  return (
    <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="px-5 pt-12 pb-6">
      {/* User */}
      <StaggerIn delay={0.05}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: profile?.avatar ? 'transparent' : 'linear-gradient(135deg, #e07a5f, #81b29a)' }}>
            {profile?.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: 'var(--luna-text)' }}>{profile?.name?.charAt(0) || 'L'}</span>}
          </div>
          <div className="flex-1">
            <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{profile?.name || 'Luna'}</p>
            <p className="text-sm" style={{ color: 'var(--luna-text-secondary)' }}>{t('profile_recorded_days')} {records.length} {t('common_days')} · {cycleStats.totalCycles} {t('profile_cycles')}</p>
          </div>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }} onClick={() => { setEditName(profile?.name || 'Luna'); setEditAvatar(profile?.avatar || ''); setEditCycleLength(profile?.cycleLength || 28); setEditPeriodLength(profile?.periodLength || 5); setProfileEditOpen(true); }}><Target size={16} style={{ color: 'var(--luna-text-secondary)' }} /></button>
        </div>
      </StaggerIn>

      {/* Health */}
      <StaggerIn delay={0.1}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-4">{t('profile_health')}</p>
          <div className="space-y-4">
            {[{ l: t('profile_avg_cycle'), v: `${cycleStats.avgCycle} ${t('common_days')}`, i: <TrendingUp size={16} style={{ color: '#81b29a' }} /> }, { l: t('profile_avg_period'), v: `${cycleStats.avgPeriod} ${t('common_days')}`, i: <Droplets size={16} style={{ color: '#e07a5f' }} /> }, { l: t('profile_last_period'), v: periods.length > 0 ? formatShortDate([...periods].sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate) : t('profile_no_record'), i: <Calendar size={16} style={{ color: '#d4a574' }} /> }, { l: t('profile_cycle_regular'), v: cycleReg, i: <Check size={16} style={{ color: cycleReg === t('profile_insufficient') ? 'var(--luna-text-muted)' : '#81b29a' }} /> }].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2">{item.i}<span className="text-sm" style={{ color: 'var(--luna-text-secondary)' }}>{item.l}</span></div><span className="text-sm font-medium" style={{ color: item.v === t('profile_insufficient') ? 'var(--luna-text-muted)' : 'var(--luna-text)' }}>{item.v}</span></div>
                {item.l === t('profile_cycle_regular') && item.v === t('profile_insufficient') && (
                  <p className="text-[11px] mt-1 ml-6" style={{ color: 'var(--luna-text-muted)' }}>{t('profile_insufficient_tip')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </StaggerIn>

      {/* Reminders */}
      <StaggerIn delay={0.15}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_notification')}</p>
          {[{ key: 'period_reminder', icon: Bell, l: t('profile_period_reminder'), d: t('profile_period_reminder_desc') }, { key: 'record_reminder', icon: Clock, l: t('profile_record_reminder'), d: t('profile_record_reminder_desc') }, { key: 'ovulation_reminder', icon: Crosshair, l: t('profile_ovulation_reminder'), d: t('profile_ovulation_reminder_desc') }].map(item => {
            const s = settings.find(s => s.key === item.key); const on = s?.value === 'true';
            return (
              <div key={item.key} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={async () => {
                const isTurningOn = (s?.value || 'false') === 'false';
                if (isTurningOn) {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    toast({ description: t('notif_permission_denied') });
                    return;
                  }
                }
                toggleSetting(item.key, s?.value || 'false');
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--luna-surface)' }}><item.icon size={20} style={{ color: 'var(--luna-text-secondary)' }} /></div>
                <div className="flex-1"><p className="text-[15px] font-medium" style={{ color: 'var(--luna-text)' }}>{item.l}</p><p className="text-xs" style={{ color: 'var(--luna-text-muted)' }}>{item.d}</p></div>
                <div className="w-12 h-7 rounded-full relative transition-all duration-300" style={{ background: on ? '#e07a5f' : 'var(--luna-surface)' }}><div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300" style={{ background: 'var(--luna-text)', left: on ? '23px' : '3px' }} /></div>
              </div>
            );
          })}
        </div>
      </StaggerIn>

      {/* Privacy */}
      <StaggerIn delay={0.2}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_privacy')}</p>
          {[{ icon: Shield, l: t('profile_app_lock'), d: appLockOn ? t('lock_status_enabled') : t('lock_status_disabled'), fn: () => setLockOpen(true), active: appLockOn }, { icon: Eye, l: t('profile_privacy_mode'), d: t('profile_privacy_mode_desc'), fn: () => toast({ description: '隐私模式开发中' }), active: false }, { icon: Lock, l: t('profile_data_encryption'), d: t('profile_data_encryption_desc'), fn: () => toast({ description: '数据加密开发中' }), active: false }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.active ? 'rgba(129,178,154,0.12)' : 'var(--luna-surface)' }}><item.icon size={20} style={{ color: item.active ? '#81b29a' : 'var(--luna-text-secondary)' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: item.active ? '#81b29a' : 'var(--luna-text-muted)' }}>{item.d}</p></div>
              {item.active ? <div className="w-2 h-2 rounded-full" style={{ background: '#81b29a' }} /> : <ChevronRight size={20} style={{ color: 'var(--luna-text-muted)' }} />}
            </div>
          ))}
        </div>
      </StaggerIn>

      {/* Appearance */}
      <StaggerIn delay={0.25}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_appearance')}</p>
          {[{ icon: Moon, l: t('profile_dark_mode'), d: t('profile_dark_mode_desc'), toggle: true, tk: 'dark_mode' }, { icon: Palette, l: t('profile_theme_color'), d: t('profile_theme_color_desc'), fn: () => setThemeOpen(true) }, { icon: ImageIcon, l: t('wallpaper_title'), d: wallpaper ? t('wallpaper_set') : t('wallpaper_select'), fn: () => setWallpaperOpen(true) }].map((item, i) => {
            const s = item.tk ? settings.find(s => s.key === item.tk) : null; const on = s?.value === 'true';
            return (
              <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={() => { if (item.tk) toggleSetting(item.tk, s?.value || 'false'); else item.fn?.(); }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--luna-surface)' }}><item.icon size={20} style={{ color: 'var(--luna-text-secondary)' }} /></div>
                <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: 'var(--luna-text-muted)' }}>{item.d}</p></div>
                {item.toggle ? <div className="w-12 h-7 rounded-full relative transition-all duration-300" style={{ background: on ? '#e07a5f' : 'var(--luna-surface)' }}><div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300" style={{ background: 'var(--luna-text)', left: on ? '23px' : '3px' }} /></div> : <ChevronRight size={20} style={{ color: 'var(--luna-text-muted)' }} />}
              </div>
            );
          })}
        </div>
      </StaggerIn>

      {/* Data */}
      <StaggerIn delay={0.3}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_data_management')}</p>
          {[{ icon: Download, l: t('profile_export_data'), d: t('profile_export_csv'), fn: exportCSV }, { icon: Share2, l: t('profile_export_wechat'), d: t('profile_export_wechat'), fn: shareWeChat }, { icon: Cloud, l: t('profile_cloud_sync'), d: t('profile_cloud_sync_desc'), fn: () => toast({ description: '云同步功能开发中' }) }, { icon: RotateCcw, l: t('profile_restore_data'), d: t('profile_restore_data_desc'), fn: () => toast({ description: '恢复数据功能开发中' }) }, { icon: Trash2, l: t('profile_reset_data'), d: t('profile_reset_data_desc'), fn: () => setResetOpen(true), danger: true }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--luna-surface)' }}><item.icon size={20} style={{ color: item.danger ? '#ef4444' : 'var(--luna-text-secondary)' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium" style={{ color: item.danger ? '#ef4444' : 'var(--luna-text)' }}>{item.l}</p><p className="text-xs" style={{ color: 'var(--luna-text-muted)' }}>{item.d}</p></div>
              <ChevronRight size={20} style={{ color: item.danger ? '#ef4444' : 'var(--luna-text-muted)' }} />
            </div>
          ))}
        </div>
      </StaggerIn>

      {/* Other */}
      <StaggerIn delay={0.35}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'var(--luna-card)', border: '1px solid var(--luna-card-border)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_other')}</p>
          {[{ icon: Globe, l: t('profile_language'), d: LOCALE_NAMES[locale], fn: () => setLangOpen(true) }, { icon: Info, l: t('profile_about'), d: t('profile_version'), fn: () => toast({ description: 'Luna v2.0.0 🌙' }) }, { icon: MessageSquare, l: t('profile_feedback'), d: t('profile_feedback_desc'), fn: () => setFeedbackOpen(true) }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--luna-surface)' }}><item.icon size={20} style={{ color: 'var(--luna-text-secondary)' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: 'var(--luna-text-muted)' }}>{item.d}</p></div>
              <ChevronRight size={20} style={{ color: 'var(--luna-text-muted)' }} />
            </div>
          ))}
        </div>
      </StaggerIn>

      <div className="mt-4 text-center mb-4">
        <p className="text-xs" style={{ color: 'var(--luna-text-muted)' }}>{t('profile_security_note1')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--luna-text-muted)' }}>{t('profile_security_note2')}</p>
      </div>

      {/* Dialogs & Sheets */}
      <ResetDataDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => { resetData(); setResetOpen(false); }} />

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title={t('profile_language')}>
        <div className="space-y-2">
          {(['zh', 'en', 'ko'] as Locale[]).map(loc => (
            <button key={loc} className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]" style={{ background: locale === loc ? 'rgba(224,122,95,0.15)' : 'var(--luna-card)', border: locale === loc ? '1.5px solid #e07a5f' : `1.5px solid var(--luna-card-border)` }} onClick={() => { setLocale(loc); setLangOpen(false); }}>
              <span className="text-[15px] font-medium">{LOCALE_NAMES[loc]}</span>
              {locale === loc && <Check size={18} style={{ color: '#e07a5f' }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Theme Color Sheet */}
      <BottomSheet open={themeOpen} onClose={() => setThemeOpen(false)} title={t('theme_title')}>
        <p className="text-xs mb-3" style={{ color: 'var(--luna-text-muted)' }}>{t('theme_colors')}</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_COLORS.map(tc => (
            <button key={tc.primary} className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all" style={{ background: themeColor === tc.primary ? 'rgba(224,122,95,0.15)' : 'var(--luna-card)', border: themeColor === tc.primary ? '1.5px solid #e07a5f' : `1.5px solid var(--luna-card-border)` }} onClick={() => { setThemeColor(tc.primary); toast({ description: `${tc.name} ✨` }); }}>
              <div className="w-10 h-10 rounded-full" style={{ background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})` }} />
              <span className="text-xs">{tc.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Wallpaper Picker Sheet */}
      <BottomSheet
        open={wallpaperOpen}
        onClose={() => setWallpaperOpen(false)}
        title={t('wallpaper_title')}
        footer={wallpaper ? (
          <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.98]" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.15)' }} onClick={removeWallpaper}>
            <Trash2 size={18} style={{ color: '#ef4444' }} />
            <span className="text-[15px] font-medium" style={{ color: '#ef4444' }}>{t('wallpaper_remove')}</span>
          </button>
        ) : undefined}
      >
        {/* Select Image from Gallery */}
        <input ref={wallpaperFileRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperFile} />
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl mb-4 transition-all active:scale-[0.98]" style={{ background: 'var(--luna-card)', border: `1.5px solid var(--luna-card-border)` }} onClick={() => wallpaperFileRef.current?.click()}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224,122,95,0.15)' }}><ImageIcon size={20} style={{ color: '#e07a5f' }} /></div>
          <span className="text-[15px] font-medium">{t('wallpaper_select')}</span>
          <ChevronRight size={20} style={{ color: 'var(--luna-text-muted)', marginLeft: 'auto' }} />
        </button>

        {/* Preset Wallpapers */}
        <p className="text-xs mb-3" style={{ color: 'var(--luna-text-muted)' }}>{t('wallpaper_preset')}</p>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {PRESET_WALLPAPERS.map((pw, i) => (
            <button key={i} className="relative rounded-xl overflow-hidden flex-shrink-0 transition-all active:scale-95" style={{ width: '64px', height: '86px', background: pw.gradient, border: wallpaper && i === 0 ? '2px solid #e07a5f' : `1px solid var(--luna-card-border)` }} onClick={() => selectPresetWallpaper(pw.gradient)}>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <span className="text-[9px] font-medium text-white drop-shadow-lg whitespace-nowrap">{pw.name}</span>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Image Crop Dialog for Wallpaper */}
      <ImageCropDialog
        open={cropOpen}
        imageSrc={wallpaperImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        cropShape="rect"
        aspectRatio={9 / 16}
      />

      <LockSetupSheet
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        isLockEnabled={appLockOn}
        toggleAppLock={(currentValue: string) => toggleSetting('app_lock', currentValue)}
        themeColor={themeColor}
      />
    </motion.div>
  );
}

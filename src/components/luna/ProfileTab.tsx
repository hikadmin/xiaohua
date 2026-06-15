'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, Droplets, Check, Bell, Clock, Crosshair,
  Shield, Eye, Lock, Moon, Sun, Download, Cloud, RotateCcw,
  Globe, Info, MessageSquare, ChevronRight, Target,
  Trash2, Palette, Share2, AlertTriangle,
} from 'lucide-react';
import { useI18n, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import {
  StaggerIn, formatShortDate,
  type DailyRecord, type UserProfile, type Setting, type Period,
  type CycleStats, type CycleInfo,
} from './shared';

const THEME_COLORS = [
  { name: '暖橙', primary: '#e07a5f', secondary: '#d4a574' },
  { name: '薄荷绿', primary: '#81b29a', secondary: '#6dab8e' },
  { name: '樱花粉', primary: '#e8a0bf', secondary: '#d4869f' },
  { name: '星空紫', primary: '#9b8ec4', secondary: '#8577b0' },
  { name: '海洋蓝', primary: '#5b9bd5', secondary: '#4a8bc4' },
  { name: '日落金', primary: '#d4a574', secondary: '#c49464' },
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
}

function ResetDataDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);
  if (!open) return null;
  const ok = confirmText === t('reset_confirm_text');
  return (
    <motion.div className="fixed inset-0 z-[200] flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div className="relative w-full max-w-sm rounded-[24px] p-6" style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.1)' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={28} style={{ color: '#ef4444' }} /></div>
          <p className="text-lg font-medium">{t('reset_title')}</p>
        </div>
        {step === 1 ? (
          <>
            <p className="text-sm text-center mb-4" style={{ color: '#a8a29e' }}>{t('reset_warning')}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: '#f0ece4' }} onClick={onClose}>{t('reset_cancel')}</button>
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }} onClick={() => setStep(2)}>{t('log_confirm')}</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-center mb-3" style={{ color: '#ef4444' }}>{t('reset_confirm')}</p>
            <p className="text-xs text-center mb-3" style={{ color: '#6b7280' }}>{t('reset_input_hint')}</p>
            <input type="text" className="w-full px-4 py-3 rounded-xl text-sm text-center outline-none mb-4" style={{ background: '#0f1419', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }} placeholder={t('reset_confirm_text')} value={confirmText} onChange={e => setConfirmText(e.target.value)} />
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: '#f0ece4' }} onClick={() => { setStep(1); setConfirmText(''); }}>{t('reset_cancel')}</button>
              <button className="flex-1 py-3 rounded-xl text-sm font-medium transition-all" style={{ background: ok ? '#ef4444' : 'rgba(239,68,68,0.1)', color: ok ? '#fff' : '#6b7280', cursor: ok ? 'pointer' : 'not-allowed' }} onClick={() => { if (ok) { onConfirm(); setStep(1); setConfirmText(''); } }}>{t('reset_button')}</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <AnimatePresence>{open && (
      <motion.div className="fixed inset-0 z-[200] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div className="relative w-full max-w-md rounded-t-[24px] p-6 pb-10" style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.08)' }} initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <p className="text-lg font-medium text-center mb-4">{title}</p>
          {children}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}

export default function ProfileTab({
  profile, records, periods, cycleStats, settings, cycleInfo,
  setProfileEditOpen, setEditName, setEditAvatar, setEditCycleLength, setEditPeriodLength,
  toggleSetting, exportCSV, setFeedbackOpen, toast, resetData, themeColor, setThemeColor,
}: ProfileTabProps) {
  const { t, locale, setLocale } = useI18n();
  const [resetOpen, setResetOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinStep, setPinStep] = useState<'set'|'confirm'>('set');
  const [firstPin, setFirstPin] = useState('');

  const cycleReg = (() => {
    if (cycleStats.cycleLengths.length < 2) return t('profile_insufficient');
    const avg = cycleStats.avgCycle;
    const v = cycleStats.cycleLengths.reduce((s, l) => s + Math.pow(l - avg, 2), 0) / cycleStats.cycleLengths.length;
    return Math.sqrt(v) <= 4 ? t('profile_regular') : t('profile_irregular');
  })();

  const shareWeChat = () => {
    if (navigator.share) { navigator.share({ title: 'Luna', text: '我在使用 Luna 经期追踪应用，推荐给你！', url: window.location.href }).catch(() => {}); }
    else { navigator.clipboard.writeText(`${window.location.href} - Luna 经期追踪`).then(() => toast({ description: '链接已复制，可分享给好友 📋' })).catch(() => toast({ description: '分享功能暂不可用' })); }
  };

  const handlePin = (d: string) => {
    if (pin.length < 4) {
      const np = pin + d;
      setPin(np);
      if (np.length === 4) {
        if (pinStep === 'set') { setFirstPin(np); setPin(''); setPinStep('confirm'); }
        else {
          if (np === firstPin) {
            try { localStorage.setItem('luna_pin', np); } catch {}
            toggleSetting('app_lock', settings.find(s => s.key === 'app_lock')?.value || 'false');
            toast({ description: t('lock_pin_set') }); setPin(''); setFirstPin(''); setPinStep('set'); setLockOpen(false);
          } else { toast({ description: t('lock_wrong_pin') }); setPin(''); setFirstPin(''); setPinStep('set'); }
        }
      }
    }
  };

  const appLockOn = settings.find(s => s.key === 'app_lock')?.value === 'true';

  return (
    <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="px-5 pt-12 pb-6">
      {/* User */}
      <StaggerIn delay={0.05}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: profile?.avatar ? 'transparent' : 'linear-gradient(135deg, #e07a5f, #81b29a)' }}>
            {profile?.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>{profile?.name?.charAt(0) || 'L'}</span>}
          </div>
          <div className="flex-1">
            <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{profile?.name || 'Luna'}</p>
            <p className="text-sm" style={{ color: '#a8a29e' }}>{t('profile_recorded_days')} {records.length} {t('common_days')} · {cycleStats.totalCycles} {t('profile_cycles')}</p>
          </div>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => { setEditName(profile?.name || 'Luna'); setEditAvatar(profile?.avatar || ''); setEditCycleLength(profile?.cycleLength || 28); setEditPeriodLength(profile?.periodLength || 5); setProfileEditOpen(true); }}><Target size={16} style={{ color: '#a8a29e' }} /></button>
        </div>
      </StaggerIn>

      {/* Health */}
      <StaggerIn delay={0.1}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-4">{t('profile_health')}</p>
          <div className="space-y-4">
            {[{ l: t('profile_avg_cycle'), v: `${cycleStats.avgCycle} ${t('common_days')}`, i: <TrendingUp size={16} style={{ color: '#81b29a' }} /> }, { l: t('profile_avg_period'), v: `${cycleStats.avgPeriod} ${t('common_days')}`, i: <Droplets size={16} style={{ color: '#e07a5f' }} /> }, { l: t('profile_last_period'), v: periods.length > 0 ? formatShortDate([...periods].sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate) : t('profile_no_record'), i: <Calendar size={16} style={{ color: '#d4a574' }} /> }, { l: t('profile_cycle_regular'), v: cycleReg, i: <Check size={16} style={{ color: cycleReg === t('profile_insufficient') ? '#6b7280' : '#81b29a' }} /> }].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2">{item.i}<span className="text-sm" style={{ color: '#a8a29e' }}>{item.l}</span></div><span className="text-sm font-medium" style={{ color: item.v === t('profile_insufficient') ? '#6b7280' : '#f0ece4' }}>{item.v}</span></div>
                {item.l === t('profile_cycle_regular') && item.v === t('profile_insufficient') && (
                  <p className="text-[11px] mt-1 ml-6" style={{ color: '#6b7280' }}>{t('profile_insufficient_tip')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </StaggerIn>

      {/* Reminders */}
      <StaggerIn delay={0.15}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_notification')}</p>
          {[{ key: 'period_reminder', icon: Bell, l: t('profile_period_reminder'), d: t('profile_period_reminder_desc') }, { key: 'record_reminder', icon: Clock, l: t('profile_record_reminder'), d: t('profile_record_reminder_desc') }, { key: 'ovulation_reminder', icon: Crosshair, l: t('profile_ovulation_reminder'), d: t('profile_ovulation_reminder_desc') }].map(item => {
            const s = settings.find(s => s.key === item.key); const on = s?.value === 'true';
            return (
              <div key={item.key} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={() => toggleSetting(item.key, s?.value || 'false')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}><item.icon size={20} style={{ color: '#a8a29e' }} /></div>
                <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: '#6b7280' }}>{item.d}</p></div>
                <div className="w-12 h-7 rounded-full relative transition-all duration-300" style={{ background: on ? '#e07a5f' : '#1a2027' }}><div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300" style={{ background: '#f0ece4', left: on ? '23px' : '3px' }} /></div>
              </div>
            );
          })}
        </div>
      </StaggerIn>

      {/* Privacy */}
      <StaggerIn delay={0.2}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_privacy')}</p>
          {[{ icon: Shield, l: t('profile_app_lock'), d: t('profile_app_lock_desc'), fn: () => setLockOpen(true) }, { icon: Eye, l: t('profile_privacy_mode'), d: t('profile_privacy_mode_desc'), fn: () => toast({ description: '隐私模式开发中' }) }, { icon: Lock, l: t('profile_data_encryption'), d: t('profile_data_encryption_desc'), fn: () => toast({ description: '数据加密开发中' }) }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}><item.icon size={20} style={{ color: '#a8a29e' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: '#6b7280' }}>{item.d}</p></div>
              <ChevronRight size={20} style={{ color: '#6b7280' }} />
            </div>
          ))}
        </div>
      </StaggerIn>

      {/* Appearance */}
      <StaggerIn delay={0.25}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_appearance')}</p>
          {[{ icon: Moon, l: t('profile_dark_mode'), d: t('profile_dark_mode_desc'), toggle: true, tk: 'dark_mode' }, { icon: Palette, l: t('profile_theme_color'), d: t('profile_theme_color_desc'), fn: () => setThemeOpen(true) }].map((item, i) => {
            const s = item.tk ? settings.find(s => s.key === item.tk) : null; const on = s?.value === 'true';
            return (
              <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={() => { if (item.tk) toggleSetting(item.tk, s?.value || 'false'); else item.fn?.(); }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}><item.icon size={20} style={{ color: '#a8a29e' }} /></div>
                <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: '#6b7280' }}>{item.d}</p></div>
                {item.toggle ? <div className="w-12 h-7 rounded-full relative transition-all duration-300" style={{ background: on ? '#e07a5f' : '#1a2027' }}><div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300" style={{ background: '#f0ece4', left: on ? '23px' : '3px' }} /></div> : <ChevronRight size={20} style={{ color: '#6b7280' }} />}
              </div>
            );
          })}
        </div>
      </StaggerIn>

      {/* Data */}
      <StaggerIn delay={0.3}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_data_management')}</p>
          {[{ icon: Download, l: t('profile_export_data'), d: t('profile_export_csv'), fn: exportCSV }, { icon: Share2, l: t('profile_export_wechat'), d: t('profile_export_wechat'), fn: shareWeChat }, { icon: Cloud, l: t('profile_cloud_sync'), d: t('profile_cloud_sync_desc'), fn: () => toast({ description: '云同步功能开发中' }) }, { icon: RotateCcw, l: t('profile_restore_data'), d: t('profile_restore_data_desc'), fn: () => toast({ description: '恢复数据功能开发中' }) }, { icon: Trash2, l: t('profile_reset_data'), d: t('profile_reset_data_desc'), fn: () => setResetOpen(true), danger: true }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}><item.icon size={20} style={{ color: item.danger ? '#ef4444' : '#a8a29e' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium" style={{ color: item.danger ? '#ef4444' : '#f0ece4' }}>{item.l}</p><p className="text-xs" style={{ color: '#6b7280' }}>{item.d}</p></div>
              <ChevronRight size={20} style={{ color: item.danger ? '#ef4444' : '#6b7280' }} />
            </div>
          ))}
        </div>
      </StaggerIn>

      {/* Other */}
      <StaggerIn delay={0.35}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium mb-3">{t('profile_other')}</p>
          {[{ icon: Globe, l: t('profile_language'), d: LOCALE_NAMES[locale], fn: () => setLangOpen(true) }, { icon: Info, l: t('profile_about'), d: t('profile_version'), fn: () => toast({ description: 'Luna v2.0.0 🌙' }) }, { icon: MessageSquare, l: t('profile_feedback'), d: t('profile_feedback_desc'), fn: () => setFeedbackOpen(true) }].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer active:scale-[0.98]" onClick={item.fn}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}><item.icon size={20} style={{ color: '#a8a29e' }} /></div>
              <div className="flex-1"><p className="text-[15px] font-medium">{item.l}</p><p className="text-xs" style={{ color: '#6b7280' }}>{item.d}</p></div>
              <ChevronRight size={20} style={{ color: '#6b7280' }} />
            </div>
          ))}
        </div>
      </StaggerIn>

      <div className="mt-4 text-center mb-4">
        <p className="text-xs" style={{ color: '#6b7280' }}>{t('profile_security_note1')}</p>
        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{t('profile_security_note2')}</p>
      </div>

      {/* Dialogs & Sheets */}
      <ResetDataDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => { resetData(); setResetOpen(false); }} />

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title={t('profile_language')}>
        <div className="space-y-2">
          {(['zh', 'en', 'ko'] as Locale[]).map(loc => (
            <button key={loc} className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]" style={{ background: locale === loc ? 'rgba(224,122,95,0.15)' : '#232b35', border: locale === loc ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)' }} onClick={() => { setLocale(loc); setLangOpen(false); }}>
              <span className="text-[15px] font-medium">{LOCALE_NAMES[loc]}</span>
              {locale === loc && <Check size={18} style={{ color: '#e07a5f' }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={themeOpen} onClose={() => setThemeOpen(false)} title={t('theme_title')}>
        <p className="text-xs mb-3" style={{ color: '#6b7280' }}>{t('theme_colors')}</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_COLORS.map(tc => (
            <button key={tc.primary} className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all" style={{ background: themeColor === tc.primary ? 'rgba(224,122,95,0.15)' : '#232b35', border: themeColor === tc.primary ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)' }} onClick={() => { setThemeColor(tc.primary); toast({ description: `${tc.name} ✨` }); }}>
              <div className="w-10 h-10 rounded-full" style={{ background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})` }} />
              <span className="text-xs">{tc.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={lockOpen} onClose={() => { setLockOpen(false); setPin(''); setFirstPin(''); setPinStep('set'); }} title={t('lock_title')}>
        <div className="text-center mb-4">
          <p className="text-xs" style={{ color: '#6b7280' }}>{pinStep === 'set' ? t('lock_set_pin') : t('lock_confirm_pin')}</p>
        </div>
        <div className="flex justify-center gap-4 mb-6">
          {[0,1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full transition-all" style={{ background: i < pin.length ? '#e07a5f' : 'rgba(255,255,255,0.1)' }} />)}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3,4,5,6,7,8,9].map(d => <button key={d} className="py-3.5 rounded-xl text-lg font-medium active:scale-95" style={{ background: '#232b35', color: '#f0ece4' }} onClick={() => handlePin(String(d))}>{d}</button>)}
          <div />
          <button className="py-3.5 rounded-xl text-lg font-medium active:scale-95" style={{ background: '#232b35', color: '#f0ece4' }} onClick={() => handlePin('0')}>0</button>
          <button className="py-3.5 rounded-xl text-sm font-medium active:scale-95" style={{ background: '#232b35', color: '#6b7280' }} onClick={() => setPin(pin.slice(0, -1))}>←</button>
        </div>
        {appLockOn && <button className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} onClick={() => { try { localStorage.removeItem('luna_pin'); } catch {} toggleSetting('app_lock', 'true'); toast({ description: t('lock_disabled') }); setLockOpen(false); }}>{t('lock_turn_off')}</button>}
      </BottomSheet>
    </motion.div>
  );
}

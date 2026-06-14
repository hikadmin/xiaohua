'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, TrendingUp, Droplets, Check, Bell, Clock, Crosshair,
  Shield, Eye, Lock, Moon, Sun, Download, Cloud, RotateCcw,
  Globe, Info, MessageSquare, ChevronRight, Target,
  ImagePlus, Trash2, Palette,
} from 'lucide-react';
import {
  StaggerIn, formatShortDate,
  type DailyRecord, type UserProfile, type Setting, type Period,
  type CycleStats, type CycleInfo,
} from './shared';
import { THEME_COLORS } from '@/lib/theme-store';

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
  wallpaper: string | null;
  themeColor: string;
  onWallpaperChange: (url: string | null) => void;
  onWallpaperCropRequest: (imageSrc: string) => void;
  onThemeColorChange: (color: string) => void;
  wallpaperInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ProfileTab({
  profile, records, periods, cycleStats, settings, cycleInfo,
  setProfileEditOpen, setEditName, setEditAvatar, setEditCycleLength, setEditPeriodLength,
  toggleSetting, exportCSV, setFeedbackOpen, toast,
  wallpaper, themeColor, onWallpaperChange, onWallpaperCropRequest, onThemeColorChange, wallpaperInputRef,
}: ProfileTabProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  function handleWallpaperUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ description: '壁纸图片大小不能超过10MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Open cropper for wallpaper
      onWallpaperCropRequest(result);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  }

  function removeWallpaper() {
    onWallpaperChange(null);
    toast({ description: '壁纸已移除' });
  }

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="px-5 pt-12 pb-6"
    >
      {/* Hidden wallpaper file input */}
      <input
        type="file"
        ref={wallpaperInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleWallpaperUpload}
      />

      {/* User Info */}
      <StaggerIn delay={0.05}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: profile?.avatar ? 'transparent' : `linear-gradient(135deg, ${themeColor}, #81b29a)` }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>
                {profile?.name?.charAt(0) || 'L'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{profile?.name || '小桦'}</p>
            <p className="text-sm" style={{ color: '#a8a29e' }}>已记录 {records.length} 天 · {cycleStats.totalCycles} 个周期</p>
          </div>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => {
              setEditName(profile?.name || '小桦');
              setEditAvatar(profile?.avatar || '');
              setEditCycleLength(profile?.cycleLength || 28);
              setEditPeriodLength(profile?.periodLength || 5);
              setProfileEditOpen(true);
            }}>
            <Target size={16} style={{ color: '#a8a29e' }} />
          </button>
        </div>
      </StaggerIn>

      {/* Health Profile */}
      <StaggerIn delay={0.1}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
          <p className="text-sm font-medium mb-4">健康档案</p>
          <div className="space-y-4">
            {[
              { label: '平均周期', value: `${cycleStats.avgCycle} 天`, icon: <TrendingUp size={16} style={{ color: '#81b29a' }} /> },
              { label: '平均经期', value: `${cycleStats.avgPeriod} 天`, icon: <Droplets size={16} style={{ color: themeColor }} /> },
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
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
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
                  style={{ background: isActive ? themeColor : '#1a2027' }}>
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
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
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
                    style={{ background: isActive ? themeColor : '#1a2027' }}>
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

      {/* ============ Appearance - Enhanced ============ */}
      <StaggerIn delay={0.25}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
          <p className="text-sm font-medium mb-3">外观主题</p>

          {/* Dark mode toggle */}
          {(() => {
            const darkModeSetting = settings.find(s => s.key === 'dark_mode');
            const isDarkActive = darkModeSetting?.value === 'true';
            return (
              <div className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
                onClick={() => toggleSetting('dark_mode', darkModeSetting?.value || 'false')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
                  <Moon size={20} style={{ color: '#a8a29e' }} />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium">深色模式</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>保护眼睛，节省电量</p>
                </div>
                <div className="w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300"
                  style={{ background: isDarkActive ? themeColor : '#1a2027' }}>
                  <div className="absolute w-[22px] h-[22px] rounded-full top-[3px] transition-all duration-300"
                    style={{ background: '#f0ece4', left: isDarkActive ? '23px' : '3px' }} />
                </div>
              </div>
            );
          })()}

          {/* Theme Color */}
          <div
            className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
              <Palette size={20} style={{ color: '#a8a29e' }} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium">主题颜色</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>自定义界面配色</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full" style={{ background: themeColor, boxShadow: `0 0 8px ${themeColor}60` }} />
              <ChevronRight size={20} style={{ color: '#6b7280', transform: showColorPicker ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {/* Color picker panel */}
          {showColorPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-3 px-1">
                <div className="grid grid-cols-4 gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all active:scale-95"
                      style={{
                        background: themeColor === color.value ? `${color.value}20` : 'transparent',
                        border: themeColor === color.value ? `1.5px solid ${color.value}` : '1.5px solid transparent',
                      }}
                      onClick={() => {
                        onThemeColorChange(color.value);
                        toast({ description: `主题颜色已切换为${color.name}` });
                      }}
                    >
                      <div className="w-8 h-8 rounded-full transition-all"
                        style={{
                          background: color.gradient,
                          boxShadow: themeColor === color.value ? `0 0 12px ${color.value}60` : 'none',
                        }} />
                      <span className="text-[10px] font-medium" style={{ color: themeColor === color.value ? color.value : '#a8a29e' }}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Wallpaper */}
          <div
            className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
            onClick={() => wallpaperInputRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a2027' }}>
              <ImagePlus size={20} style={{ color: '#a8a29e' }} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium">自定义壁纸</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                {wallpaper ? '点击更换壁纸' : '上传一张图片作为背景'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {wallpaper && (
                <div className="w-8 h-8 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <img src={wallpaper} alt="壁纸预览" className="w-full h-full object-cover" />
                </div>
              )}
              <ChevronRight size={20} style={{ color: '#6b7280' }} />
            </div>
          </div>

          {/* Remove wallpaper button */}
          {wallpaper && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pl-[58px]"
            >
              <button
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs transition-all active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                onClick={(e) => { e.stopPropagation(); removeWallpaper(); }}
              >
                <Trash2 size={12} />
                移除壁纸
              </button>
            </motion.div>
          )}
        </div>
      </StaggerIn>

      {/* Data Management */}
      <StaggerIn delay={0.3}>
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
          <p className="text-sm font-medium mb-3">数据管理</p>
          {[
            { icon: Download, label: '导出数据', desc: '导出为 CSV', action: () => exportCSV() },
            { icon: Cloud, label: '云同步', desc: '连接云端备份', action: () => toast({ description: '云同步功能开发中' }) },
            { icon: RotateCcw, label: '恢复数据', desc: '从备份恢复', action: () => toast({ description: '恢复数据功能开发中' }) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
              onClick={item.action}>
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
        <div className="rounded-[20px] p-5 mb-4" style={{ background: 'rgba(35,43,53,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
          <p className="text-sm font-medium mb-3">其他</p>
          {[
            { icon: Globe, label: '语言', desc: '简体中文', action: () => toast({ description: '语言设置功能开发中' }) },
            { icon: Info, label: '关于我们', desc: '版本 1.0.0', action: () => toast({ description: '关于我们功能开发中' }) },
            { icon: MessageSquare, label: '意见反馈', desc: '帮助我们改进', action: () => setFeedbackOpen(true) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 cursor-pointer transition-all active:scale-[0.98]"
              onClick={item.action}>
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
  );
}

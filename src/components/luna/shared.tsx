import React from 'react';
import { motion } from 'framer-motion';

// ============ Types ============
export interface Period {
  id: string;
  startDate: string;
  endDate: string | null;
}

export interface DailyRecord {
  id: string;
  date: string;
  flow: number;
  mood: number;
  symptoms: string;
  note: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}

export type TabPage = 'home' | 'calendar' | 'log' | 'profile';

export interface CycleInfo {
  phase: string;
  phaseDay: number;
  daysUntilNext: number;
  cycleLength: number;
  periodLength: number;
  nextPeriodDate: Date | null;
  lastPeriodStart: string | null;
}

export interface CycleStats {
  avgCycle: number;
  avgPeriod: number;
  totalCycles: number;
  cycleLengths: number[];
  periodLengths: number[];
}

export interface PeriodInfoResult {
  isPeriod: boolean;
  isStart: boolean;
  isEnd: boolean;
  isActive: boolean;
}

export interface CalendarDay {
  day: number;
  dateStr: string;
  isToday: boolean;
  isOtherMonth: boolean;
  periodInfo: PeriodInfoResult;
  isPredicted: boolean;
  isFertile: boolean;
}

// ============ Constants ============
export const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];
export const WEEKDAYS_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const FLOW_LABELS = ['', '点滴', '少量', '中等', '大量'];
export const MOOD_LABELS = ['', '开心', '平静', '害羞', '低落', '烦躁', '焦虑'];
export const MOOD_EMOJIS = ['', '😊', '😌', '😳', '😔', '😤', '😰'];
export const DEFAULT_SYMPTOMS = ['痛经', '腰酸', '头痛', '疲劳', '腹胀', '乳房胀痛'];
export const FEEDBACK_CATEGORIES = ['功能建议', '问题反馈', '体验优化', '其他'];

export const PHASE_INFO: Record<string, { name: string; desc: string; tip: string; color: string; icon: string }> = {
  period: { name: '经期', desc: '休养期', tip: '注意保暖休息，避免剧烈运动', color: '#e07a5f', icon: '🩸' },
  follicular: { name: '卵泡期', desc: '能量回升期', tip: '雌激素水平上升，适合进行高强度运动和创造性工作', color: '#81b29a', icon: '🌱' },
  ovulation: { name: '排卵期', desc: '高峰期', tip: '精力充沛，社交能力和创造力最佳', color: '#d4a574', icon: '✨' },
  luteal: { name: '黄体期', desc: '平缓期', tip: '注意情绪波动，适合轻度运动和放松', color: '#f2cc8f', icon: '🌙' },
};

// Precomputed tick marks for cycle ring (avoid hydration mismatch from floating-point)
export const RING_TICK_MARKS = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * 360;
  const rad = (angle * Math.PI) / 180;
  return {
    x1: +(120 + 105 * Math.cos(rad)).toFixed(2),
    y1: +(120 + 105 * Math.sin(rad)).toFixed(2),
    x2: +(120 + 98 * Math.cos(rad)).toFixed(2),
    y2: +(120 + 98 * Math.sin(rad)).toFixed(2),
  };
});

// Daily health tips by phase
export const DAILY_TIPS: Record<string, string[]> = {
  period: [
    '🧣 今天适合穿暖色衣服，给自己温暖的呵护',
    '🍵 喝一杯红糖姜茶，温暖整个身体',
    '🛁 温水泡脚15分钟，缓解经期不适',
    '😴 早睡1小时，让身体充分休息',
    '🧘 轻柔的冥想呼吸，帮助放松身心',
  ],
  follicular: [
    '🏃 今天精力充沛，适合进行高强度运动',
    '🎨 创造力高峰期，尝试新的创意活动',
    '🥗 多吃富含铁质的食物，补充流失营养',
    '💪 体力和耐力提升，挑战新的运动目标',
    '📚 学习效率最佳，适合阅读和思考',
  ],
  ovulation: [
    '✨ 社交能力最佳，适合与朋友聚会',
    '💝 自信魅力高峰，适合重要约会和演讲',
    '🥑 补充健康脂肪，维持激素平衡',
    '🎯 注意力集中，处理重要工作',
    '🌟 魅力四射的一天，展现最好的自己',
  ],
  luteal: [
    '🧘 瑜伽和拉伸运动，缓解身体不适',
    '🍫 适量吃些黑巧克力，提升心情',
    '📝 记录情绪变化，更好地了解自己',
    '🎵 听舒缓的音乐，放松紧张情绪',
    '🌿 补充镁和维生素B6，稳定情绪',
  ],
};

// ============ Utility Functions ============
export function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateChinese(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS_FULL[date.getDay()]}`;
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

export function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============ Stagger animation wrapper ============
export function StaggerIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

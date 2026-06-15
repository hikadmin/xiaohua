// ============ 本地数据库层 — Dexie.js + IndexedDB ============
// 用于 Capacitor/Android APK 离线运行
// 替代后端 SQLite 数据库，数据存储在浏览器 IndexedDB 中

import Dexie, { type Table } from 'dexie';

// ---- 数据模型 ----

export interface LocalPeriod {
  id: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDailyRecord {
  id: string;
  date: string;
  flow: number;
  mood: number;
  symptoms: string; // JSON string of string[]
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUserProfile {
  id: string;
  name: string;
  avatar: string;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSetting {
  id: string;
  key: string;
  value: string;
}

export interface LocalFeedback {
  id: string;
  category: string;
  content: string;
  contact: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Database ----

class LunaDatabase extends Dexie {
  periods!: Table<LocalPeriod, string>;
  records!: Table<LocalDailyRecord, string>;
  profile!: Table<LocalUserProfile, string>;
  settings!: Table<LocalSetting, string>;
  feedback!: Table<LocalFeedback, string>;

  constructor() {
    super('LunaPeriodTracker');

    this.version(1).stores({
      periods: 'id, startDate, endDate',
      records: 'id, date, flow, mood',
      profile: 'id',
      settings: 'id, key',
      feedback: 'id, category, createdAt',
    });
  }
}

// 单例数据库实例
export const db = new LunaDatabase();

// ============ 工具函数 ============

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function dateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

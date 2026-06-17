// ============ 本地 API 实现 — IndexedDB 存储后端 ============
// 用于 Capacitor/Android APK 离线运行
// 完整实现所有 API 端点，数据存储在 IndexedDB 中

import { db, generateId, nowISO, dateStr } from './local-db';
import type {
  PeriodItem,
  CreatePeriodRequest,
  UpdatePeriodRequest,
  DailyRecordItem,
  CreateRecordRequest,
  UpdateRecordRequest,
  UserProfileItem,
  UpdateProfileRequest,
  SettingItem,
  UpdateSettingRequest,
  BatchUpdateSettingsRequest,
  FeedbackItem,
  CreateFeedbackRequest,
  CycleStatsResponse,
  CalendarMonthResponse,
  CalendarDayResponse,
  ExportDataResponse,
} from '@/lib/api/types';

// ============ Periods API ============

export const localPeriodsApi = {
  async getAll(): Promise<PeriodItem[]> {
    return db.periods.orderBy('startDate').reverse().toArray();
  },

  async create(data: CreatePeriodRequest): Promise<PeriodItem> {
    const now = nowISO();
    const item: PeriodItem = {
      id: generateId(),
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.periods.add(item);
    return item;
  },

  async update(id: string, data: UpdatePeriodRequest): Promise<PeriodItem> {
    const existing = await db.periods.get(id);
    if (!existing) throw new Error('经期记录不存在');
    const updated: PeriodItem = {
      ...existing,
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      updatedAt: nowISO(),
    };
    await db.periods.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const existing = await db.periods.get(id);
    if (!existing) throw new Error('经期记录不存在');
    await db.periods.delete(id);
  },
};

// ============ Records API ============

export const localRecordsApi = {
  async getAll(): Promise<DailyRecordItem[]> {
    return db.records.orderBy('date').reverse().toArray();
  },

  async upsert(data: CreateRecordRequest): Promise<DailyRecordItem> {
    const existing = await db.records.where('date').equals(data.date).first();
    const now = nowISO();
    const symptoms = typeof data.symptoms === 'string'
      ? data.symptoms
      : JSON.stringify(data.symptoms || []);

    if (existing) {
      const updated: DailyRecordItem = {
        ...existing,
        flow: data.flow ?? existing.flow,
        mood: data.mood ?? existing.mood,
        symptoms,
        note: data.note ?? existing.note,
        updatedAt: now,
      };
      await db.records.put(updated);
      return updated;
    }

    const item: DailyRecordItem = {
      id: generateId(),
      date: data.date,
      flow: data.flow ?? 0,
      mood: data.mood ?? 0,
      symptoms,
      note: data.note ?? '',
      createdAt: now,
      updatedAt: now,
    };
    await db.records.add(item);
    return item;
  },

  async getByDate(date: string): Promise<DailyRecordItem> {
    const record = await db.records.where('date').equals(date).first();
    if (!record) throw new Error('未找到该日期的记录');
    return record;
  },

  async updateByDate(date: string, data: UpdateRecordRequest): Promise<DailyRecordItem> {
    const existing = await db.records.where('date').equals(date).first();
    if (!existing) throw new Error('未找到该日期的记录');
    const symptoms = typeof data.symptoms === 'string'
      ? data.symptoms
      : data.symptoms !== undefined
        ? JSON.stringify(data.symptoms)
        : existing.symptoms;
    const updated: DailyRecordItem = {
      ...existing,
      ...(data.flow !== undefined && { flow: data.flow }),
      ...(data.mood !== undefined && { mood: data.mood }),
      symptoms,
      ...(data.note !== undefined && { note: data.note }),
      updatedAt: nowISO(),
    };
    await db.records.put(updated);
    return updated;
  },

  async deleteByDate(date: string): Promise<void> {
    const existing = await db.records.where('date').equals(date).first();
    if (!existing) throw new Error('未找到该日期的记录');
    await db.records.delete(existing.id);
  },
};

// ============ Profile API ============

export const localProfileApi = {
  async get(): Promise<UserProfileItem> {
    let profile = await db.profile.toCollection().first();
    if (!profile) {
      // Auto-create default profile
      const now = nowISO();
      profile = {
        id: generateId(),
        name: '小桦',
        avatar: '',
        cycleLength: 28,
        periodLength: 5,
        lastPeriodStart: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.profile.add(profile);
    }
    return profile;
  },

  async update(data: UpdateProfileRequest): Promise<UserProfileItem> {
    const profile = await localProfileApi.get();
    const updated: UserProfileItem = {
      ...profile,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.cycleLength !== undefined && { cycleLength: data.cycleLength }),
      ...(data.periodLength !== undefined && { periodLength: data.periodLength }),
      ...(data.lastPeriodStart !== undefined && { lastPeriodStart: data.lastPeriodStart }),
      updatedAt: nowISO(),
    };
    await db.profile.put(updated);
    return updated;
  },
};

// ============ Settings API ============

export const localSettingsApi = {
  async getAll(): Promise<SettingItem[]> {
    return db.settings.toArray();
  },

  async update(data: UpdateSettingRequest): Promise<SettingItem> {
    const existing = await db.settings.where('key').equals(data.key).first();
    if (existing) {
      const updated: SettingItem = { ...existing, value: data.value };
      await db.settings.put(updated);
      return updated;
    }
    const item: SettingItem = { id: generateId(), key: data.key, value: data.value };
    await db.settings.add(item);
    return item;
  },

  async batchUpdate(data: BatchUpdateSettingsRequest): Promise<void> {
    await db.transaction('rw', db.settings, async () => {
      for (const s of data.settings) {
        const existing = await db.settings.where('key').equals(s.key).first();
        if (existing) {
          await db.settings.put({ ...existing, value: s.value });
        } else {
          await db.settings.add({ id: generateId(), key: s.key, value: s.value });
        }
      }
    });
  },
};

// ============ Feedback API ============

export const localFeedbackApi = {
  async getAll(): Promise<FeedbackItem[]> {
    return db.feedback.orderBy('createdAt').reverse().toArray();
  },

  async create(data: CreateFeedbackRequest): Promise<FeedbackItem> {
    const now = nowISO();
    const item: FeedbackItem = {
      id: generateId(),
      category: data.category || '其他',
      content: data.content,
      contact: data.contact || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await db.feedback.add(item);
    return item;
  },
};

// ============ Statistics ============

function parseDateLocal(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function daysBetweenLocal(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export async function localGetCycleStats(): Promise<CycleStatsResponse> {
  const periods = await db.periods.orderBy('startDate').toArray();
  const profile = await localProfileApi.get();
  const records = await db.records.toArray();

  const cycleLengths: number[] = [];
  const periodLengths: number[] = [];

  for (let i = 1; i < periods.length; i++) {
    if (periods[i].endDate) {
      const cycleLen = daysBetweenLocal(parseDateLocal(periods[i - 1].startDate), parseDateLocal(periods[i].startDate));
      if (cycleLen > 15 && cycleLen < 50) cycleLengths.push(cycleLen);
    }
    if (periods[i].endDate) {
      const periodLen = daysBetweenLocal(parseDateLocal(periods[i].startDate), parseDateLocal(periods[i].endDate!)) + 1;
      if (periodLen > 0 && periodLen < 15) periodLengths.push(periodLen);
    }
  }

  const avgCycle = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : profile.cycleLength;
  const avgPeriod = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : profile.periodLength;

  // Cycle regularity
  let cycleRegularity: 'regular' | 'irregular' | 'insufficient_data' = 'insufficient_data';
  if (cycleLengths.length >= 3) {
    const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycle, 2), 0) / cycleLengths.length;
    cycleRegularity = Math.sqrt(variance) <= 4 ? 'regular' : 'irregular';
  }

  // Consecutive record days
  const today = dateStr(new Date());
  const sortedDates = records.map(r => r.date).sort().reverse();
  let consecutiveRecordDays = 0;
  if (sortedDates.length > 0) {
    let checkDate = new Date();
    if (sortedDates[0] === today) {
      consecutiveRecordDays = 1;
      for (let i = 1; i < 365; i++) {
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - i);
        const prevDateStr = dateStr(prevDate);
        if (sortedDates.includes(prevDateStr)) {
          consecutiveRecordDays++;
        } else {
          break;
        }
      }
    }
  }

  return {
    avgCycle,
    avgPeriod,
    totalCycles: periods.length,
    cycleLengths,
    periodLengths,
    cycleRegularity,
    consecutiveRecordDays,
  };
}

// ============ Calendar ============

export async function localGetCalendarMonth(year: number, month: number): Promise<CalendarMonthResponse> {
  const periods = await db.periods.orderBy('startDate').toArray();
  const profile = await localProfileApi.get();

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const todayStr = dateStr(new Date());

  // Predicted period days
  const predictedDays: string[] = [];
  const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastPeriod = sortedPeriods[0];
  if (lastPeriod?.endDate) {
    const lastEnd = parseDateLocal(lastPeriod.endDate);
    const nextStart = new Date(lastEnd);
    nextStart.setDate(nextStart.getDate() + (profile.cycleLength - profile.periodLength + 1));
    for (let i = 0; i < profile.periodLength; i++) {
      const d = new Date(nextStart);
      d.setDate(d.getDate() + i);
      predictedDays.push(dateStr(d));
    }
  }

  // Fertile days
  const fertileDays: string[] = [];
  if (lastPeriod) {
    const lastStart = parseDateLocal(lastPeriod.startDate);
    const ovulationDay = new Date(lastStart);
    ovulationDay.setDate(ovulationDay.getDate() + (profile.cycleLength - 14));
    for (let i = -4; i <= 1; i++) {
      const d = new Date(ovulationDay);
      d.setDate(d.getDate() + i);
      fertileDays.push(dateStr(d));
    }
  }

  function getPeriodInfo(ds: string) {
    let isPeriod = false, isStart = false, isEnd = false, isActive = false;
    for (const period of periods) {
      if (period.startDate && !period.endDate) {
        if (ds === period.startDate) {
          isPeriod = true; isStart = true; isEnd = true; isActive = true;
          break;
        }
        const startD = parseDateLocal(period.startDate);
        const checkD = parseDateLocal(ds);
        if (checkD > startD && checkD <= new Date()) {
          isPeriod = true; isActive = true;
          break;
        }
      } else if (period.startDate && period.endDate) {
        if (ds >= period.startDate && ds <= period.endDate) {
          isPeriod = true;
          if (ds === period.startDate) isStart = true;
          if (ds === period.endDate) isEnd = true;
          break;
        }
      }
    }
    return { isPeriod, isStart, isEnd, isActive };
  }

  const days: CalendarDayResponse[] = [];

  // Empty days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      day: 0, dateStr: '', isToday: false, isOtherMonth: true,
      periodInfo: { isPeriod: false, isStart: false, isEnd: false, isActive: false },
      isPredicted: false, isFertile: false,
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const periodInfo = getPeriodInfo(ds);
    const isPredicted = predictedDays.includes(ds) && !periodInfo.isPeriod;
    const isFertile = fertileDays.includes(ds) && !periodInfo.isPeriod && !isPredicted;
    days.push({
      day, dateStr: ds, isToday: ds === todayStr, isOtherMonth: false,
      periodInfo, isPredicted, isFertile,
    });
  }

  // Period history
  const periodHistory = sortedPeriods.slice(0, 10).map(p => {
    const startD = parseDateLocal(p.startDate);
    const endD = p.endDate ? parseDateLocal(p.endDate) : null;
    const len = endD ? daysBetweenLocal(startD, endD) + 1 : '进行中';
    return { id: p.id, startDate: p.startDate, endDate: p.endDate, length: len };
  });

  return { year, month, days, periodHistory };
}

// ============ Export ============

export async function localExportData(): Promise<ExportDataResponse> {
  const [records, periods, profile] = await Promise.all([
    db.records.toArray(),
    db.periods.orderBy('startDate').reverse().toArray(),
    localProfileApi.get(),
  ]);

  return {
    records,
    periods,
    profile,
    exportedAt: nowISO(),
  };
}

// ============ Dashboard ============

export async function localGetDashboard(): Promise<import('@/lib/api/types').DashboardResponse> {
  const [stats, records] = await Promise.all([localGetCycleStats(), db.records.orderBy('date').reverse().toArray()]);
  const profile = await localProfileApi.get();
  const periods = await db.periods.orderBy('startDate').reverse().toArray();

  const lastPeriod = periods[0];
  const cycleLength = profile.cycleLength;
  const periodLength = profile.periodLength;
  let phase = 'follicular';
  let phaseDay = 1;
  let daysUntilNext = cycleLength;

  if (lastPeriod) {
    const lastStart = parseDateLocal(lastPeriod.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysSinceStart = daysBetweenLocal(lastStart, now);
    const dayInCycle = (daysSinceStart % cycleLength) + 1;
    daysUntilNext = Math.max(0, daysBetweenLocal(now, new Date(lastStart.getTime() + cycleLength * 86400000)));

    if (dayInCycle <= periodLength) phase = 'period';
    else if (dayInCycle <= 13) phase = 'follicular';
    else if (dayInCycle <= 16) phase = 'ovulation';
    else phase = 'luteal';
    phaseDay = dayInCycle;
  }

  const DAILY_TIPS: Record<string, string[]> = {
    period: ['注意保暖休息，避免剧烈运动', '喝一杯红糖姜茶', '温水泡脚15分钟'],
    follicular: ['精力充沛，适合运动', '多吃富含铁质的食物', '学习效率最佳'],
    ovulation: ['社交能力最佳', '注意力集中', '魅力四射的一天'],
    luteal: ['瑜伽和拉伸运动', '适量吃些黑巧克力', '听舒缓的音乐'],
  };

  const tips = DAILY_TIPS[phase] || DAILY_TIPS.follicular;
  const tipIndex = (new Date().getDate()) % tips.length;

  return {
    cycleInfo: {
      phase,
      phaseDay,
      daysUntilNext,
      cycleLength,
      periodLength,
      nextPeriodDate: null,
      lastPeriodStart: lastPeriod?.startDate || null,
      predictedPeriodDays: [],
      fertileDays: [],
    },
    cycleStats: stats,
    recentRecords: records.slice(0, 5),
    dailyTip: { phase, tip: tips[tipIndex], index: tipIndex },
  };
}

// ============ Seed ============

// ============================================================
// 数据管理规范（必须严格遵守）
// ============================================================
// 规范1 - 新用户数据初始化规则：
//   首次安装的用户，数据库中不存在任何历史数据记录。
//   系统自动创建全新的用户数据档案，确保与其他用户数据完全隔离。
//   仅创建默认资料和设置项，不创建任何示例业务数据。
//
// 规范2 - 版本更新数据保护机制：
//   从旧版本更新至新版本时，严格执行数据保护策略，
//   所有现有用户数据（账户信息、历史操作记录、系统配置、
//   本地存储数据及云端同步数据）不被覆盖、删除或修改。
//   仅补充新增设置项，不修改已有设置值。
//   更新完成后需验证数据完整性。
// ============================================================

const APP_VERSION = 2; // 数据版本号，版本更新时递增

export async function localSeedData(): Promise<unknown> {
  const now = nowISO();

  // 1. 检查是否已有数据（版本更新保护：已有数据时绝不清除）
  const existingProfile = await db.profile.toCollection().first();
  const existingPeriodCount = await db.periods.count();
  const existingRecordCount = await db.records.count();
  const hasExistingData = existingProfile || existingPeriodCount > 0 || existingRecordCount > 0;

  // 2. 检查数据版本号，决定是否需要迁移
  const versionSetting = await db.settings.where('key').equals('app_data_version').first();
  const currentDataVersion = versionSetting ? parseInt(versionSetting.value, 10) : 0;

  if (hasExistingData && currentDataVersion >= APP_VERSION) {
    return { seeded: false, reason: 'already_initialized', version: currentDataVersion };
  }

  // 3. 首次安装：只创建默认 profile 和 settings，不创建任何示例数据
  if (!existingProfile) {
    await db.profile.add({
      id: generateId(),
      name: '小桦',
      avatar: '',
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4. 确保默认 settings 存在（不清除已有设置，只补充缺失的）
  const defaultSettings = [
    { key: 'period_reminder', value: 'true' },
    { key: 'record_reminder', value: 'true' },
    { key: 'ovulation_reminder', value: 'false' },
    { key: 'app_lock', value: 'false' },
    { key: 'dark_mode', value: 'true' },
  ];
  for (const s of defaultSettings) {
    const existing = await db.settings.where('key').equals(s.key).first();
    if (!existing) {
      await db.settings.add({ id: generateId(), key: s.key, value: s.value });
    }
  }

  // 5. 记录/更新数据版本号
  if (versionSetting) {
    await db.settings.put({ ...versionSetting, value: String(APP_VERSION) });
  } else {
    await db.settings.add({ id: generateId(), key: 'app_data_version', value: String(APP_VERSION) });
  }

  return { seeded: true, version: APP_VERSION, isNewInstall: !hasExistingData };
}

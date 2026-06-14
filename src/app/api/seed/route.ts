import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { success, serverError } from '@/lib/api/response'

const APP_DATA_VERSION = 2

// POST /api/seed - 初始化默认数据（首次安装）
// 重要：
// 1. 首次安装只创建默认 profile + settings，不创建任何示例经期/记录
// 2. 版本更新时绝不清除已有数据，只补充缺失的设置
export async function POST() {
  try {
    // 1. 检查是否已有数据
    const existingProfile = await db.userProfile.findFirst()
    const existingPeriodCount = await db.period.count()
    const existingRecordCount = await db.dailyRecord.count()
    const hasExistingData = existingProfile || existingPeriodCount > 0 || existingRecordCount > 0

    // 2. 检查数据版本号
    const versionSetting = await db.setting.findUnique({ where: { key: 'app_data_version' } })
    const currentDataVersion = versionSetting ? parseInt(versionSetting.value, 10) : 0

    if (hasExistingData && currentDataVersion >= APP_DATA_VERSION) {
      return success({ initialized: true, version: currentDataVersion }, '数据已初始化，无需重复操作')
    }

    // 3. 首次安装：只创建默认 profile（lastPeriodStart 为 null）
    if (!existingProfile) {
      await db.userProfile.create({
        data: {
          name: '小桦',
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: null,
        },
      })
    }

    // 4. 确保默认 settings 存在（不清除已有设置，只补充缺失的）
    const defaultSettings = [
      { key: 'period_reminder', value: 'true' },
      { key: 'record_reminder', value: 'true' },
      { key: 'ovulation_reminder', value: 'false' },
      { key: 'app_lock', value: 'false' },
      { key: 'dark_mode', value: 'true' },
    ]

    for (const setting of defaultSettings) {
      const existing = await db.setting.findUnique({ where: { key: setting.key } })
      if (!existing) {
        await db.setting.create({ data: setting })
      }
    }

    // 5. 记录/更新数据版本号
    if (versionSetting) {
      await db.setting.update({ where: { key: 'app_data_version' }, data: { value: String(APP_DATA_VERSION) } })
    } else {
      await db.setting.create({ data: { key: 'app_data_version', value: String(APP_DATA_VERSION) } })
    }

    return success({
      initialized: true,
      version: APP_DATA_VERSION,
      isNewInstall: !hasExistingData,
    }, hasExistingData ? '数据迁移完成' : '首次安装初始化完成')
  } catch (error) {
    console.error('Failed to initialize data:', error)
    return serverError('初始化数据失败')
  }
}

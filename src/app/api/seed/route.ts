import { db } from '@/lib/db'
import { success, serverError } from '@/lib/api/response'

const APP_VERSION = 2

// POST /api/seed - 初始化应用数据
// 首次安装：仅创建默认资料和设置，不创建示例数据
// 版本更新：仅补充新增设置项，不覆盖已有数据
export async function POST() {
  try {
    // 创建默认用户资料（仅首次，已有则跳过）
    let profile = await db.userProfile.findFirst()
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: '小桦',
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: null,
        },
      })
    }

    // 确保默认设置存在（仅创建不存在的设置项，不覆盖已有值）
    const defaultSettings = [
      { key: 'period_reminder', value: 'true' },
      { key: 'record_reminder', value: 'true' },
      { key: 'ovulation_reminder', value: 'false' },
      { key: 'app_lock', value: 'false' },
      { key: 'dark_mode', value: 'true' },
      { key: 'app_version', value: String(APP_VERSION) },
    ]

    for (const setting of defaultSettings) {
      const existing = await db.setting.findUnique({
        where: { key: setting.key },
      })
      if (!existing) {
        await db.setting.create({ data: setting })
      }
    }

    // 版本迁移：检查版本号，如有新增设置项在此补充
    const versionSetting = await db.setting.findUnique({ where: { key: 'app_version' } })
    const currentVersion = versionSetting ? parseInt(versionSetting.value) : 1

    if (currentVersion < APP_VERSION) {
      // 未来版本迁移逻辑可在此扩展
      // 例如：if (currentVersion < 3) { 新增设置项... }
      await db.setting.upsert({
        where: { key: 'app_version' },
        update: { value: String(APP_VERSION) },
        create: { key: 'app_version', value: String(APP_VERSION) },
      })
    }

    return success({
      profile: profile ? '用户资料已就绪' : '默认资料已创建',
      settings: '默认设置已就绪',
      version: APP_VERSION,
    }, '应用初始化成功')
  } catch (error) {
    console.error('Failed to initialize app:', error)
    return serverError('应用初始化失败')
  }
}

import { db } from '@/lib/db'
import { success, serverError } from '@/lib/api/response'

const APP_VERSION = 2

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

// POST /api/seed - 初始化应用数据
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

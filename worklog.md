# Work Log — Luna Period Tracker 功能优化

---
Task ID: 1
Agent: Main
Task: 修复构建错误 + 拉取GitHub代码 + 功能优化

Work Log:
- 从 GitHub 拉取最新代码覆盖本地项目 (git reset --hard origin/main)
- 修复 `Module not found: Can't resolve './local-api'` 构建错误
  - 原因: local-api.ts 依赖 Dexie (IndexedDB)，是浏览器专用模块，SSR 环境无法加载
  - 解决: 将 `import { ... } from './local-api'` 静态导入改为 `import('./local-api')` 动态导入
  - 所有 API 方法改为 async，通过 getLocalApi() 按需加载
- 创建 i18n 国际化系统
  - `src/lib/i18n/translations.ts`: 中文/英文/韩语完整翻译表
  - `src/lib/i18n/context.tsx`: I18nProvider + useI18n hook，使用 useSyncExternalStore 读取 localStorage
  - `src/lib/i18n/index.ts`: 导出入口
- 更新 `layout.tsx`: 包裹 I18nProvider
- 增强 LogTab 记录页
  - 日历选择器: 可选择过去或未来的日期进行记录
  - 编辑模式: 选择已有记录的日期自动进入编辑模式
  - 年/月筛选: 历史记录支持按年份和月份筛选
  - 搜索功能: 支持按日期、症状、备注、情绪搜索记录
  - 编辑按钮: 每条历史记录添加编辑和删除按钮
- 增强 ProfileTab 我的页面
  - 语言切换: 新增简体中文/English/한국어 三语切换，全局生效
  - 重置数据: 两步确认流程，需输入确认文字防止误触
  - 导出微信: Web Share API 分享，降级为复制链接
  - 主题颜色: 6种配色选择（暖橙/薄荷绿/樱花粉/星空紫/海洋蓝/日落金），全局生效
  - 应用锁: PIN码设置/确认/关闭功能，支持Android端
- 更新 page.tsx
  - 新增 selectedDate/editingDate 状态用于日历选择和编辑
  - 新增 themeColor 状态用于全局主题色
  - 新增 saveRecordForDate/updateRecord 方法
  - 新增 resetData 方法用于数据重置
  - 底部导航和FAB按钮颜色跟随主题色
  - 背景动画颜色跟随主题色
  - 所有 toast 消息使用 i18n

Stage Summary:
- 所有构建错误已修复，lint 通过
- 国际化系统完整（3语言），设置后全局生效
- 记录页功能完善：日历选择、编辑历史、年月筛选、搜索
- 我的页面新增：语言切换、重置数据、主题颜色、应用锁、微信分享
- dev server 运行正常，浏览器验证通过

---
Task ID: 2
Agent: Main
Task: 修复情绪选择器中焦虑(😰)表情包显示异常

Work Log:
- 使用 VLM 分析用户上传的截图，确认"焦虑"选项未正常显示对应emoji
- 根因分析: `shared.tsx` 中的 `MOOD_LABELS` 和 `MOOD_EMOJIS` 只有6个条目（索引0-5），但 LogTab.tsx 中的 `ml` 数组有7个条目（索引0-6），因为新增了"害羞"情绪
  - 旧: MOOD_LABELS = ['', '开心', '平静', '低落', '烦躁', '焦虑'] （无"害羞"）
  - 旧: MOOD_EMOJIS = ['', '😊', '😌', '😔', '😤', '😰'] （6个emoji）
  - 导致: MOOD_EMOJIS[6] 为 undefined，焦虑选项无emoji；且害羞/低落/烦躁/焦虑的emoji全部错位
- 修复: 更新 `shared.tsx` 中的 MOOD_LABELS 和 MOOD_EMOJIS 添加"害羞"条目
  - 新: MOOD_LABELS = ['', '开心', '平静', '害羞', '低落', '烦躁', '焦虑']
  - 新: MOOD_EMOJIS = ['', '😊', '😌', '😳', '😔', '😤', '😰']
- 使用 agent-browser 验证: 记录页情绪选择器所有6个情绪均正确显示emoji和文字
- 验证焦虑(😰)选项可正常点击选中，高亮状态正常
- 历史记录页emoji显示也正确

Stage Summary:
- 焦虑(😰)emoji显示异常已修复
- 根因: MOOD_LABELS/MOOD_EMOJIS与LogTab的ml数组不同步，缺少"害羞"条目导致索引错位
- 修复后所有6个情绪emoji正确映射: 😊开心、😌平静、😳害羞、😔低落、😤烦躁、😰焦虑

---
Task ID: 3
Agent: Main
Task: 修复周期规律"数据不足"判断过于严格的问题 + mood验证范围修复

Work Log:
- 分析用户截图：8个周期但仍显示"数据不足"
- 根因1: `cycle-service.ts` 计算周期长度时要求 `periods[i].endDate` 存在，但周期长度只需两个相邻经期的开始日期即可计算，不需要endDate
  - 旧逻辑: `if (periods[i].endDate) { 计算cycleLen }` — 很多经期没有结束日期导致cycleLengths为空
  - 新逻辑: 直接从 startDate 计算周期长度，仅经期长度(periodLengths)仍需endDate
- 根因2: 阈值 `cycleLengths.length >= 3` 过于严格，新用户很难达到
  - 新阈值: `cycleLengths.length >= 2`（至少2个完整周期即可判断）
- 修复 `cycle-service.ts`: 移除cycleLength计算的endDate依赖，降低阈值到2
- 修复 `ProfileTab.tsx`: 同步降低阈值到2，增加"数据不足"时的提示文字
- 增加 i18n 翻译键 `profile_insufficient_tip`: 三语提示"至少需要记录2个完整经期周期才能判断规律性"
- 同时修复了 mood API 验证范围 0-5 → 0-6（配合之前的emoji修复）

Stage Summary:
- 周期规律判断逻辑已修复，用户8个周期现在正确显示"规律"
- 条件: 至少2个经期开始日期间隔在15-50天之间即可判断
- 数据不足时显示提示文字告知用户需要什么条件
- mood验证范围0-6已同步修复

---
Task ID: 4
Agent: notification-agent
Task: Implement notification bell icon with notification panel

Work Log:
- Added i18n keys for notification feature to `translations.ts`: notif_title, notif_empty, notif_clear_all, notif_period_coming, notif_period_days, notif_record_today, notif_fertile, notif_delete (zh/en/ko)
- Created `NotificationPanel.tsx` component:
  - Bottom sheet using framer-motion (same pattern as ActionSheet)
  - Props: open, onClose, notifications, onDeleteNotification, onDeleteAll
  - Notification items with type-based icons (Calendar for period, Bell for record, Heart for ovulation)
  - Each item shows title, message, relative timestamp (e.g., "2小时前", "昨天")
  - Swipe-to-delete support via framer-motion drag + delete button per item
  - "清空全部" (Clear All) button in header
  - Empty state with bell icon and i18n text
  - Dark theme styling (#1a2027 bg, #f0ece4 text, #e07a5f accent)
  - All text uses useI18n() for i18n
- Updated `HomeTab.tsx`:
  - Added props: notificationCount (optional, default 0), onOpenNotification (optional)
  - Bell button now calls onOpenNotification on click
  - Red badge appears on bell icon when notificationCount > 0 (shows "9+" for counts > 9)
- Updated `page.tsx`:
  - Added state: notifications (LunaNotification[]), notificationPanelOpen (boolean)
  - Load notifications from localStorage on mount (key: luna_notifications)
  - Save notifications to localStorage on change
  - Auto-generate notifications from app data:
    - Period reminder: if daysUntilNext is 1-3, create "经期即将到来" notification
    - Record reminder: if no daily record for today, create "今天还没有记录哦" notification
    - Ovulation reminder: if today is in fertile window, create "当前处于易孕期" notification
  - Duplicate prevention: check existing notifications before generating new ones
  - Handler functions: deleteNotification (by id), deleteAllNotifications (clear all)
  - Pass notificationCount and onOpenNotification to HomeTab
  - Render NotificationPanel component at bottom of JSX
- Lint passes with 0 errors, 0 warnings
- Dev server compiles and serves correctly

Stage Summary:
- Notification bell icon now functional: click opens bottom sheet panel
- Red badge shows notification count when > 0
- Auto-generated notifications: period reminder (1-3 days), record reminder, ovulation reminder
- Notification panel supports: individual delete (swipe + button), clear all, empty state
- Notifications persist in localStorage across sessions
- All notification text is i18n-ready (zh/en/ko)

---
Task ID: 2
Agent: avatar-crop-agent
Task: Implement avatar upload with image cropping

Work Log:
- Created `/home/z/my-project/src/components/luna/ImageCropDialog.tsx` - reusable image crop dialog component
  - Uses `react-easy-crop` (Cropper component) with full TypeScript typing
  - Props: open, imageSrc (base64 data URL), onCropComplete (returns cropped base64), onCancel, cropShape ('round'|'rect'), aspectRatio (default 1)
  - Circular crop area for avatar, rectangular for wallpaper via cropShape prop
  - After user confirms crop, uses canvas API to generate cropped image as base64 (JPEG 85% quality)
  - Compresses output to max 512x512 while preserving aspect ratio
  - Dark theme (#1a2027 background, #f0ece4 text, #e07a5f accent)
  - Zoom slider with styled range input
  - Header with "确认" and "取消" buttons using i18n (useI18n)
  - Loading state on confirm button during processing
  - Full-screen overlay with framer-motion animations
- Updated `/home/z/my-project/src/components/luna/ProfileEditSheet.tsx` - added crop flow
  - Removed handleAvatarUpload prop (no longer needed, file handling is now internal)
  - Added internal onFileChange handler: reads file → opens ImageCropDialog → sets cropped result as avatar
  - Uses circular crop (cropShape='round', aspectRatio=1) for avatar
  - Cropped image compressed to max 512x512 in ImageCropDialog
  - File size validation (2MB max) with toast notification
  - Resets file input after selection so same file can be re-selected
  - Added useToast import for size validation feedback
  - All existing functionality preserved
- Updated `/home/z/my-project/src/app/page.tsx`
  - Removed handleAvatarUpload function (moved into ProfileEditSheet)
  - Removed handleAvatarUpload prop from ProfileEditSheet component call
- Added i18n keys to `/home/z/my-project/src/lib/i18n/translations.ts`:
  - `crop_confirm`: '确认' / 'Confirm' / '확인'
  - `crop_cancel`: '取消' / 'Cancel' / '취소'
  - `crop_title`: '裁剪图片' / 'Crop Image' / '이미지 자르기'
- Lint passes with 0 errors
- Dev server compiles and serves correctly

Stage Summary:
- Avatar upload now opens a full-screen crop dialog before setting the avatar
- ImageCropDialog is a reusable component supporting both round (avatar) and rect (wallpaper) crop shapes
- Cropped images are compressed to max 512x512 JPEG to reduce storage
- i18n support for crop dialog buttons and title in all 3 languages (zh/en/ko)
- All existing ProfileEditSheet functionality preserved

---
Task ID: 5
Agent: i18n-agent
Task: Make i18n work globally in HomeTab and CalendarTab

Work Log:
- Added missing i18n keys to `translations.ts` for all 3 locales (zh/en/ko):
  - Home keys: home_today, home_next_period_label, home_days_after, home_phase_day, home_view_all, home_phase_timeline, home_recent_n_cycles, home_avg_format, home_recent_label, home_date_short, home_date_full
  - Phase tip keys: phase_period_tip, phase_follicular_tip, phase_ovulation_tip, phase_luteal_tip
  - Daily tips keys: tip_period_0-4, tip_follicular_0-4, tip_ovulation_0-4, tip_luteal_0-4 (20 tip translations)
  - Calendar keys: calendar_legend, calendar_period_label, calendar_predicted_period, calendar_fertile_window, calendar_period_desc, calendar_predicted_desc, calendar_fertile_desc, calendar_cycle_history, calendar_back_today, calendar_ongoing, calendar_month_format, calendar_date_range, calendar_n_days
- Updated `HomeTab.tsx`:
  - Added `import { useI18n } from '@/lib/i18n'` and `const { t } = useI18n()`
  - Replaced all hardcoded Chinese strings with t() calls:
    - "今天" → t('home_today')
    - "下次经期预计" → t('home_next_period_label')
    - "天后" → t('home_days_after')
    - "周期长度" → t('home_cycle_length')
    - "经期长度" → t('home_period_length')
    - "天" → t('common_days')
    - "周期阶段" → t('home_phase_timeline')
    - "经期/卵泡期/排卵/黄体期" → t('phase_period'/'phase_follicular'/'phase_ovulation'/'phase_luteal')
    - "最近记录" → t('home_recent_records')
    - "查看全部" → t('home_view_all')
    - "今日小贴士" → t('home_daily_tip')
    - "周期趋势" → t('home_trend')
    - "最近X个周期" → t('home_recent_n_cycles', n)
    - "平均 X 天" → t('home_avg_format', n)
    - "最近" → t('home_recent_label')
  - Replaced formatDateChinese() with locale-aware formatLocalDateFull() using t('home_date_full')
  - Replaced date formatting in records with formatLocalDateShort() using t('home_date_short')
  - Replaced PHASE_INFO.name/desc/tip with t() calls using PHASE_NAME_KEYS/PHASE_DESC_KEYS/PHASE_TIP_KEYS lookup maps
  - Replaced FLOW_LABELS[] with FLOW_KEYS[] + t() calls
  - Replaced DAILY_TIPS reference with getTipText() using dynamic t(`tip_${phase}_${index}`)
  - Added "第X天" → t('home_phase_day', cycleInfo.phaseDay)
- Updated `CalendarTab.tsx`:
  - Added `import { useI18n } from '@/lib/i18n'` and `const { t } = useI18n()`
  - Replaced WEEKDAYS_SHORT with WEEKDAY_SHORT_KEYS + t() calls
  - Replaced all hardcoded Chinese strings:
    - "年/月" → t('calendar_month_format', year, month)
    - "回到今天" → t('calendar_back_today')
    - "日历图例" → t('calendar_legend')
    - "经期/预测经期/易孕期" → t('calendar_period_label'/'calendar_predicted_period'/'calendar_fertile_window')
    - Legend descriptions → t('calendar_period_desc'/'calendar_predicted_desc'/'calendar_fertile_desc')
    - "周期历史" → t('calendar_cycle_history')
    - "进行中" → t('calendar_ongoing')
    - "X天" → t('calendar_n_days', n)
    - Date range format → t('calendar_date_range', ...)
  - Removed unused imports (WEEKDAYS_SHORT)
- Lint passes with 0 errors
- Dev server compiles and serves correctly

Stage Summary:
- HomeTab.tsx fully i18n-ready: all 20+ hardcoded Chinese strings replaced with t() calls
- CalendarTab.tsx fully i18n-ready: all hardcoded Chinese strings replaced with t() calls
- 55+ new translation keys added across 3 locales (zh/en/ko)
- All date formatting now locale-aware (e.g., "3月5日 周二" / "3/5 Tue" / "3월 5일 화요일")
- Phase names, descriptions, tips, and daily health tips all translated
- No functional logic changed, only string replacement with i18n calls

---
Task ID: 3+6+7+8
Agent: wallpaper-theme-lock-agent
Task: Implement wallpaper, WeChat export, theme scope, app lock

Work Log:
- Added i18n keys for all 4 features to translations.ts (zh/en/ko): wallpaper_title, wallpaper_select, wallpaper_preset, wallpaper_remove, wallpaper_set, wallpaper_removed, theme_scope, theme_scope_local, theme_scope_global, lock_enter_pin, lock_unlock
- Task 3: Updated ProfileTab.tsx to add "自定义壁纸" menu item in appearance section with ImageIcon import
- Created wallpaper picker bottom sheet with: file input for gallery image selection, 5 preset gradient wallpapers (日落暖光/海洋深蓝/森林绿意/夜空星河/樱花粉黛), remove wallpaper option
- Integrated ImageCropDialog for custom image cropping with cropShape='rect' and aspectRatio=9/16
- Updated page.tsx: added wallpaper state (loaded from localStorage `luna_wallpaper`), wallpaper background rendering with dark overlay
- Task 6: Enhanced shareWeChat function to try navigator.share() first, fallback generates share image via canvas with Luna branding + copies link to clipboard
- Task 7: Added theme scope toggle (local/global) in ThemeColorSheet with segmented control UI; when global, applies --theme-color CSS custom property to :root; stored in localStorage `luna_theme_scope`
- Updated page.tsx with useEffect to sync theme scope CSS custom property; added themeScope/setThemeScope props passed to ProfileTab
- Task 8: Added app lock PIN verification screen on app launch; checks app_lock setting + luna_pin in localStorage; shows full-screen lock overlay with Luna logo, PIN dots, number pad; shake animation on wrong PIN with toast; isUnlocked state to dismiss
- Lint passes with 0 errors, 0 warnings
- Dev server compiles and serves correctly

Stage Summary:
- Custom wallpaper feature: users can select images from gallery (with cropping) or choose from 5 preset gradient wallpapers, stored in localStorage
- WeChat share enhanced: tries native share first, fallback generates branded share image + copies link
- Theme scope toggle: "仅当前" (local) vs "全局" (global) - global applies CSS custom property to :root
- App lock screen: full-screen PIN verification overlay on launch when app_lock is enabled, with shake animation for wrong PIN
- All i18n keys added for zh/en/ko translations

---
Task ID: main-coordinator
Agent: Main
Task: 统筹所有功能实现，修复集成问题，验证全部功能

Work Log:
- 修复数据初始化规则：
  - 首次安装：仅创建默认资料(小桦)和设置，不创建示例经期/记录数据
  - 版本更新：通过 localStorage `luna_initialized` 标记版本号，仅迁移新增设置项
  - seed API 不再创建示例数据，APP_VERSION = 2
  - 修复 page.tsx cycleStats 计算与后端一致（不要求 endDate）
- 修复 HomeTab 铃铛按钮：手动添加 notificationCount/onOpenNotification props 和点击事件
- 验证全部功能通过 agent-browser：
  - 首页：日期、周期信息、阶段、记录、小贴士、趋势图全部 i18n 化
  - 日历：星期、月份、图例、历史记录全部 i18n 化
  - 记录：6个情绪emoji正确显示，保存功能正常（mood 0-6）
  - 我的：健康档案显示"规律"（修复后的阈值2），语言切换全局生效（测试 zh→en→zh）
  - 通知：铃铛点击打开通知面板，可删除/清空通知
  - 壁纸：预设壁纸可点击设置，选择图片可裁剪（9:16比例）
  - 主题：主题颜色选择+生效范围（局部/全局）
  - 应用锁：PIN设置→确认→启动时锁屏验证→输入PIN解锁
  - 头像：上传图片→裁剪(圆形)→保存

Stage Summary:
- 所有8项用户需求已实现并验证
- lint 通过，dev server 无报错
- 数据初始化：首次无数据，版本更新保留数据
- i18n 全局生效：HomeTab/CalendarTab/LogTab/ProfileTab 全部支持中英韩三语
- 铃铛通知功能完整：自动生成+删除+清空+持久化
- 头像/壁纸裁剪：react-easy-crop 实现
- 主题颜色：局部/全局切换
- 应用锁：PIN设置+启动验证

---
Task ID: 6
Agent: Main
Task: 记录页添加无量选择 - 流量选择增加"无量"选项

Work Log:
- 更新 `shared.tsx`: FLOW_LABELS 从 `['', '点滴', '少量', '中等', '大量']` 改为 `['无量', '点滴', '少量', '中等', '大量']`，索引0从空字符串变为'无量'
- 添加 i18n 翻译键 `log_flow_none`: zh='无量', en='None', ko='없음'
- 更新 `LogTab.tsx`:
  - 流量选择器从4个按钮(1-4)扩展为5个按钮(0-4)，增加"无量"选项
  - "无量"按钮使用空心圆+中心点视觉设计，区别于其他实心圆按钮
  - 历史记录中 flow=0 的显示：使用虚线边框圆点 + "无量"文字标签
  - fl 数组更新：从 `['', t('log_flow_spotting'), ...]` 改为 `[t('log_flow_none'), t('log_flow_spotting'), ...]`
- 更新 `HomeTab.tsx`:
  - FLOW_KEYS 数组索引0从空字符串改为 `'log_flow_none'`
  - flowLabel 判断条件从 `flow >= 1` 改为 `flow >= 0`，支持显示无量
- API 已支持 flow=0（validateIntRange 0-4），无需修改
- 导出功能已正确使用 FLOW_LABELS[r.flow]，自动适配新索引
- 使用 agent-browser 验证：流量选择器5个选项（无量/点滴/少量/中等/大量）全部正常显示和选择
- 保存 flow=0 记录后，历史记录正确显示"None"（无量）

Stage Summary:
- 流量选择新增"无量"选项（flow=0），用户可以选择"没有流量"
- 视觉设计：无量用空心圆+中心点表示，其他流量用逐渐增大的实心圆
- 历史记录中无量用虚线圆点表示
- i18n 三语支持：无量/None/없음
- 所有相关文件已更新：shared.tsx, LogTab.tsx, HomeTab.tsx, translations.ts
- lint 通过，dev server 无报错

---
Task ID: 7
Agent: Main
Task: 应用锁全面改造 — 支持Android端打包，完善启用/关闭/修改PIN流程

Work Log:
- 创建 `src/lib/lock-utils.ts` — PIN加密存储和防暴力破解工具库
  - SHA-256 哈希 + 随机盐值存储PIN（不再明文存储）
  - 防暴力破解：5次失败后锁定，锁定时间递增（30s → 60s → 120s...）
  - API: savePin(), verifyPin(), isPinSet(), removePin(), recordFailedAttempt(), resetFailedAttempts(), getLockoutRemaining(), getRemainingAttempts(), formatLockoutTime()
  - 所有数据存储在localStorage，兼容Android WebView/PWA
- 创建 `src/components/luna/PinPad.tsx` — 可复用PIN数字键盘组件
  - 圆角大按钮数字键盘（1-9, 0, 退格）
  - PIN圆点指示器（带发光动画）
  - 支持shake动画、禁用状态、自定义主题色
  - 支持生物识别按钮位置（预留Android指纹/Face ID）
- 创建 `src/components/luna/LockScreen.tsx` — 独立锁屏组件
  - 全屏锁屏覆盖层（z-[400]）
  - Luna品牌Logo + 主题色渐变
  - 防暴力破解：错误5次后倒计时锁定
  - 错误提示：显示剩余尝试次数
  - 锁定倒计时：MM:SS格式显示
  - 使用 PinPad 共享组件
- 创建 `src/components/luna/LockSetupSheet.tsx` — 锁设置底部弹窗
  - 启用流程：设置PIN → 确认PIN → 自动启用
  - 管理界面：显示启用状态卡片 + 修改PIN + 关闭应用锁
  - 修改PIN流程：验证旧PIN → 设置新PIN → 确认新PIN
  - 两步进度指示器（设置→确认）
  - 安全提示说明
- 更新 `src/components/luna/ProfileTab.tsx`
  - 替换旧的内联PIN设置为 LockSetupSheet 组件
  - 隐私区域：应用锁行显示启用/禁用状态（绿色圆点 vs 箭头）
  - 图标颜色跟随状态变化
  - 移除旧的 pin/pinStep/firstPin/handlePin 代码
- 更新 `src/app/page.tsx`
  - 替换旧的内联锁屏为 LockScreen 组件
  - 使用 lock-utils 的 isPinSet() 和 isAppLockEnabled()
  - 移除 lockScreenPin/lockScreenShake/handleLockScreenPin 代码
  - 简化为 handleUnlock callback
- 更新 `src/lib/i18n/translations.ts` — 新增14个i18n键（3语）
  - lock_wrong_pin_remaining: 错误提示带剩余次数
  - lock_too_many_attempts: 次数过多提示
  - lock_try_again_later / lock_locked_out: 锁定状态
  - lock_attempts_remaining: 剩余次数提示
  - lock_pin_mismatch: 两次输入不一致
  - lock_enter_old_pin: 验证旧PIN
  - lock_status_enabled / lock_status_disabled: 状态描述
  - lock_enabled_title / lock_enabled_desc: 启用状态卡片
  - lock_change_pin_desc / lock_turn_off_desc: 按钮描述
  - lock_security_note: 安全说明

Stage Summary:
- 应用锁全面改造完成，所有组件独立化、可复用
- PIN存储安全性：SHA-256 + 随机盐值（不再明文）
- 防暴力破解：5次失败后倒计时锁定，时间递增
- 启用/关闭/修改PIN流程完整：
  - 启用：设置→确认→自动开启
  - 修改：验证旧PIN→设置新PIN→确认
  - 关闭：一键关闭+清除PIN
- Android兼容：所有存储使用localStorage，WebView/PWA可用
- ProfileTab显示锁状态（绿色圆点=已启用）
- i18n 三语支持（14个新翻译键）
- agent-browser 验证：启用→锁屏→解锁→关闭 全流程通过
- lint 通过，dev server 无报错

---
Task ID: 8
Agent: Main
Task: 修复自定义壁纸底部弹窗"移除壁纸"按钮显示不全的问题

Work Log:
- 使用 VLM 分析用户上传截图，确认"移除壁纸"按钮在底部弹窗中被截断
- 根因分析: 预设壁纸缩略图使用 `aspect-[9/16]` 导致高度过大，加上 BottomSheet 底部padding不足(pb-10)
- 修复 `ProfileTab.tsx`:
  - 预设壁纸缩略图 aspect-ratio 从 `aspect-[9/16]` 改为 `aspect-[3/4]`（更短更紧凑）
  - BottomSheet 底部padding从 `p-6 pb-10` 改为 `px-6 pt-6 pb-14`（增加底部空间）
  - 移除壁纸按钮添加 `mt-2` 间距，避免与上方预设壁纸区域过于紧凑
- 使用 agent-browser 验证：
  - 预设壁纸缩略图确认 aspect 3:4，高度约97px（之前约130px+）
  - "移除壁纸"按钮设置壁纸后完全可见，无截断
  - BottomSheet 内容无需滚动即可完整显示（scrollHeight = clientHeight）
  - 所有5个预设壁纸正常显示在grid布局中
- lint 通过，dev server 无报错

Stage Summary:
- 自定义壁纸弹窗"移除壁纸"按钮显示不全问题已修复
- 预设壁纸缩略图比例从9:16调整为3:4，节省纵向空间
- BottomSheet底部padding从40px增加到56px
- agent-browser验证：所有元素完整显示，按钮不再被截断

---
Task ID: 9
Agent: Main
Task: 修复自定义壁纸弹窗兼容所有手机型号 — 确保移除壁纸按钮在所有屏幕尺寸下完全可见

Work Log:
- 用户反馈：之前的修复只解决了部分场景，需要兼容所有型号手机
- 全面改造 BottomSheet 组件：
  - 从简单 overflow-y-auto 改为 flex column 布局（flex-col）
  - 添加 footer 插槽：底部固定区域，不被滚动影响
  - 内容区使用 flex-1 overflow-y-auto 独立滚动
  - 底部 padding 使用 max(3.5rem, env(safe-area-inset-bottom) + 1.5rem) 兼容刘海屏/全面屏
  - 添加 overscroll-contain 和 WebkitOverflowScrolling: touch 优化移动端滚动
- 壁纸弹窗布局重构：
  - "移除壁纸"按钮从 children 移至 footer 插槽，始终固定在底部
  - 按钮样式改为居中布局（更紧凑），仅在有壁纸时显示
  - 预设壁纸从 grid 布局改为水平滚动列表（flex + overflow-x-auto）
  - 每个预设壁纸固定尺寸 64x86px，不再依赖 aspect-ratio
  - 窄屏手机上预设壁纸可水平滑动查看（scrollbarWidth: none）
- agent-browser 多尺寸验证结果：
  - iPhone SE (375x667): ✅ 移除按钮完全可见，底部留57px间距
  - iPhone 14 Pro (393x852): ✅ 所有5个预设可见，按钮完全可见
  - 小屏Android (360x640): ✅ 移除按钮完全可见，4个预设直接可见+水平滚动
  - 大屏手机 (428x926): ✅ 布局舒适，所有元素完美显示
- lint 通过，dev server 无报错

Stage Summary:
- BottomSheet 组件全面升级：flex布局 + footer插槽 + safe-area兼容
- 壁纸弹窗在4种不同屏幕尺寸下均通过验证
- "移除壁纸"按钮始终固定在底部，不会被滚动或截断
- 预设壁纸改为水平滚动，窄屏体验更好
- 兼容 iPhone SE / 小屏Android / 标准手机 / 大屏手机

---
Task ID: 10
Agent: Main
Task: 修复自定义壁纸和语言弹窗显示不全 — 兼容所有手机型号及浏览器打开

Work Log:
- 使用 VLM 分析用户截图，发现两个核心问题：
  1. 底部弹窗（语言/壁纸）被底部导航栏遮挡，内容截断
  2. 通过网站浏览器打开时，浏览器工具栏进一步减少可视区域
- 根因分析：
  - BottomSheet 使用 `max-height: 85vh` 但浏览器 `vh` 不包含浏览器工具栏
  - 底部导航栏(z-50)始终可见，与弹窗(z-200)内容重叠
  - 移动浏览器(Chrome/Safari)有自己的地址栏和底部工具栏
- 修复方案（3层防护）：
  1. **dvh 替代 vh**: 所有底部弹窗改用 `dvh`(dynamic viewport height)替代 `vh`
     - dvh 动态响应浏览器工具栏的显示/隐藏
     - 添加 CSS @supports fallback 兼容不支持 dvh 的浏览器
  2. **底部导航栏自动隐藏**: 当任何底部弹窗打开时，导航栏 translateY(100%) 隐藏
     - ProfileTab 新增 `onSheetOpenChange` 回调通知 page.tsx
     - page.tsx 监听所有弹窗状态(profileSheetOpen/actionSheet/profileEditOpen/feedbackOpen/notificationPanelOpen/symptomSheetOpen)
     - 隐藏使用 CSS transition 平滑动画(300ms)
  3. **safe-area-inset-bottom**: 所有弹窗底部 padding 使用 `max(Xrem, env(safe-area-inset-bottom) + Yrem)` 兼容全面屏/刘海屏
- 更新的文件：
  - `ProfileTab.tsx`: BottomSheet 用 dvh + flex 布局 + min-h-0; 新增 onSheetOpenChange prop
  - `page.tsx`: 新增 profileSheetOpen 状态; 导航栏条件隐藏; 传递 onSheetOpenChange
  - `ActionSheet.tsx`: 80vh → 80dvh + safe-area padding
  - `FeedbackSheet.tsx`: 85vh → 85dvh + safe-area padding
  - `ProfileEditSheet.tsx`: 85vh → 85dvh + safe-area padding
  - `LockSetupSheet.tsx`: 90vh → 90dvh + safe-area padding
  - `NotificationPanel.tsx`: 75vh → 75dvh
  - `globals.css`: 添加 dvh fallback 规则
- agent-browser 4种屏幕尺寸验证：
  - 360x640 (小屏Android): ✅ 语言3选项全可见，导航栏隐藏/恢复正常
  - 375x667 (iPhone SE): ✅ 所有弹窗内容完整，导航栏正常隐藏
  - 393x852 (iPhone 15 Pro): ✅ 布局舒适，所有功能正常
  - 壁纸弹窗: ✅ 选择图片/预设壁纸/移除壁纸全部可见
- lint 通过，dev server 无报错

Stage Summary:
- 所有底部弹窗全面兼容：手机PWA + 网站浏览器打开
- dvh 解决浏览器工具栏占用空间的问题
- 导航栏自动隐藏消除弹窗与导航栏的重叠
- safe-area-inset-bottom 兼容全面屏手机
- 6个弹窗组件全部更新为 dvh + safe-area

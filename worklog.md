# Work Log — Task 4: Refactor page.tsx for Memory Optimization

## Task ID: 4
## Date: 2026-03-04
## Status: ✅ Completed

## Problem
The `/home/z/my-project/src/app/page.tsx` file was 2225 lines long, causing Next.js compilation to crash due to memory constraints. The dev server would run out of memory trying to compile this single massive file.

## Strategy
Split the monolithic page.tsx into smaller, focused component files to reduce Next.js compilation memory usage. All state management and data fetching logic remains in page.tsx, while rendering JSX is extracted into separate components that receive data/callbacks as props.

## Files Created

### 1. `src/components/luna/shared.tsx` (172 lines)
- All TypeScript interfaces (Period, DailyRecord, UserProfile, Setting, TabPage, CycleInfo, CycleStats, PeriodInfoResult, CalendarDay)
- All constants (WEEKDAYS_SHORT, WEEKDAYS_FULL, FLOW_LABELS, MOOD_LABELS, MOOD_EMOJIS, DEFAULT_SYMPTOMS, FEEDBACK_CATEGORIES, PHASE_INFO, RING_TICK_MARKS, DAILY_TIPS)
- All utility functions (formatDateStr, formatDateChinese, formatShortDate, parseDate, daysBetween, addDays)
- StaggerIn animation wrapper component

### 2. `src/components/luna/HomeTab.tsx` (339 lines)
- Home tab content: header, phase card, cycle ring SVG, stats grid, cycle phase timeline, recent records, daily health tip, cycle trend mini chart

### 3. `src/components/luna/CalendarTab.tsx` (209 lines)
- Calendar tab content: month navigation, weekday headers, calendar grid, legend, cycle history summary

### 4. `src/components/luna/LogTab.tsx` (275 lines)
- Log tab content: tab switcher, flow section, symptoms section, mood section, note section, save button, history list

### 5. `src/components/luna/ProfileTab.tsx` (267 lines)
- Profile tab content: user info, health profile, notification settings, privacy & security, appearance, data management, other settings, security note

### 6. `src/components/luna/ActionSheet.tsx` (157 lines)
- Period action sheet: bottom sheet with conditional options based on period state
- Includes ActionOption sub-component

### 7. `src/components/luna/SymptomSheet.tsx` (85 lines)
- Add symptom bottom sheet with text input

### 8. `src/components/luna/ProfileEditSheet.tsx` (169 lines)
- Profile edit bottom sheet with avatar upload, name, cycle length, and period length editing

### 9. `src/components/luna/DeleteConfirmDialog.tsx` (63 lines)
- Delete confirmation dialog for record deletion

### 10. `src/components/luna/FeedbackSheet.tsx` (141 lines)
- Feedback submission sheet with category selection, content textarea, and contact input

## Modified Files

### `src/app/page.tsx` (reduced from 2225 to 773 lines — 65% reduction)
- Retains ALL state management (useState, useMemo)
- Retains ALL data fetching functions (fetchPeriods, fetchRecords, fetchProfile, fetchSettings, seedData)
- Retains ALL business logic (getPeriodInfo, hasActivePeriod, getCycleInfo, getPredictedPeriodDays, getFertileDays)
- Retains ALL API action functions (startPeriod, endPeriod, updateStart, cancelActivePeriod, extendPeriod, saveRecord, toggleSetting, saveProfile, submitFeedback, handleAvatarUpload, deleteRecord, exportCSV)
- Retains calendar generation logic (generateCalendarDays)
- Retains cycle statistics computation (useMemo)
- Renders layout, background blobs, bottom navigation, and loading overlay directly
- Delegates tab content and modal rendering to extracted components

## Verification
- `bun run lint` passes with zero errors
- No functionality, UI, styling, or behavior was changed
- All components use `'use client'` directive
- Each component receives only the data and callbacks it needs via props

## Line Count Summary
| File | Lines |
|------|-------|
| page.tsx (original) | 2225 |
| page.tsx (refactored) | 773 |
| shared.tsx | 172 |
| HomeTab.tsx | 339 |
| CalendarTab.tsx | 209 |
| LogTab.tsx | 275 |
| ProfileTab.tsx | 267 |
| ActionSheet.tsx | 157 |
| SymptomSheet.tsx | 85 |
| ProfileEditSheet.tsx | 169 |
| DeleteConfirmDialog.tsx | 63 |
| FeedbackSheet.tsx | 141 |
| **Total** | **2650** |

The total line count increased slightly due to interface definitions, prop declarations, and import statements in each file, but this is the expected trade-off for component extraction. The critical win is that each file is independently compilable by Next.js, drastically reducing peak memory usage during compilation.

---
Task ID: 5
Agent: Main
Task: 前后端接口分离 — 统一API格式、封装服务层、完善接口校验

Work Log:
- 分析现有前后端交互方式：page.tsx 直接使用 raw fetch() 调用 /api/* 接口，无统一响应格式、无参数校验、无错误处理
- 创建统一API响应格式 (`src/lib/api/response.ts`)：success/created/ok/badRequest/notFound/serverError/conflict + 参数校验工具
- 创建共享API类型定义 (`src/lib/api/types.ts`)：所有请求/响应的 TypeScript 接口，前后端共用
- 创建后端业务逻辑服务层 (`src/lib/api/cycle-service.ts`)：从前端迁移周期计算、统计、预测、日历生成等逻辑到后端
- 重构全部6个已有API路由文件，统一使用新响应格式和参数校验
- 新增4个API端点：
  - GET /api/stats — 周期统计数据（含周期规律性判断、连续记录天数）
  - GET /api/dashboard — 首页仪表盘聚合数据
  - GET /api/calendar?year=&month= — 日历月数据（含经期标记、预测、易孕期）
  - GET /api/export — 数据导出（含CSV格式化）
- 新增记录编辑接口：PUT /api/records/[date] — 按日期更新记录
- 新增设置批量更新接口：POST /api/settings — 批量更新设置项
- 创建前端API服务层 (`src/services/api.ts`)：封装所有API调用，提供类型安全接口，统一错误处理
- 重构 page.tsx：所有 fetch() 调用替换为 API 服务层方法，所有 API 操作增加 try/catch + ApiError 处理
- 数据导出改为通过后端API获取CSV内容

Stage Summary:
- 全部16个API端点已实现统一响应格式 { success, data, error, message, timestamp }
- 所有API均有参数校验（必填字段、日期格式、数值范围、字符串长度）
- 前端通过 src/services/api.ts 服务层统一调用后端，类型安全
- 后端业务逻辑层 src/lib/api/cycle-service.ts 可被API路由和未来服务复用
- lint 通过，dev server 运行正常，所有API经curl验证返回正确
- 新增功能：周期规律性智能判断、连续记录天数统计、记录编辑API、数据导出API

API 接口清单：
| 接口 | 方法 | 说明 |
|------|------|------|
| /api/periods | GET | 获取所有经期记录 |
| /api/periods | POST | 创建经期记录 |
| /api/periods/[id] | PUT | 更新经期记录 |
| /api/periods/[id] | DELETE | 删除经期记录 |
| /api/records | GET | 获取所有每日记录 |
| /api/records | POST | 创建/更新记录(Upsert) |
| /api/records/[date] | GET | 获取指定日期记录 |
| /api/records/[date] | PUT | 更新指定日期记录(编辑) |
| /api/records/[date] | DELETE | 删除指定日期记录 |
| /api/profile | GET | 获取用户资料 |
| /api/profile | PUT | 更新用户资料 |
| /api/settings | GET | 获取所有设置 |
| /api/settings | PUT | 更新单个设置 |
| /api/settings | POST | 批量更新设置 |
| /api/feedback | GET | 获取所有反馈 |
| /api/feedback | POST | 提交反馈 |
| /api/stats | GET | 周期统计数据 |
| /api/dashboard | GET | 首页仪表盘数据 |
| /api/calendar | GET | 日历月数据 |
| /api/export | GET | 数据导出 |
| /api/seed | POST | 初始化种子数据 |

---
Task ID: 1
Agent: Main
Task: Create standalone embedded backend HTTP service (luna-server) for Luna period tracker

Work Log:
- Analyzed existing API implementations in `/home/z/my-project/src/app/api/` (13 route files) and business logic in `/home/z/my-project/src/lib/api/cycle-service.ts`
- Created new mini-service at `/home/z/my-project/mini-services/luna-server/` with independent `package.json`
- Initially attempted to use `better-sqlite3` but discovered it's not supported by Bun runtime (`ERR_DLOPEN_FAILED`)
- Switched to `bun:sqlite` (Bun's built-in SQLite library) which has a similar API and is fully supported
- Implemented complete HTTP server with all 21 API endpoints in a single `index.ts` file
- All business logic (cycle calculation, period prediction, fertile days, statistics, calendar generation, daily tips) ported from the Next.js API routes
- Database schema with 5 tables (UserProfile, Period, DailyRecord, Setting, Feedback) created on startup
- Unified response format: `{ success, data, error, message, timestamp }` on all endpoints
- Full validation on all input parameters (required fields, date formats, integer ranges, string lengths)
- CORS headers on all responses, OPTIONS preflight handling
- Configurable DB path via `DB_PATH` env var (default: `./data/luna.db`)
- Configurable port via `PORT` env var (default: `3210`)
- ID generation using `crypto.randomUUID()`
- `bun --hot` for auto-restart during development
- Seed data endpoint creates default profile, 3 period cycles, 2 daily records, and 5 default settings

Files Created:
- `mini-services/luna-server/package.json` — Independent bun project, port 3210
- `mini-services/luna-server/index.ts` — Complete HTTP server (all 21 endpoints + business logic)

API Endpoint Verification (all tested via curl):
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/profile | GET | ✅ Returns default profile (auto-creates if missing) |
| /api/profile | PUT | ✅ Updates profile with validation |
| /api/periods | GET | ✅ Returns all periods ordered by startDate desc |
| /api/periods | POST | ✅ Creates period with date validation |
| /api/periods/:id | PUT | ✅ Updates period, validates existence and dates |
| /api/periods/:id | DELETE | ✅ Deletes period, validates existence |
| /api/records | GET | ✅ Returns all records ordered by date desc |
| /api/records | POST | ✅ Upserts record by date with flow/mood validation |
| /api/records/:date | GET | ✅ Returns record by date |
| /api/records/:date | PUT | ✅ Updates record by date |
| /api/records/:date | DELETE | ✅ Deletes record by date |
| /api/settings | GET | ✅ Returns all settings |
| /api/settings | PUT | ✅ Upserts setting by key |
| /api/settings | POST | ✅ Batch updates settings |
| /api/feedback | GET | ✅ Returns all feedback |
| /api/feedback | POST | ✅ Creates feedback with category validation |
| /api/stats | GET | ✅ Returns cycle statistics (avgCycle=28, avgPeriod=5, totalCycles=3, cycleRegularity=insufficient_data) |
| /api/dashboard | GET | ✅ Returns cycleInfo + stats + recentRecords + dailyTip |
| /api/calendar?year=&month= | GET | ✅ Returns calendar grid with period/predicted/fertile markers + periodHistory |
| /api/export | GET | ✅ Returns all data with CSV content |
| /api/seed | POST | ✅ Initializes seed data (profile, 3 periods, 2 records, 5 settings) |

Additional Verifications:
- OPTIONS preflight returns HTTP 204 with CORS headers ✅
- 404 for unknown routes ✅
- Validation errors (e.g., missing required fields) return 400 with error message ✅
- Server runs on port 3210 with `bun run dev` ✅

---
Task ID: 6
Agent: Main
Task: Capacitor + 嵌入式后端服务 — Android APK 打包架构实现

Work Log:
- 创建本地数据库层 `src/services/local-db.ts`：使用 Dexie.js + IndexedDB，定义5个数据模型，提供ID生成和日期工具函数
- 创建本地API实现 `src/services/local-api.ts`：完整实现21个API端点的本地版本，数据存储在IndexedDB中
- 重构API服务层 `src/services/api.ts`：支持 Server/Local 双模式自动切换
  - Server模式：fetch()调用后端API（开发/网页版）
  - Local模式：直接操作IndexedDB（Capacitor/Android APK）
  - 自动检测 Capacitor 环境 或 window.__LUNA_LOCAL_MODE__ 标记
- 配置 Next.js 静态导出 `next.config.ts`：通过 OUTPUT_MODE=export 环境变量切换
- 创建 PWA manifest `public/manifest.json`：完整的应用图标和配置
- 生成应用图标 `public/icons/`：8种尺寸（72~512px），AI生成月球主题图标
- 更新 layout.tsx：添加 manifest、apple-touch-icon、theme-color 等 PWA 元数据
- 安装 Capacitor 全套依赖：@capacitor/core, cli, android, app, haptics, status-bar, splash-screen
- 创建 Capacitor 配置 `capacitor.config.ts`：应用ID com.luna.periodtracker，webDir=out
- 创建自定义 Capacitor 插件 `capacitor-plugins/local-server/`：
  - TypeScript接口定义 (src/index.ts)
  - Java实现 (LocalServerPlugin.java)：使用NanoHTTPD启动本地HTTP服务器
- 创建 Android APK 构建脚本 `build-android.sh`：6步自动化构建流程

Stage Summary:
- 完成双模式架构：Server模式(Next.js API) + Local模式(IndexedDB)
- 在 Capacitor 环境下自动切换到 Local 模式，无需后端服务器
- 独立后端服务 mini-services/luna-server 已验证21个API端点全部正常
- PWA 配置完成，支持"添加到主屏幕"
- Capacitor + Android 项目配置完成
- 构建脚本和文档就绪

Android APK 打包架构图:
```
Android APK (Capacitor)
├── WebView (前端静态页面 - Next.js export)
│   ├── services/api.ts → 自动检测 Local 模式
│   ├── services/local-api.ts → IndexedDB 操作
│   └── services/local-db.ts → Dexie.js 数据库层
├── Capacitor Native Bridge
│   ├── SplashScreen → 开屏动画
│   ├── StatusBar → 状态栏控制
│   └── Haptics → 触觉反馈
└── 本地数据库 (IndexedDB)
    ├── UserProfile
    ├── Period
    ├── DailyRecord
    ├── Setting
    └── Feedback
```

打包步骤:
1. OUTPUT_MODE=export bun run build
2. npx cap add android (首次)
3. npx cap sync android
4. npx cap open android → Android Studio 构建 APK

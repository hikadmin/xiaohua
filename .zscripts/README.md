# APK 构建指南

## 一、目录结构

```
.zscripts/
├── 01-init-android-env.ps1   ← 一次性：下载安装 Android SDK
├── 02-build-apk.ps1          ← 每次打包：静态导出 + 编译 APK
└── README.md                 ← 本文档
```

## 二、环境要求

| 组件 | 说明 |
|---|---|
| Windows 10 / 11 | `curl.exe` 和 `tar` 自带 |
| JDK 22 | 通常在 `%USERPROFILE%\.jdks\temurin-22`（IDEA 自带） |
| Gradle | 脚本自动处理 |
| Android SDK | 脚本自动下载（约 300MB） |

## 三、首次使用

### 步骤 1：初始化 Android 构建环境（仅一次）

```powershell
.\01-init-android-env.ps1
```

此脚本将：
- 下载 Android cmdline-tools（腾讯云镜像）
- 下载 Build Tools 35.0.0（dl.google.com）
- 下载 Android Platform 36（dl.google.com）

约耗时 2~5 分钟（取决于网络）。建议将脚本输出的环境变量添加到系统变量。

## 四、每次打包

### 步骤 2：构建 APK

```powershell
.\02-build-apk.ps1
```

此脚本将：
1. `npx next build`   → 生成 `out/` 静态文件
2. `npx cap sync android` → 同步到 Capacitor Android 项目
3. `gradlew assembleDebug` → 编译 APK

APK 输出路径：
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## 五、一键命令行（终端中执行）

```powershell
$env:ANDROID_HOME = "$env:USERPROFILE\android-sdk"
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\temurin-22"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npx next build
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
```

## 六、新项目接入清单

将现有 Next.js 项目改造为可打包 APK：

- [ ] `next.config.ts` → `output: "export"`
- [ ] 创建 `src/lib/local-storage.ts`（替代 API Route）
- [ ] 替换 `page.tsx` 中所有 `fetch('/api/...')` 为本地存储调用
- [ ] 删除 `src/app/api/` 目录
- [ ] 安装 Capacitor：`npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ] 初始化：`npx cap init <AppName> <app.id> --web-dir=out`
- [ ] 创建 Android：`npx cap add android`
- [ ] 配置 `android/gradle.properties`（`android.overridePathCheck=true`）
- [ ] 配置 `android/settings.gradle`（Maven 镜像）
- [ ] 配置 `android/gradle/wrapper/gradle-wrapper.properties`（`networkTimeout=300000`）

## 七、故障排查

| 症状 | 解决 |
|---|---|
| `localStorage is not defined` | 存储层函数需 `typeof window` 守卫 |
| `@prisma/client did not initialize` | 删除 `src/app/api/` |
| Gradle 下载超时 | 手动下载放入 `%USERPROFILE%\.gradle\wrapper\dists\` |
| `contains too many directories` | Gradle 分发需嵌套 `gradle-<version>/` |
| `Connection refused: dl.google.com` | 确认网络直连；或用 `curl.exe` 单独下载后放入 SDK |
| 路径中文编译失败 | `android.overridePathCheck=true` |

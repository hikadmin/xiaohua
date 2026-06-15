# ============================================================
# 02-build-apk.ps1  -  Next.js 静态导出 + Capacitor APK 构建
# ============================================================
# 前置条件：已执行 01-init-android-env.ps1 初始化环境
# 运行目录：项目根目录（package.json 所在目录）
# 用法：右键 "使用 PowerShell 运行" 或终端中执行

$ErrorActionPreference = "Stop"

$ANDROID_HOME = "$env:USERPROFILE\android-sdk"
$JAVA_HOME    = "$env:USERPROFILE\.jdks\temurin-22"

# 环境检查
if (-not (Test-Path "$JAVA_HOME\bin\java.exe")) {
    Write-Error "JDK 未找到：$JAVA_HOME。请先运行 01-init-android-env.ps1"
    exit 1
}
if (-not (Test-Path "$ANDROID_HOME\build-tools\35.0.0")) {
    Write-Error "Android SDK 未找到：$ANDROID_HOME。请先运行 01-init-android-env.ps1"
    exit 1
}
if (-not (Test-Path "node_modules")) {
    Write-Host "安装 npm 依赖..." -ForegroundColor Yellow
    npm install --registry=https://registry.npmmirror.com
}
if (-not (Test-Path "node_modules\@capacitor\cli")) {
    Write-Host "安装 Capacitor..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli @capacitor/android --save --registry=https://registry.npmmirror.com
}

# 兼容项目路径含中文
$gradleProps = "android\gradle.properties"
if (-not (Select-String -Path $gradleProps -Pattern "android.overridePathCheck" -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content -Path $gradleProps -Value "`nandroid.overridePathCheck=true"
}

Write-Host "`n=== 1/3 构建 Next.js 静态文件 ===" -ForegroundColor Cyan
npx next build
if ($LASTEXITCODE -ne 0) { throw "next build 失败" }

Write-Host "`n=== 2/3 同步到 Capacitor ===" -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync 失败" }

Write-Host "`n=== 3/3 编译 APK ===" -ForegroundColor Cyan
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

Push-Location android
try {
    .\gradlew.bat assembleDebug --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Gradle 构建失败" }
} finally {
    Pop-Location
}

$apk = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $size = [math]::Round((Get-Item $apk).Length / 1MB, 2)
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  APK 构建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  文件: $((Get-Item $apk).FullName)"
    Write-Host "  大小: $size MB"
    Write-Host "  时间: $((Get-Item $apk).LastWriteTime)"
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Error "APK 未生成，请检查构建日志"
}

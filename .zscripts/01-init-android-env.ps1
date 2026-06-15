# ============================================================
# 01-init-android-env.ps1  -  一次性 Android 构建环境初始化
# ============================================================
# 用法：右键 "使用 PowerShell 运行"，或管理员 PowerShell 中执行
# 注意：需要 curl.exe（Win10+ 自带）和 tar（Win10+ 自带）

$ErrorActionPreference = "Stop"

$ANDROID_HOME  = "$env:USERPROFILE\android-sdk"
$JAVA_HOME    = "$env:USERPROFILE\.jdks\temurin-22"
$GRADLE_USER  = "$env:USERPROFILE\.gradle"

Write-Host "=== 检查 Java ===" -ForegroundColor Cyan
if (-not (Test-Path "$JAVA_HOME\bin\java.exe")) {
    Write-Error "需要 JDK。请通过 IntelliJ / Android Studio 安装，或放至 $JAVA_HOME"
    exit 1
}
& "$JAVA_HOME\bin\java.exe" -version 2>&1 | Select-Object -First 1

# ---- 下载 Android cmdline-tools ----
$TOOLS_ZIP = "$env:TEMP\android-cmdline-tools.zip"
if (-not (Test-Path "$ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "`n=== 下载 Android cmdline-tools ===" -ForegroundColor Cyan
    curl.exe -L -o $TOOLS_ZIP `
        "https://mirrors.cloud.tencent.com/AndroidSDK/commandlinetools-win-11076708_latest.zip" `
        --connect-timeout 30 --max-time 900 -#
    Write-Host "解压..."
    New-Item -ItemType Directory -Force -Path "$ANDROID_HOME\cmdline-tools\latest" | Out-Null
    tar -xf $TOOLS_ZIP -C "$ANDROID_HOME\cmdline-tools\latest"
    # 修正嵌套目录
    $nested = "$ANDROID_HOME\cmdline-tools\latest\cmdline-tools"
    if (Test-Path $nested) {
        Get-ChildItem $nested | Move-Item -Destination "$ANDROID_HOME\cmdline-tools\latest" -Force
        Remove-Item $nested -Force
    }
    Remove-Item $TOOLS_ZIP -Force
    Write-Host "cmdline-tools 安装完成" -ForegroundColor Green
} else {
    Write-Host "cmdline-tools 已存在，跳过" -ForegroundColor Yellow
}

# ---- 下载 Build Tools 35.0.0 ----
if (-not (Test-Path "$ANDROID_HOME\build-tools\35.0.0\aapt.exe")) {
    Write-Host "`n=== 下载 Build Tools 35.0.0 ===" -ForegroundColor Cyan
    $BT_ZIP = "$env:TEMP\build-tools-35.zip"
    curl.exe -L -o $BT_ZIP `
        "https://dl.google.com/android/repository/build-tools_r35_windows.zip" `
        --connect-timeout 30 --max-time 1200 -#
    New-Item -ItemType Directory -Force -Path "$ANDROID_HOME\build-tools" | Out-Null
    Remove-Item -Recurse -Force "$ANDROID_HOME\build-tools\35.0.0" -ErrorAction SilentlyContinue
    tar -xf $BT_ZIP -C "$ANDROID_HOME\build-tools"
    # 重命名为版本号
    $extracted = Get-ChildItem "$ANDROID_HOME\build-tools" -Directory | Where-Object { $_.Name -ne "35.0.0" } | Select-Object -First 1
    if ($extracted) {
        Rename-Item $extracted.FullName "35.0.0" -Force
    }
    @"
Pkg.UserSrc=false
Pkg.Revision=35.0.0
"@ | Set-Content "$ANDROID_HOME\build-tools\35.0.0\source.properties"
    Remove-Item $BT_ZIP -Force
    Write-Host "Build Tools 安装完成" -ForegroundColor Green
} else {
    Write-Host "Build Tools 35.0.0 已存在，跳过" -ForegroundColor Yellow
}

# ---- 下载 Android Platform 36 ----
if (-not (Test-Path "$ANDROID_HOME\platforms\android-36\android.jar")) {
    Write-Host "`n=== 下载 Android Platform 36 ===" -ForegroundColor Cyan
    $PLAT_ZIP = "$env:TEMP\platform-36.zip"
    curl.exe -L -o $PLAT_ZIP `
        "https://dl.google.com/android/repository/platform-36_r02.zip" `
        --connect-timeout 30 --max-time 1200 -#
    New-Item -ItemType Directory -Force -Path "$ANDROID_HOME\platforms" | Out-Null
    Remove-Item -Recurse -Force "$ANDROID_HOME\platforms\android-36" -ErrorAction SilentlyContinue
    tar -xf $PLAT_ZIP -C "$ANDROID_HOME\platforms"
    Remove-Item $PLAT_ZIP -Force
    Write-Host "Platform 36 安装完成" -ForegroundColor Green
} else {
    Write-Host "Platform 36 已存在，跳过" -ForegroundColor Yellow
}

# ---- 验证 ----
Write-Host "`n=== 环境验证 ===" -ForegroundColor Cyan
Write-Host "ANDROID_HOME = $ANDROID_HOME"
Write-Host "JAVA_HOME   = $JAVA_HOME"
$ok = $true
@(
    "$ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat",
    "$ANDROID_HOME\build-tools\35.0.0\aapt.exe",
    "$ANDROID_HOME\platforms\android-36\android.jar",
    "$JAVA_HOME\bin\java.exe"
) | ForEach-Object {
    if (Test-Path $_) { Write-Host "  [OK] $_" -ForegroundColor Green }
    else { Write-Host "  [MISS] $_" -ForegroundColor Red; $ok = $false }
}
if ($ok) { Write-Host "`n环境初始化完成！" -ForegroundColor Green }
else     { Write-Host "`n部分组件缺失，请检查" -ForegroundColor Yellow }

Write-Host "`n请将以下环境变量添加到系统/用户环境变量：" -ForegroundColor Yellow
Write-Host "  ANDROID_HOME = $ANDROID_HOME"
Write-Host "  JAVA_HOME    = $JAVA_HOME"

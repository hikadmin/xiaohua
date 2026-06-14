#!/bin/bash
# ============================================
# 小桦 — Android APK 构建脚本
# ============================================
# 
# 前置条件:
# 1. 安装 Android Studio + SDK (API 33+)
# 2. 安装 JDK 17
# 3. 配置环境变量: ANDROID_HOME
# 4. 安装 Node.js 18+ 或 Bun
#
# 使用方法:
#   chmod +x build-android.sh
#   ./build-android.sh          # 构建debug APK
#   ./build-android.sh release   # 构建release APK (需要签名)
#
# 输出:
#   android/app/build/outputs/apk/debug/app-debug.apk
#   android/app/build/outputs/apk/release/app-release.apk

set -e

BUILD_TYPE="${1:-debug}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🌸 小桦 — Android APK 构建"
echo "======================================"
echo "构建类型: $BUILD_TYPE"
echo "项目目录: $PROJECT_DIR"
echo ""

# Step 1: 安装依赖
echo "📦 [1/7] 安装依赖..."
cd "$PROJECT_DIR"
bun install

# Step 2: 构建 Next.js 静态导出
echo "🏗️  [2/7] 构建 Next.js 静态导出..."
cd "$PROJECT_DIR"
OUTPUT_MODE=export bun run build
echo "✅ 静态文件已导出到 out/"

# Step 3: 初始化 Capacitor (如果还没有)
echo "📱 [3/7] 配置 Capacitor..."
cd "$PROJECT_DIR"
if [ ! -d "android" ]; then
    echo "  初始化 Android 平台..."
    npx cap add android
else
    echo "  Android 平台已存在，同步资源..."
fi

# Step 4: 同步 Web 资源
echo "🔄 [4/7] 同步 Web 资源到 Android..."
cd "$PROJECT_DIR"
npx cap sync android

# Step 5: 生成 Android 图标和启动画面资源
echo "🎨 [5/7] 生成 Android 图标和启动画面..."
cd "$PROJECT_DIR"
if [ -f "resources/icon.png" ]; then
    npx cordova-res android --skip-config --copy 2>/dev/null || echo "  ⚠️ cordova-res 执行有警告，继续构建..."
    # 生成自适应图标前景/背景
    python3 -c "
from PIL import Image
import os
icon = Image.open('resources/icon.png').convert('RGBA')
sizes = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
res_dir = 'android/app/src/main/res'
for density, size in sizes.items():
    fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    r = icon.resize((int(size * 0.6), int(size * 0.6)), Image.LANCZOS)
    fg.paste(r, ((size - r.width) // 2, (size - r.height) // 2))
    fg.save(os.path.join(res_dir, f'mipmap-{density}', 'ic_launcher_foreground.png'))
    bg = Image.new('RGBA', (size, size), (15, 20, 25, 255))
    bg.save(os.path.join(res_dir, f'mipmap-{density}', 'ic_launcher_background.png'))
" 2>/dev/null || echo "  ⚠️ 自适应图标生成失败，使用默认图标..."
    echo "  ✅ Android 图标和启动画面已生成"
else
    echo "  ⚠️ 未找到 resources/icon.png，跳过图标生成"
fi

# Step 6: 构建 APK
echo "🔨 [6/7] 构建 Android APK..."
cd "$PROJECT_DIR/android"

if [ "$BUILD_TYPE" = "release" ]; then
    echo "  构建 Release APK..."
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    echo "  构建 Debug APK..."
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

# Step 7: 输出结果
echo ""
echo "======================================"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "✅ APK 构建成功！"
    echo "📁 文件路径: $PROJECT_DIR/android/$APK_PATH"
    echo "📊 文件大小: $APK_SIZE"
else
    echo "❌ APK 构建失败，请检查错误日志"
    exit 1
fi

echo ""
echo "💡 后续步骤:"
echo "  - 安装到设备: adb install $APK_PATH"
echo "  - 打开 Android Studio: npx cap open android"
echo "  - 查看日志: adb logcat | grep -i 小桦"

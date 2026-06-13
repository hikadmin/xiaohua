import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luna.periodtracker',
  appName: '经期来了',
  webDir: 'out',                   // Next.js 静态导出目录
  server: {
    // 开发时可以指向 dev server 实现热更新
    // url: 'http://10.0.2.2:3000',  // Android 模拟器访问本机
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f1419',
      showSpinner: true,
      spinnerColor: '#e07a5f',
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f1419',
    },
    App: {
      launchAutoHide: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;

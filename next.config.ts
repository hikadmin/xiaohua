import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 默认 standalone 模式（开发/服务端渲染）
  // 打包 APK 时使用: OUTPUT_MODE=export bun run build
  output: process.env.OUTPUT_MODE === "export" ? "export" : "standalone",
  
  // 静态导出时需要禁用图片优化
  images: {
    unoptimized: process.env.OUTPUT_MODE === "export" ? true : false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: false,
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出 - 适配 GitHub Pages / Vercel 静态托管
  output: "export",
  // 图片关闭优化 - 静态导出必须
  images: {
    unoptimized: true,
  },
  // trailing slash - GitHub Pages 路由兼容
  trailingSlash: true,
  // 禁用源映射生产环境（可选，减少体积）
  productionBrowserSourceMaps: false,
  // GLSL 着色器资源 loader
  webpack: (config, { isServer }) => {
    // GLSL / frag / vert 文件以 raw 字符串导入
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: "raw-loader",
    });

    // 服务端不打包 three.js 相关（避免 SSR 问题）
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        three: "three",
      });
    }

    return config;
  },
  // 构建时忽略 TypeScript 错误（保证导出成功，错误由 type-check 单独校验）
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint 不阻断构建
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 实验性：优化包体积
  experimental: {
    optimizePackageImports: ["three", "@react-three/fiber", "@react-three/drei"],
  },
};

module.exports = nextConfig;

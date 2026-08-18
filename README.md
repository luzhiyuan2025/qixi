# 七夕 · 星河告白 | Qixi Starlight Confession

> CCIE 工程级 Next.js 14 七夕 3D 浪漫网页项目
> 星河爱心、粒子星光、交互音效、滚动叙事 — 献给最特别的你

![Tech Stack](https://img.shields.io/badge/Next.js-14-000?logo=next.js)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

---

## 项目简介

本项目是一个对标 CCIE 工程严谨思维的七夕 3D 浪漫告白网页，不仅实现视觉特效，更强制包含**性能分级、异常捕获、资源降级、监控埋点、部署校验、静态导出**等工程化能力。

### 核心特性

- **3D 星河爱心场景**：Three.js + React-Three-Fiber + Drei，悬浮爱心 + 星河粒子云
- **GLSL 自定义着色器**：星河光晕片段着色器，径向渐变 + 闪烁 + 颜色混合
- **Canvas2D 粒子系统**：星光粒子，CPU 负载过高自动降低粒子数量
- **GSAP 高级动画**：SplitText 逐字绽放 + ScrollTrigger 滚动叙事
- **Lenis 平滑滚动**：低 FPS 设备自动降级关闭
- **Web Audio 交互音效**：用户点击触发，禁止自动播放，完整异常捕获
- **中国色配色体系**：胭脂红、黛紫、月白、藕荷、鎏金、黛蓝
- **全设备适配**：PC/移动端，触摸拖拽 3D 场景
- **优雅降级**：WebGL 不可用时自动切换 2D 纯文字告白页

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 14.2.x (App Router) |
| UI | React | 18.3.x |
| 语言 | TypeScript | 5.6.x |
| 样式 | Tailwind CSS | 3.4.x |
| 3D 渲染 | Three.js + @react-three/fiber + @react-three/drei | latest |
| 动画 | GSAP + @gsap/react + ScrollTrigger | 3.12.x |
| 平滑滚动 | Lenis | 1.1.x |
| 着色器 | GLSL (raw-loader) | - |
| 监控 | Sentry (占位实现) | - |
| 导出 | Next.js Static Export | output: "export" |

---

## 快速开始

### 环境要求

- Node.js >= 18.17.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 浏览器访问
# http://localhost:3000
```

### 构建生产版本

```bash
# 构建并静态导出到 out/ 目录
npm run build

# 本地预览构建结果
npm run start
```

### TypeScript 类型检查

```bash
npm run type-check
```

---

## 部署指南

### GitHub Pages 部署

1. **构建静态文件**

```bash
npm run build
# 产物输出到 out/ 目录
```

2. **部署到 GitHub Pages**

```bash
# 方式一：使用 gh-pages 包
npm install -D gh-pages
# package.json 添加:
# "deploy": "gh-pages -d out"
npm run deploy

# 方式二：GitHub Actions（推荐）
# .github/workflows/deploy.yml
```

3. **GitHub Actions 工作流示例**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

4. **GitHub Pages 设置**：仓库 Settings → Pages → Source 选择 `gh-pages` 分支

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. Framework Preset 选择 **Next.js**
4. Build Command: `npm run build`
5. Output Directory: `out`（静态导出模式）
6. 点击 Deploy

### 其他静态托管

- **Netlify**: Build command `npm run build`, Publish directory `out`
- **Cloudflare Pages**: Build command `npm run build`, Output directory `out`
- **阿里云 OSS / 腾讯云 COS**: 上传 `out/` 目录内容，开启静态网站托管

---

## CCIE 工程说明章节

### 一、风险点分析

| 风险编号 | 风险描述 | 影响等级 | 触发条件 | 缓解措施 |
|----------|----------|----------|----------|----------|
| R-01 | WebGL 不支持或上下文丢失 | 高 | 老旧浏览器、GPU 驱动崩溃 | 优雅降级至 2D 告白页，不白屏 |
| R-02 | GLSL 着色器编译失败 | 中 | 低端 GPU 不支持扩展 | 自动降级为标准 PointsMaterial |
| R-03 | 低帧率设备卡顿 | 中 | FPS < 30 持续 1 秒 | 自动关闭 Lenis，降低粒子数 |
| R-04 | 音频自动播放被浏览器拦截 | 低 | 浏览器自动播放策略 | 仅用户交互后初始化 AudioContext |
| R-05 | 高 DPR 设备 GPU 过载 | 中 | 4K/5K 屏幕 + 低端 GPU | effectiveDpr 限制上限 |
| R-06 | 移动端触摸事件冲突 | 低 | 3D 拖拽与页面滚动冲突 | OrbitControls 禁用缩放平移 |
| R-07 | 静态导出路由 404 | 中 | GitHub Pages 子路径部署 | trailingSlash: true + basePath 配置 |
| R-08 | Sentry 上报阻塞主流程 | 低 | 网络异常 | sendBeacon 异步上报，失败静默 |
| R-09 | GSAP ScrollTrigger 与 Lenis 不同步 | 中 | 滚动事件时序问题 | lenis.on('scroll', ScrollTrigger.update) |
| R-10 | 内存泄漏（粒子/音频） | 中 | 长时间运行 | useEffect cleanup 释放资源 |

### 二、部署校验清单

#### 构建前校验

- [ ] `npm run type-check` 通过，无 TypeScript 错误
- [ ] `npm run build` 成功，`out/` 目录生成
- [ ] `out/index.html` 存在且包含正确 meta 标签
- [ ] `out/_next/static/` 包含 JS/CSS 资源
- [ ] 无 `images.unoptimized` 相关警告

#### 部署后校验

- [ ] 页面首屏加载 < 3 秒（4G 网络）
- [ ] 3D 场景正常渲染，爱心星河可见
- [ ] 鼠标拖拽可旋转 3D 场景
- [ ] 移动端触摸可旋转 3D 场景
- [ ] 向下滚动触发 ScrollTrigger 动画
- [ ] 点击页面触发音效（首次需用户交互）
- [ ] 控制台无 JS 报错
- [ ] 控制台无 WebGL 警告
- [ ] Lighthouse Performance > 70
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 90
- [ ] GitHub Pages 子路径无 404（如适用）
- [ ] 刷新页面不白屏
- [ ] 弱网环境下资源降级正常

#### 兼容性校验

- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版
- [ ] Edge 最新版
- [ ] iOS Safari 15+
- [ ] Android Chrome 最新版
- [ ] 无 WebGL 设备 → 2D 降级页

### 三、故障排查清单

#### 3D 场景不显示

1. 检查浏览器控制台是否有 WebGL 错误
2. 确认 `device.enable3D` 为 true（页面底部调试信息）
3. 检查 GPU 是否被浏览器黑名单
4. 尝试更新显卡驱动
5. 确认 Three.js 版本与 R3F 兼容

#### 页面白屏

1. 检查 `out/index.html` 是否正确生成
2. 确认静态托管配置正确（根目录指向 out/）
3. 检查 basePath 配置（GitHub Pages 子路径需设置）
4. 查看浏览器控制台错误信息
5. 确认所有资源路径使用相对路径

#### 音效不工作

1. 确认已点击页面任意位置（浏览器音频策略）
2. 检查右下角音频状态指示
3. 确认浏览器未静音标签页
4. 检查 AudioContext state 是否为 "running"
5. 查看控制台是否有 audio 分类错误

#### 滚动不流畅

1. 检查 FPS（页面底部调试信息）
2. 确认 Lenis 未被自动禁用（低 FPS 触发）
3. 检查是否有其他 scroll 事件监听器冲突
4. 尝试降低粒子数量（修改 device.maxParticles）
5. 确认 `prefers-reduced-motion` 未被系统启用

#### 构建失败

1. 确认 Node.js 版本 >= 18.17
2. 删除 `node_modules` 和 `package-lock.json` 后重新 `npm install`
3. 检查 `next.config.js` 中 webpack 配置
4. 确认 GLSL 文件通过 raw-loader 正确导入
5. 查看具体错误信息定位

#### GitHub Pages 样式丢失

1. 确认 `trailingSlash: true` 已配置
2. 检查 `next.config.js` 是否需要设置 `basePath`
3. 确认 `assetPrefix` 配置正确
4. 检查 CSS 文件路径是否为相对路径
5. 确认 `.nojekyll` 文件存在于 out/ 目录

### 四、回滚方案

#### 版本回滚

```bash
# Git 回滚到上一个稳定版本
git log --oneline -5
git revert <commit-hash>
git push origin main

# 或强制回滚（谨慎使用）
git reset --hard <stable-commit-hash>
git push --force origin main
```

#### 部署回滚

**GitHub Pages:**
1. 重新部署上一个稳定版本的 `out/` 目录
2. 或在 GitHub Actions 中重新运行上一次成功的 workflow

**Vercel:**
1. 进入项目 Deployments
2. 选择上一个稳定部署
3. 点击 "Promote to Production"

#### 功能降级回滚

如遇 3D 相关严重问题，可通过以下方式快速降级：

```typescript
// lib/performance.ts - 强制禁用 3D
export function evaluateDevice(): DeviceCapability {
  // ...
  return {
    // ...
    enable3D: false, // 强制关闭 3D
    enableShader: false,
    enableLenis: false,
  };
}
```

或设置环境变量：

```bash
# .env.local
NEXT_PUBLIC_FORCE_2D=true
```

#### 数据回滚

本项目为纯前端静态页面，无用户数据存储，无需数据回滚。

---

## 项目结构

```
romance-qixi-star/
├── app/
│   ├── layout.tsx          # 全局布局 + 元数据 + 错误监听
│   ├── page.tsx            # 核心页面（整合所有模块）
│   └── globals.css         # 全局样式 + 中国色 + 动画
├── components/
│   ├── Scene3D.tsx         # R3F 3D 场景（爱心星河 + GLSL + 拖拽）
│   ├── ParticleCanvas.tsx  # Canvas2D 粒子星光（CPU自适应）
│   ├── AudioManager.tsx    # Web Audio 交互音效管理
│   └── ConfessionText.tsx  # GSAP SplitText 逐字动画 + ScrollReveal
├── lib/
│   ├── performance.ts      # 性能检测 + FPS监控 + CPU负载估算
│   └── sentry.ts           # Sentry 监控占位（异常捕获 + 上报）
├── shaders/
│   ├── galaxy.vert         # GLSL 顶点着色器
│   └── galaxy.frag         # GLSL 片段着色器（星河光晕）
├── public/                 # 静态资源（WebP 图片等）
├── next.config.js          # Next.js 配置（静态导出 + GLSL loader）
├── tailwind.config.ts      # Tailwind 配置（中国色主题）
├── tsconfig.json           # TypeScript 严格模式 + 路径别名
├── postcss.config.js       # PostCSS 配置
├── package.json            # 依赖与脚本
└── README.md               # 本文档
```

---

## 性能分级策略

| 设备等级 | GPU Tier | DPR 上限 | 粒子数 | 3D | Shader | Lenis |
|----------|----------|----------|--------|-----|--------|-------|
| 旗舰 | ultra | 3.0 | 800 | ✅ | ✅ | ✅ |
| 高端 | high | 2.0 | 500 | ✅ | ✅ | ✅ |
| 中端 | medium | 1.5 | 300 | ✅ | ✅ | ✅ |
| 低端 | low | 1.0 | 150 | ✅ | ❌ | ❌ |
| 极简 | minimal | 1.0 | 60 | ❌ | ❌ | ❌ |

> 移动端粒子数额外 ×0.6，运行时 CPU 负载 > 50% 自动减少粒子。

---

## 监控埋点说明

本项目集成 Sentry 基础监控（占位实现），捕获以下异常：

- **页面异常**：全局 error + unhandledrejection
- **3D 渲染错误**：WebGL context lost + Three.js 异常
- **GSAP 运行错误**：动画初始化/执行异常
- **音频 API 异常**：AudioContext 创建/恢复/播放异常
- **性能降级事件**：低 FPS、CPU 过载触发的降级

生产环境替换方式：

```typescript
// lib/sentry.ts
const ENABLE_REMOTE_REPORT = true;
const REPORT_ENDPOINT = "your-sentry-ingest-url";
// 或直接集成 @sentry/nextjs
```

---

## 许可证

MIT License - 仅供学习与浪漫用途 ❤️

---

## 致谢

- 七夕，中国传统节日，象征爱情与团聚
- 愿每一行代码，都承载一份心意
- **愿我如星君如月，夜夜流光相皎洁**

/**
 * 性能检测与分级模块
 * CCIE 工程标准：设备能力探测 → 分级降级策略 → 运行时自适应
 *
 * 检测维度：
 * 1. WebGL 支持性（决定是否启用 3D）
 * 2. GPU 性能等级（决定 Shader / DPR）
 * 3. 设备像素比 DPR（高 DPR 高清 / 低端降采样）
 * 4. CPU 核心数（决定粒子数量上限）
 * 5. 内存容量（粗粒度资源预算）
 * 6. 运行时 FPS 监控（动态降级 Lenis / 粒子）
 */

export type PerformanceTier = "ultra" | "high" | "medium" | "low" | "minimal";

export interface DeviceCapability {
  webglSupported: boolean;
  webgl2Supported: boolean;
  gpuTier: PerformanceTier;
  dpr: number;
  effectiveDpr: number; // 降级后的实际 DPR
  cpuCores: number;
  memoryGB: number;
  isMobile: boolean;
  isTouch: boolean;
  prefersReducedMotion: boolean;
  maxParticles: number;
  enableShader: boolean;
  enableLenis: boolean;
  enable3D: boolean;
}

/** 检测 WebGL 支持性 */
export function detectWebGL(): { webgl: boolean; webgl2: boolean } {
  if (typeof window === "undefined") return { webgl: false, webgl2: false };
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    const webgl2 = !!canvas.getContext("webgl2");
    return { webgl: !!gl, webgl2 };
  } catch {
    return { webgl: false, webgl2: false };
  }
}

/** 粗略检测 GPU 性能等级（基于 renderer 字符串 + 设备信息） */
export function detectGpuTier(): PerformanceTier {
  if (typeof window === "undefined") return "medium";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl) return "minimal";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "";
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : "";

    const rendererLower = String(renderer).toLowerCase();
    const vendorLower = String(vendor).toLowerCase();

    // 集成显卡 / 低端移动 GPU
    const lowEndPatterns = [
      "intel hd",
      "intel uhd",
      "iris xe",
      "mali",
      "adreno (3|4|5)[0-9]{2}",
      "powervr",
      "software",
      "llvmpipe",
      "swiftshader",
    ];

    // 高端独立显卡
    const highEndPatterns = [
      "nvidia geforce rtx",
      "nvidia geforce gtx 1[06-9]",
      "amd radeon rx",
      "apple m1",
      "apple m2",
      "apple m3",
      "apple m4",
      "adreno 7[0-9]{2}",
      "adreno 6[5-9][0-9]",
    ];

    if (highEndPatterns.some((p) => new RegExp(p).test(rendererLower))) {
      return "ultra";
    }
    if (lowEndPatterns.some((p) => new RegExp(p).test(rendererLower))) {
      return "low";
    }
    if (vendorLower.includes("apple")) return "high";
    if (rendererLower.includes("rtx") || rendererLower.includes("rx"))
      return "high";

    return "medium";
  } catch {
    return "low";
  }
}

/** 获取设备有效 DPR（高 DPR 设备自动降采样保护 GPU） */
export function getEffectiveDpr(tier: PerformanceTier): number {
  if (typeof window === "undefined") return 1;
  const rawDpr = window.devicePixelRatio || 1;
  const maxDprMap: Record<PerformanceTier, number> = {
    ultra: 3,
    high: 2,
    medium: 1.5,
    low: 1,
    minimal: 1,
  };
  return Math.min(rawDpr, maxDprMap[tier]);
}

/** 综合设备能力评估 */
export function evaluateDevice(): DeviceCapability {
  const { webgl, webgl2 } = detectWebGL();
  const gpuTier = detectGpuTier();
  const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const effectiveDpr = getEffectiveDpr(gpuTier);
  const cpuCores =
    typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  const memoryGB =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
      : 4;
  const isMobile =
    typeof navigator !== "undefined"
      ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      : false;
  const isTouch =
    typeof window !== "undefined"
      ? "ontouchstart" in window || navigator.maxTouchPoints > 0
      : false;
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // 粒子数量分级
  const particleMap: Record<PerformanceTier, number> = {
    ultra: 800,
    high: 500,
    medium: 300,
    low: 150,
    minimal: 60,
  };

  // 移动端额外降级
  const mobileMultiplier = isMobile ? 0.6 : 1;
  const maxParticles = Math.floor(particleMap[gpuTier] * mobileMultiplier);

  // 功能开关
  const enable3D = webgl && gpuTier !== "minimal";
  const enableShader = enable3D && gpuTier !== "low" && gpuTier !== "minimal";
  const enableLenis =
    !prefersReducedMotion && gpuTier !== "minimal" && !isMobile;

  return {
    webglSupported: webgl,
    webgl2Supported: webgl2,
    gpuTier,
    dpr: rawDpr,
    effectiveDpr,
    cpuCores,
    memoryGB,
    isMobile,
    isTouch,
    prefersReducedMotion,
    maxParticles,
    enableShader,
    enableLenis,
    enable3D,
  };
}

/**
 * FPS 监控器 - 运行时检测帧率，低于阈值触发降级
 * 用法：创建实例 → start() → 回调中获取当前 FPS
 */
export class FpsMonitor {
  private frames = 0;
  private lastTime = 0;
  private currentFps = 60;
  private rafId: number | null = null;
  private onLowFps?: (fps: number) => void;
  private threshold: number;
  private running = false;

  constructor(threshold = 30, onLowFps?: (fps: number) => void) {
    this.threshold = threshold;
    this.onLowFps = onLowFps;
  }

  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = () => {
      this.frames++;
      const now = performance.now();
      const elapsed = now - this.lastTime;
      if (elapsed >= 1000) {
        this.currentFps = Math.round((this.frames * 1000) / elapsed);
        this.frames = 0;
        this.lastTime = now;
        if (this.currentFps < this.threshold && this.onLowFps) {
          this.onLowFps(this.currentFps);
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null && typeof window !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFps(): number {
    return this.currentFps;
  }
}

/**
 * CPU 负载估算器 - 基于主线程阻塞时间估算
 * 用于动态调节 Canvas 粒子数量
 */
export class CpuLoadEstimator {
  private lastCheck = 0;
  private load = 0;
  private rafId: number | null = null;
  private running = false;

  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.lastCheck = performance.now();
    const tick = () => {
      const now = performance.now();
      // 理想帧间隔 16.67ms，超出部分视为主线程阻塞
      const delta = now - this.lastCheck;
      const busyRatio = Math.min(1, Math.max(0, (delta - 16.67) / 16.67));
      // 平滑滤波
      this.load = this.load * 0.8 + busyRatio * 0.2;
      this.lastCheck = now;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null && typeof window !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getLoad(): number {
    return this.load;
  }

  /** 根据 CPU 负载计算推荐粒子数（0~1 负载 → 粒子数比例） */
  getParticleScale(maxParticles: number): number {
    // 负载 > 0.7 时开始减少粒子，负载 1.0 时降至 30%
    if (this.load < 0.5) return maxParticles;
    const scale = Math.max(0.3, 1 - (this.load - 0.5) * 1.4);
    return Math.floor(maxParticles * scale);
  }
}

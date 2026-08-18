"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  evaluateDevice,
  FpsMonitor,
  type DeviceCapability,
} from "@/lib/performance";
import { captureError, registerGlobalErrorHandlers } from "@/lib/sentry";
import ParticleCanvas from "@/components/ParticleCanvas";
import ConfessionText, { ScrollReveal } from "@/components/ConfessionText";
import { useAudioManager } from "@/components/AudioManager";

// 注册 GSAP 插件
gsap.registerPlugin(ScrollTrigger);

// 3D 场景动态导入（禁用 SSR，避免 WebGL 服务端报错）
const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <div className="text-yuebai/50 text-sm animate-pulse">星河加载中…</div>
    </div>
  ),
});

// ===== 2D 降级备用告白页面 =====
function FallbackConfession() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-night px-6">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-8 animate-heartbeat inline-block">❤️</div>
        <h1 className="text-4xl md:text-5xl font-serif text-gradient-romance mb-6 leading-relaxed">
          七夕快乐
        </h1>
        <p className="text-xl md:text-2xl text-yuebai/80 leading-loose mb-4 font-serif">
          愿我如星君如月，夜夜流光相皎洁。
        </p>
        <p className="text-lg text-ouhe/70 leading-loose">
          穿越人海，跨越星河，
          <br />
          我只想对你说一句：我爱你。
        </p>
        <div className="mt-12 text-liujin/60 text-sm">
          — 2026 七夕 · 致最特别的你 —
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  // ===== 设备能力评估 =====
  const [device, setDevice] = useState<DeviceCapability | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);
  const fpsMonitorRef = useRef<FpsMonitor | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // 音频管理器
  const { initAudio, playSound, isReady: audioReady } = useAudioManager(true);

  // ===== 初始化设备检测 =====
  useEffect(() => {
    try {
      registerGlobalErrorHandlers();
      const cap = evaluateDevice();
      setDevice(cap);
      captureError(
        "performance",
        `Device tier: ${cap.gpuTier}, 3D: ${cap.enable3D}, Shader: ${cap.enableShader}, Lenis: ${cap.enableLenis}`,
        {
          gpuTier: cap.gpuTier,
          dpr: cap.dpr,
          effectiveDpr: cap.effectiveDpr,
          cpuCores: cap.cpuCores,
          isMobile: cap.isMobile,
        },
        "info"
      );
    } catch (err) {
      captureError(
        "page",
        err instanceof Error ? err : new Error(String(err)),
        { phase: "device-eval" }
      );
      // 降级：默认最低配置
      setDevice({
        webglSupported: false,
        webgl2Supported: false,
        gpuTier: "minimal",
        dpr: 1,
        effectiveDpr: 1,
        cpuCores: 2,
        memoryGB: 2,
        isMobile: false,
        isTouch: false,
        prefersReducedMotion: false,
        maxParticles: 60,
        enableShader: false,
        enableLenis: false,
        enable3D: false,
      });
    }
  }, []);

  // ===== Lenis 平滑滚动（低 FPS 自动降级） =====
  useEffect(() => {
    if (!device || !device.enableLenis) return;

    try {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
      });
      lenisRef.current = lenis;

      let rafId: number;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      // 同步 ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);

      // FPS 监控 - 低于 30fps 自动关闭 Lenis
      const fpsMonitor = new FpsMonitor(30, (fps) => {
        captureError(
          "performance",
          `Low FPS detected (${fps}), disabling Lenis smooth scroll`,
          { fps },
          "warning"
        );
        lenis.destroy();
        lenisRef.current = null;
      });
      fpsMonitor.start();
      fpsMonitorRef.current = fpsMonitor;

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        fpsMonitor.stop();
      };
    } catch (err) {
      captureError(
        "page",
        err instanceof Error ? err : new Error(String(err)),
        { phase: "lenis-init" }
      );
    }
  }, [device]);

  // ===== GSAP 滚动叙事动画 =====
  useGSAP(
    () => {
      if (!mainRef.current || !device) return;
      try {
        // 首屏标题入场
        gsap.from(".hero-title", {
          opacity: 0,
          y: 60,
          duration: 1.5,
          delay: 0.5,
          ease: "power3.out",
        });

        gsap.from(".hero-subtitle", {
          opacity: 0,
          y: 30,
          duration: 1.2,
          delay: 1,
          ease: "power3.out",
        });

        gsap.from(".hero-hint", {
          opacity: 0,
          duration: 1,
          delay: 2,
          ease: "power2.out",
        });

        // 滚动视差 - 3D 场景随滚动微缩放
        gsap.to(".scene-wrapper", {
          scale: 0.85,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: ".section-confession",
            start: "top bottom",
            end: "top top",
            scrub: 1,
          },
        });

        // 刷新 ScrollTrigger
        ScrollTrigger.refresh();
      } catch (err) {
        captureError(
          "gsap",
          err instanceof Error ? err : new Error(String(err)),
          { phase: "page-animations" }
        );
      }
    },
    { scope: mainRef, dependencies: [device] }
  );

  // ===== WebGL 失败回调 =====
  const handle3DError = useCallback(() => {
    setWebglFailed(true);
    captureError("webgl", new Error("3D scene initialization failed, falling back to 2D"), {}, "warning");
  }, []);

  // ===== 用户交互触发音频 =====
  const handleUserInteraction = useCallback(() => {
    if (!audioEnabled) {
      initAudio();
      setAudioEnabled(true);
      setShowHint(false);
    }
    if (audioReady) {
      playSound("chime");
    }
  }, [audioEnabled, audioReady, initAudio, playSound]);

  // 点击爱心触发心跳音效
  const handleHeartClick = useCallback(() => {
    handleUserInteraction();
    if (audioReady) {
      playSound("heartbeat");
    }
  }, [handleUserInteraction, audioReady, playSound]);

  // 隐藏交互提示（3秒后）
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== 加载中状态 =====
  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-night">
        <div className="text-yuebai/60 text-lg animate-pulse">星河正在点亮…</div>
      </div>
    );
  }

  // ===== WebGL 不可用 / 3D 失败 → 优雅降级 =====
  if (!device.enable3D || webglFailed) {
    return <FallbackConfession />;
  }

  // ===== 主页面 =====
  return (
    <div
      ref={mainRef}
      className="relative min-h-screen bg-gradient-night overflow-x-hidden"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* ===== 3D 星河场景（固定背景） ===== */}
      <div className="scene-wrapper fixed inset-0 z-0">
        <Scene3D device={device} onError={handle3DError} />
      </div>

      {/* ===== Canvas2D 粒子星光叠加层 ===== */}
      <ParticleCanvas maxParticles={device.maxParticles} enabled={true} />

      {/* ===== 首屏 Hero ===== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-4xl">
          {/* 七夕标题 - GSAP 逐字绽放 */}
          <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 text-gradient-romance glow-yanzhi">
            七夕 · 星河告白
          </h1>

          {/* 副标题 */}
          <p className="hero-subtitle text-xl md:text-2xl text-yuebai/70 font-serif leading-relaxed mb-4">
            愿我如星君如月，夜夜流光相皎洁
          </p>
          <p className="hero-subtitle text-base md:text-lg text-ouhe/60 leading-relaxed">
            穿越亿万光年，只为在这一天，对你说一句藏了很久的话
          </p>

          {/* 可点击爱心 */}
          <div
            className="hero-hint mt-12 cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              handleHeartClick();
            }}
          >
            <span className="text-7xl md:text-8xl inline-block animate-heartbeat hover:scale-110 transition-transform">
              ❤️
            </span>
          </div>

          {/* 交互提示 */}
          {showHint && (
            <div className="hero-hint mt-8 text-yuebai/40 text-sm animate-pulse">
              <p>↓ 向下滚动，开启告白叙事 ↓</p>
              <p className="mt-2 text-xs">点击任意位置 · 开启星河音效</p>
            </div>
          )}
        </div>

        {/* 滚动指示器 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-yuebai/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* ===== 告白叙事段落 1 ===== */}
      <section className="section-confession relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <ScrollReveal direction="up" className="max-w-3xl text-center">
          <div className="glass-card p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-serif text-gradient-gold mb-8">
              遇见你的那一刻
            </h2>
            <div className="space-y-6 text-lg md:text-xl text-yuebai/80 leading-loose font-serif">
              <p>
                你是我平淡生命里突然闯入的星光，
                <br />
                是我漫长等待中终于抵达的答案。
              </p>
              <p className="text-ouhe/70">
                从此山川湖海，日月星辰，
                <br />
                皆因你而有了意义。
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== 告白叙事段落 2 ===== */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <ScrollReveal direction="scale" className="max-w-3xl text-center">
          <div className="glass-card p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-serif text-gradient-romance mb-8">
              想对你说的话
            </h2>
            <div className="space-y-6 text-lg md:text-xl text-yuebai/80 leading-loose font-serif">
              <p>
                我想和你一起看春日的樱，夏日的星，
                <br />
                秋日的枫，冬日的雪。
              </p>
              <p>
                想牵你的手走过每一条街道，
                <br />
                想在每个清晨对你说早安，
                <br />
                想在每个夜晚对你说晚安。
              </p>
              <p className="text-2xl md:text-3xl text-yanzhi-400 glow-yanzhi mt-8">
                我爱你，不止七夕，更在朝朝夕夕。
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== 结尾 ===== */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <ScrollReveal direction="up" className="text-center">
          <div className="text-8xl mb-8 animate-heartbeat">💫</div>
          <h2 className="text-4xl md:text-6xl font-serif text-gradient-romance glow-daizi mb-6">
            七夕快乐
          </h2>
          <p className="text-xl text-yuebai/60 font-serif">
            愿天下有情人终成眷属
          </p>
          <p className="mt-12 text-liujin/50 text-sm">
            — 2026 · 七月初七 · 致我最爱的你 —
          </p>

          {/* 性能信息（调试用，生产可隐藏） */}
          <div className="mt-16 text-yuebai/20 text-xs font-mono">
            <p>
              GPU: {device.gpuTier} | DPR: {device.effectiveDpr.toFixed(1)} |
              Particles: {device.maxParticles} | 3D:{" "}
              {device.enable3D ? "ON" : "OFF"} | Shader:{" "}
              {device.enableShader ? "ON" : "OFF"}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== 音频状态指示 ===== */}
      <div className="fixed bottom-4 right-4 z-50 text-yuebai/30 text-xs font-mono">
        {audioReady ? "🔊 音效已开启" : "🔇 点击开启音效"}
      </div>
    </div>
  );
}

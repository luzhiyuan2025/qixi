"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CpuLoadEstimator } from "@/lib/performance";
import { captureError } from "@/lib/sentry";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
}

// 中国色粒子调色板
const PARTICLE_COLORS = [
  "#f0f5ff", // 月白
  "#e4c6d0", // 藕荷
  "#d12c2c", // 胭脂红
  "#7c3aed", // 黛紫
  "#f0d060", // 鎏金
];

export default function ParticleCanvas({
  maxParticles,
  enabled = true,
}: {
  maxParticles: number;
  enabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const cpuEstimatorRef = useRef<CpuLoadEstimator | null>(null);
  const currentParticleCountRef = useRef(maxParticles);
  const [currentCount, setCurrentCount] = useState(maxParticles);

  // 初始化粒子
  const createParticle = useCallback(
    (width: number, height: number): Particle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        color:
          PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      };
    },
    []
  );

  // 调整粒子数量
  const adjustParticleCount = useCallback(
    (target: number, width: number, height: number) => {
      const particles = particlesRef.current;
      if (target > particles.length) {
        for (let i = particles.length; i < target; i++) {
          particles.push(createParticle(width, height));
        }
      } else if (target < particles.length) {
        particles.length = target;
      }
      currentParticleCountRef.current = target;
    },
    [createParticle]
  );

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      captureError("page", new Error("Canvas 2D context not available"), {}, "warning");
      return;
    }

    // 设置画布尺寸（DPR 适配）
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // 初始化粒子
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = [];
    for (let i = 0; i < maxParticles; i++) {
      particlesRef.current.push(createParticle(rect.width, rect.height));
    }

    // 启动 CPU 负载监控
    const cpuEstimator = new CpuLoadEstimator();
    cpuEstimator.start();
    cpuEstimatorRef.current = cpuEstimator;

    // 动画循环
    let time = 0;
    let lastAdjust = 0;
    const animate = () => {
      time += 0.016;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // 每 2 秒根据 CPU 负载调整粒子数
      if (time - lastAdjust > 2) {
        const target = cpuEstimator.getParticleScale(maxParticles);
        if (Math.abs(target - currentParticleCountRef.current) > 10) {
          adjustParticleCount(target, width, height);
          setCurrentCount(target);
        }
        lastAdjust = time;
      }

      // 半透明清除（拖尾效果）
      ctx.fillStyle = "rgba(15, 15, 30, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // 绘制粒子
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 更新位置
        p.x += p.vx;
        p.y += p.vy;

        // 边界环绕
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // 闪烁
        const twinkle =
          Math.sin(time * p.twinkleSpeed * 60 + p.twinkleOffset) * 0.3 + 0.7;
        const alpha = p.alpha * twinkle;

        // 绘制光晕
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fill();

        // 绘制核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    try {
      animate();
    } catch (err) {
      captureError(
        "page",
        err instanceof Error ? err : new Error(String(err)),
        { component: "ParticleCanvas" }
      );
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      cpuEstimator.stop();
    };
  }, [enabled, maxParticles, createParticle, adjustParticleCount]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
      data-particle-count={currentCount}
    />
  );
}

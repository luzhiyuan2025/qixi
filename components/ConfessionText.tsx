"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { captureError } from "@/lib/sentry";

// 注册插件
gsap.registerPlugin(ScrollTrigger);

// SplitText 简易实现（gsap 付费插件的开源替代）
// 将文本拆分为逐字 span，支持逐字动画
function splitText(text: string): { chars: string[]; container: HTMLElement | null } {
  const chars = text.split("");
  return { chars, container: null };
}

interface ConfessionTextProps {
  text: string;
  className?: string;
  delay?: number;
  trigger?: string; // ScrollTrigger 触发选择器
}

/**
 * GSAP SplitText 告白文案逐字绽放组件
 * - 逐字拆分 + 渐显 + 上浮 + 光晕
 * - ScrollTrigger 绑定滚动叙事
 * - 异常捕获：GSAP 错误不阻断页面
 */
export default function ConfessionText({
  text,
  className = "",
  delay = 0,
  trigger,
}: ConfessionTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const chars = charsRef.current;
      if (chars.length === 0) return;

      try {
        // 初始状态
        gsap.set(chars, {
          opacity: 0,
          y: 40,
          rotateX: -90,
          filter: "blur(10px)",
        });

        // 逐字绽放动画
        const tl = gsap.timeline({
          delay,
          scrollTrigger: trigger
            ? {
                trigger: trigger,
                start: "top 80%",
                toggleActions: "play none none reverse",
              }
            : undefined,
        });

        tl.to(chars, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: {
            each: 0.06,
            from: "start",
          },
          ease: "back.out(1.7)",
        });

        // 持续微光浮动
        gsap.to(chars, {
          y: -3,
          duration: 2,
          stagger: {
            each: 0.1,
            repeat: -1,
            yoyo: true,
          },
          ease: "sine.inOut",
          delay: delay + 1,
        });
      } catch (err) {
        captureError(
          "gsap",
          err instanceof Error ? err : new Error(String(err)),
          { component: "ConfessionText", text }
        );
        // 降级：直接显示文本
        if (containerRef.current) {
          containerRef.current.style.opacity = "1";
        }
      }
    },
    { scope: containerRef, dependencies: [text, delay, trigger] }
  );

  const { chars } = splitText(text);

  return (
    <div
      ref={containerRef}
      className={`inline-block ${className}`}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            if (el) charsRef.current[i] = el;
          }}
          className="inline-block"
          style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

/**
 * 滚动叙事段落 - ScrollTrigger 驱动的渐入
 */
export function ScrollReveal({
  children,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      try {
        const vars: gsap.TweenVars = {
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        };

        if (direction === "up") vars.y = 0;
        if (direction === "left") vars.x = 0;
        if (direction === "right") vars.x = 0;
        if (direction === "scale") vars.scale = 1;

        gsap.fromTo(
          ref.current,
          {
            opacity: 0,
            y: direction === "up" ? 50 : 0,
            x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
            scale: direction === "scale" ? 0.8 : 1,
          },
          vars
        );
      } catch (err) {
        captureError(
          "gsap",
          err instanceof Error ? err : new Error(String(err)),
          { component: "ScrollReveal" }
        );
      }
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

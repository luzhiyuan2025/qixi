"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { captureError } from "@/lib/sentry";

type SoundType = "click" | "chime" | "heartbeat" | "whoosh";

/**
 * Web Audio API 交互音效管理器
 * CCIE 标准：
 * - 禁止自动播放，必须用户交互后触发
 * - 捕获 AudioContext 创建/恢复异常
 * - 浏览器音频策略兼容（suspended → resume）
 * - 所有音效通过振荡器合成，无需外部音频文件
 */
export default function AudioManager({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 AudioContext（必须在用户交互中调用）
  const initAudio = useCallback(() => {
    if (!enabled) return;
    if (audioContextRef.current) {
      // 已存在则尝试恢复（浏览器自动暂停策略）
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((err) => {
          captureError("audio", err as Error, { phase: "resume" });
        });
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API not supported");
      }
      audioContextRef.current = new AudioCtx();
      setIsReady(true);
      setError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "AudioContext init failed";
      setError(msg);
      captureError("audio", err instanceof Error ? err : new Error(msg), {
        phase: "init",
      });
    }
  }, [enabled]);

  // 播放合成音效
  const playSound = useCallback(
    (type: SoundType) => {
      if (!enabled || !audioContextRef.current) return;
      const ctx = audioContextRef.current;

      // 确保上下文运行
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
        return;
      }

      try {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0.15, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        switch (type) {
          case "click": {
            // 清脆点击音
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
          }
          case "chime": {
            // 风铃和弦（三音叠加）
            const freqs = [523.25, 659.25, 783.99]; // C5 E5 G5
            freqs.forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(0.15, now + 0.05 + i * 0.05);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + 1.2 + i * 0.2
              );
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(now + i * 0.05);
              osc.stop(now + 1.5 + i * 0.2);
            });
            break;
          }
          case "heartbeat": {
            // 心跳 "咚-咚"
            const beat = (offset: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(80, now + offset);
              osc.frequency.exponentialRampToValueAtTime(
                40,
                now + offset + 0.15
              );
              gain.gain.setValueAtTime(0.4, now + offset);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + offset + 0.2
              );
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(now + offset);
              osc.stop(now + offset + 0.2);
            };
            beat(0);
            beat(0.25);
            break;
          }
          case "whoosh": {
            // 滑音 whoosh
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.4);
            break;
          }
        }
      } catch (err) {
        captureError(
          "audio",
          err instanceof Error ? err : new Error(String(err)),
          { soundType: type }
        );
      }
    },
    [enabled]
  );

  // 清理
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  return { initAudio, playSound, isReady, error };
}

// Hook 形式导出（便于在 page 中使用）
export function useAudioManager(enabled = true) {
  return AudioManager({ enabled });
}

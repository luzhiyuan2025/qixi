/**
 * Sentry 监控占位模块
 * CCIE 工程标准：异常捕获 → 分类上报 → 不影响主流程
 *
 * 本模块为 Sentry 集成的占位实现：
 * - 生产环境可替换为 @sentry/nextjs 真实 SDK
 * - 当前实现：控制台输出 + 可扩展上报接口
 * - 捕获范围：页面全局异常、3D 渲染错误、GSAP 动画错误、音频 API 异常
 */

export type ErrorCategory =
  | "page" // 页面全局异常
  | "webgl" // WebGL / Three.js 渲染错误
  | "gsap" // GSAP 动画运行错误
  | "audio" // Web Audio API 异常
  | "performance" // 性能降级事件
  | "resource"; // 资源加载失败

export interface ErrorReport {
  category: ErrorCategory;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  level: "error" | "warning" | "info";
}

/** 上报缓冲区（占位：可替换为 Sentry.captureException） */
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER = 50;

/** 上报端点占位（生产环境替换为 Sentry DSN） */
const REPORT_ENDPOINT = ""; // 例如: "/api/monitor" 或 Sentry ingest URL

/** 是否启用真实上报（占位：默认仅控制台） */
const ENABLE_REMOTE_REPORT = false;

/**
 * 捕获并上报异常
 * @param category 错误分类
 * @param error Error 对象或字符串
 * @param context 附加上下文
 * @param level 日志级别
 */
export function captureError(
  category: ErrorCategory,
  error: Error | string,
  context?: Record<string, unknown>,
  level: ErrorReport["level"] = "error"
): void {
  const report: ErrorReport = {
    category,
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "object" ? error.stack : undefined,
    timestamp: Date.now(),
    context,
    level,
  };

  // 缓冲区管理
  errorBuffer.push(report);
  if (errorBuffer.length > MAX_BUFFER) {
    errorBuffer.shift();
  }

  // 控制台输出（开发调试）
  const prefix = `[Sentry:${category}]`;
  if (level === "error") {
    console.error(prefix, report.message, context || "");
  } else if (level === "warning") {
    console.warn(prefix, report.message, context || "");
  } else {
    console.info(prefix, report.message, context || "");
  }

  // 远程上报占位
  if (ENABLE_REMOTE_REPORT && REPORT_ENDPOINT) {
    try {
      // 使用 sendBeacon 避免阻塞页面
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(report)], {
          type: "application/json",
        });
        navigator.sendBeacon(REPORT_ENDPOINT, blob);
      }
    } catch {
      // 上报失败静默处理，不影响主流程
    }
  }
}

/**
 * React 错误边界 Hook - 捕获组件渲染异常
 * 用法：在组件中 useSentryBoundary('webgl') 包裹 try-catch
 */
export function useSentryBoundary(category: ErrorCategory) {
  return (fn: () => void, context?: Record<string, unknown>) => {
    try {
      fn();
    } catch (err) {
      captureError(
        category,
        err instanceof Error ? err : new Error(String(err)),
        context
      );
    }
  };
}

/**
 * 全局错误监听注册
 * 在 app/layout 或 page 中调用一次即可
 */
export function registerGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  // 未捕获的 JS 异常
  window.addEventListener("error", (event) => {
    captureError("page", event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Promise 未处理拒绝
  window.addEventListener("unhandledrejection", (event) => {
    captureError(
      "page",
      new Error(
        `Unhandled Promise rejection: ${
          event.reason instanceof Error ? event.reason.message : String(event.reason)
        }`
      ),
      { reason: String(event.reason) }
    );
  });

  // WebGL 上下文丢失
  window.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      captureError("webgl", new Error("WebGL context lost"), {}, "warning");
    },
    false
  );
}

/** 获取错误缓冲区（调试用） */
export function getErrorBuffer(): ErrorReport[] {
  return [...errorBuffer];
}

/** 清空缓冲区 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}

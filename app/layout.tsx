import type { Metadata, Viewport } from "next";
import "./globals.css";
import { registerGlobalErrorHandlers } from "@/lib/sentry";

// 客户端执行：注册全局错误监听
if (typeof window !== "undefined") {
  registerGlobalErrorHandlers();
}

export const metadata: Metadata = {
  title: "七夕 · 星河告白 | Qixi Starlight Confession",
  description:
    "CCIE工程级七夕3D浪漫网页 - 星河爱心、粒子星光、交互音效，献给最特别的你",
  keywords: [
    "七夕",
    "情人节",
    "告白",
    "3D",
    "Three.js",
    "Next.js",
    "浪漫",
    "星河",
    "Qixi",
  ],
  authors: [{ name: "CCIE Romance Project" }],
  openGraph: {
    title: "七夕 · 星河告白",
    description: "穿越星河，只为对你说一句：我爱你",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// 抑制 React hydration 不匹配警告（客户端动画库导致）
export const dynamic = "force-static";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

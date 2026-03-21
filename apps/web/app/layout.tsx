import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frendseesion 会话",
  description: "基于二维码加入的移动端点对点 WebRTC 聊天应用，支持按时长解锁媒体能力。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Frendseesion 会话"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#d7f8b7"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frendseesion 会话",
    short_name: "会话",
    description: "基于二维码加入的点对点 WebRTC 聊天应用，支持按时长解锁媒体权限。",
    display: "standalone",
    background_color: "#eef4e6",
    theme_color: "#d7f8b7",
    start_url: "/",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}

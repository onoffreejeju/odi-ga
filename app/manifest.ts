import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "어디:가 (ODI:GA)",
    short_name: "ODI:GA",
    description: "내가 가는 길 중에, 누군가를 돕는 경로 기반 심부름 매칭 서비스",
    start_url: "/home",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}

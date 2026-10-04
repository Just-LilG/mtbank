import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ubex Bank",
    short_name: "Ubex",
    description: "Ubex Bank, Osu branch. Your money, in your pocket.",
    start_url: "/customer",
    display: "standalone",
    background_color: "#f6f6f8",
    theme_color: "#e10600",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ubex Bank",
    short_name: "Ubex",
    description: "Ubex Bank. Your money, in your pocket.",
    id: "/",
    scope: "/",
    start_url: "/customer",
    // Full screen hides the phone's top and bottom bars. If a phone cannot do that,
    // it falls back to a normal installed-app window.
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "portrait",
    categories: ["finance"],
    background_color: "#f6f6f8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

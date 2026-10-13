import type { MetadataRoute } from "next";

/** Lets each phone add the app to its home screen and open it full-screen. */
const manifest = (): MetadataRoute.Manifest => ({
  name: "محطة الغاز",
  short_name: "محطة الغاز",
  description: "جرد الجرار اليومي وديون الزبائن",
  lang: "ar",
  dir: "rtl",
  start_url: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#f1f4f8",
  theme_color: "#f1f4f8",
  icons: [
    { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/apple-icon", sizes: "180x180", type: "image/png" },
  ],
});

export default manifest;

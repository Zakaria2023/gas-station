import { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { Shell } from "@/components/layout/shell";
import { getCurrentUser } from "@/services";
import "./globals.css";

// Self-hosted variable fonts: one file covers every weight, and a build never
// waits on a download. No metric-matched fallback: it would catch the Latin
// characters before the second file got the chance.
const cairoArabic = localFont({
  src: "../fonts/cairo-arabic.woff2",
  weight: "200 1000",
  style: "normal",
  variable: "--font-cairo-arabic",
  display: "swap",
  adjustFontFallback: false,
});

const cairoLatin = localFont({
  src: "../fonts/cairo-latin.woff2",
  weight: "200 1000",
  style: "normal",
  variable: "--font-cairo-latin",
  display: "swap",
  adjustFontFallback: false,
});

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: { default: "محطة الغاز", template: "%s · محطة الغاز" },
  description: "جرد الجرار اليومي وديون الزبائن",
  appleWebApp: { capable: true, title: "محطة الغاز", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page reach under the notch; the bars pad themselves back in.
  viewportFit: "cover",
  themeColor: "#f1f4f8",
};

// Always render against live data — never a build-time static snapshot.
export const dynamic = "force-dynamic";

const RootLayout = async ({ children }: Props) => {
  // Signed out, the only page is the sign-in screen, and it has no menus.
  const user = await getCurrentUser();
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`h-full antialiased ${cairoArabic.variable} ${cairoLatin.variable}`}
    >
      <body className="min-h-full font-sans text-ink">
        {user ? <Shell user={{ name: user.name, isAdmin: user.role === "admin" }}>{children}</Shell> : children}
      </body>
    </html>
  );
};

export default RootLayout;

import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "PallEx Check",
  description: "Checklist-uri și raportare incidente pentru flotă transport",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PallEx Check",
    startupImage: [
      // iPhone 15 Pro Max / 14 Pro Max (430×932 @3x)
      {
        url: "/icons/apple-touch-icon.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 / 13 / 12 (390×844 @3x)
      {
        url: "/icons/apple-touch-icon.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone SE / 8 (375×667 @2x)
      {
        url: "/icons/apple-touch-icon.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="dark">
      <body className="min-h-screen bg-surface-950 text-white antialiased">
        {children}
        <PWAInstallPrompt />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
              maxWidth: "380px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#1e293b" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#1e293b" },
            },
          }}
        />
      </body>
    </html>
  );
}

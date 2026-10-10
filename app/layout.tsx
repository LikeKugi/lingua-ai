import type { Metadata, Viewport } from "next";
import Workspace from "./workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: "Лингва — объяснение языковых ошибок",
  description: "Поймите, почему ответ неверен. Ваши задания и история остаются в этом браузере.",
  manifest: "/manifest.webmanifest",
  applicationName: "Лингва",
  appleWebApp: { capable: true, title: "Лингва", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#244D3B" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body><Workspace />{children}</body>
    </html>
  );
}

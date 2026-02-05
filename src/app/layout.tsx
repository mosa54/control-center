import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "긴급구조통제단 소집·편성",
  description: "중부소방서 긴급구조통제단 소집 및 편성 시스템",
  manifest: "/manifest.json",
  themeColor: "#0D47A1",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppProvider>
          {children}
          <InstallPrompt />
        </AppProvider>
      </body>
    </html>
  );
}

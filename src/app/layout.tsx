import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import InstallPrompt from "@/components/InstallPrompt";
import BottomNav from "@/components/BottomNav";

export const viewport: Viewport = {
  themeColor: "#0D47A1",
};

export const metadata: Metadata = {
  title: "긴급구조통제단 소집·편성",
  description: "중부소방서 긴급구조통제단 소집 및 편성 시스템",
  manifest: "/manifest.json",
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
          {/* 하단 네비게이션 바에 콘텐츠가 가려지지 않도록 실제 빈 공간 삽입 */}
          <div aria-hidden="true" style={{ height: '80px', flexShrink: 0 }} />
          <BottomNav />
          <InstallPrompt />
        </AppProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "위로의 문장",
  description: "위로가 되는 문장을 따라 적으며 잠시 쉬어가는 힐링 타이핑",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";

// Pretendard는 로컬 정적 파일(npm 패키지 내 woff2)만 사용해 외부 네트워크 요청 없이 로드된다.
// --font-sans는 globals.css에서 body 기본 폰트로 연결된다.
const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "위로의 문장",
  description: "위로가 되는 문장을 따라 적으며 잠시 쉬어가는 힐링 타이핑",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSerifKr.variable} bg-slate-950 text-white antialiased`}>{children}</body>
    </html>
  );
}

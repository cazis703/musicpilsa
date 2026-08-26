/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // public/media의 배경 영상/음악/배경음/효과음은 파일명에 해시가 없어(내용이 바뀌어도
  // 파일명이 그대로일 수 있어) immutable 캐시는 위험하다. 대신 하루 정도는 브라우저가
  // 재요청 없이 캐시를 쓰게 해서, 같은 세션 안에서 뒤로가기/새로고침하거나 같은 날 다시
  // 방문했을 때 무거운 미디어 파일을 매번 새로 받지 않도록 한다.
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

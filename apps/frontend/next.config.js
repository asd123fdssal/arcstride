/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      // Google 프로필 이미지
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // 사용자 업로드 커버 이미지 (향후 S3/CDN 도메인 추가)
      // { protocol: 'https', hostname: 'cdn.arcstride.com' },
    ],
  },
  async rewrites() {
    // 개발환경에서만 Next.js → Spring Boot 프록시
    // 운영은 reverse proxy(Nginx)에서 /api, /oauth2, /login/oauth2를 백엔드로 라우팅
    const enable = process.env.NODE_ENV === 'development' || process.env.LOCAL_PROXY === '1';
    if (!enable) return [];

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/oauth2/:path*', destination: `${backendUrl}/oauth2/:path*` },
      { source: '/login/oauth2/:path*', destination: `${backendUrl}/login/oauth2/:path*` },
    ];
  },
};

module.exports = nextConfig;

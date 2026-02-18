# Arcstride 운영 배포 가이드

## 환경변수

### 필수

| 변수 | 설명 | 예시 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-xxx` |
| `SPRING_DATASOURCE_URL` | MySQL 접속 URL | `jdbc:mysql://db:3306/arcstride` |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자명 | `arcstride` |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호 | - |

### 보안 (운영 필수)

| 변수 | 설명 | 운영 값 |
|---|---|---|
| `SESSION_COOKIE_SECURE` | HTTPS 환경에서 세션 쿠키 Secure 플래그 | `true` |
| `SPRING_PROFILES_ACTIVE` | 프로파일 (CSP unsafe-eval 제거 등) | `prod` |

### 프론트엔드

| 변수 | 설명 | 운영 값 |
|---|---|---|
| `BACKEND_URL` | 개발환경 전용 백엔드 URL (Next.js rewrites) | 운영에서는 미사용 |
| `NEXT_PUBLIC_API_BASE` | API base path (기본: `/api`) | `/api` |

## 보안 체크리스트

### 세션 쿠키
- `http-only: true` — JavaScript에서 JSESSIONID 접근 불가 (XSS 완화)
- `secure: true` — HTTPS에서만 쿠키 전송 (`SESSION_COOKIE_SECURE=true`)
- `same-site: lax` — CSRF 기본 방어 + OAuth2 리다이렉트 호환
- `max-age: 604800` — 7일 세션 유지

### CSRF
- `XSRF-TOKEN` 쿠키: `HttpOnly=false` (프론트에서 읽어 헤더로 전송)
- `X-XSRF-TOKEN` 헤더: state-changing 요청(POST/PUT/PATCH/DELETE)에 자동 부착
- `SpaCsrfTokenRequestHandler`: BREACH 공격 방어 (XOR 인코딩)
- `CsrfCookieFilter`: 모든 응답에서 XSRF-TOKEN 쿠키 실체화
- `/login/oauth2/**`: 외부(Google) 콜백이므로 CSRF 검증 제외

### CSRF 쿠키 재발급
- `GET /api/public/ping`: CSRF 쿠키 재발급 전용 공개 엔드포인트
  - 인증 불필요, 204 응답, `Cache-Control: no-store`
  - 프론트에서 403(CSRF_INVALID) 발생 시 이 엔드포인트를 호출하여 쿠키 재발급 후 1회 재시도
  - 미로그인 상태에서도 동작 보장

### CSP (Content-Security-Policy)
- 프로덕션(`prod` 프로파일): `unsafe-eval` 제거
- 개발: `unsafe-eval` 허용 (Next.js HMR에 필요)
- `unsafe-inline`: Next.js nonce 기반 전환 시 제거 예정 (단계적)

### 보안 헤더
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Reverse Proxy 주의사항

### X-Forwarded-* 헤더
`application.yml`에 `server.forward-headers-strategy: framework`가 설정되어 있어
Spring이 Nginx/Cloudflare의 `X-Forwarded-Proto`, `X-Forwarded-For` 등을 자동 인식합니다.
이것이 없으면 프록시 뒤에서 `Secure` 쿠키, HTTPS 리다이렉트, OAuth2 callback URL 생성이 꼬일 수 있습니다.

### HSTS
HSTS(`Strict-Transport-Security`)는 TLS 종단(Nginx/Cloudflare)에서 설정하는 것이 가장 안전합니다.
앱 레벨에서는 설정하지 않습니다.

## Google OAuth2 설정

### Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
3. **승인된 리디렉션 URI** (정확히 하나만 등록):

```
https://your-domain.com/login/oauth2/code/google
```

> ⚠️ 이 URI는 Spring Security OAuth2 Client의 기본 콜백 경로입니다.
> 도메인, 프로토콜(https), 경로(`/login/oauth2/code/google`)가 정확히 일치해야 합니다.
> 개발환경: `http://localhost:3000/login/oauth2/code/google` (Next.js rewrite → Spring)

### 흔한 실수
- `http`와 `https` 혼동 (운영은 반드시 `https`)
- 경로 끝에 `/` 추가 (Spring 기본은 슬래시 없음)
- 포트 누락 (개발: `:3000` 또는 `:8080`)
- 여러 URI 등록 후 어떤 게 사용되는지 혼동 → **하나만 등록 권장**

## Nginx 설정 예시

```nginx
server {
    listen 443 ssl;
    server_name arcstride.example.com;

    # HSTS (HTTPS 강제, 프록시 레이어에서 설정 권장)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 프론트엔드 (Next.js)
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 백엔드 API + OAuth2
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /oauth2/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /login/oauth2/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting (권장)
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    location = /oauth2/authorization/google {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend:8080;
    }
}
```

## 실행

```bash
# 환경변수 설정
export GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=GOCSPX-xxx
export SESSION_COOKIE_SECURE=true
export SPRING_PROFILES_ACTIVE=prod

# 백엔드
cd apps/backend && ./gradlew bootRun

# Gradle Wrapper 초기 설정 (최초 1회)
# gradle-wrapper.jar가 없는 경우 Gradle이 설치된 환경에서:
# cd apps/backend && gradle wrapper --gradle-version=8.12.1
# 이후 gradlew/gradlew.bat으로 빌드 가능

# 프론트엔드
cd apps/frontend && npm ci && npm run build && npm start
# 주의: npm ci는 package-lock.json 기반 정확한 설치 (npm install 대신 사용)
```

## 개발 환경 초기 설정

```bash
# 1. 프론트엔드 의존성 설치 (lockfile 생성)
cd apps/frontend
npm install          # package-lock.json 생성/업데이트
# 생성된 package-lock.json을 커밋하세요

# 2. Gradle Wrapper 초기화 (gradle-wrapper.jar 없는 경우)
cd apps/backend
gradle wrapper --gradle-version=8.12.1  # 시스템 Gradle 필요
# 생성된 gradle/ 디렉토리를 커밋하세요

# 3. OpenAPI 타입 생성 (백엔드 실행 필요)
cd apps/frontend
npm run generate-types
# 생성된 src/lib/api-types.ts를 커밋하세요 (커밋 정책)
```

### OpenAPI 타입 생성 정책

`src/lib/api-types.ts`는 **커밋 대상**입니다.

- 백엔드 API가 변경되면 `npm run generate-types` 실행 후 커밋
- 백엔드 미실행 환경에서도 프론트 빌드가 가능하도록 보장
- CI에서는 타입 파일 존재 여부로 빌드 가능 (별도 생성 불필요)
- AUTO-GENERATED 헤더가 자동 삽입됨 → 수동 수정 금지

# Arcstride - Google OAuth2 BFF 패턴 통합 가이드

## 아키텍처 개요

```
React SPA (같은 오리진)
  |
  | 1) 로그인 버튼 클릭 → window.location.href = "/oauth2/authorization/google"
  | 2) Spring이 Google로 redirect
  | 3) Google 인증 후 callback → Spring이 세션 생성 + JSESSIONID 쿠키 발급
  | 4) 이후 모든 /api/** 요청은 쿠키 자동 전송
  |
  ↓
Spring Boot (BFF)
  ├─ OAuth2 Login (Authorization Code + PKCE)
  ├─ HttpOnly 세션 쿠키 (JSESSIONID)
  ├─ /api/** → 인증 필요 (쿠키 기반)
  └─ /* → React static files (또는 Nginx proxy)
```

토큰 흐름:
- Access Token / ID Token: Spring 서버 내부에서만 사용 (React에 노출 안 함)
- 인증 유지: HttpOnly JSESSIONID 쿠키 (브라우저가 자동 전송)
- React는 토큰을 저장/관리하지 않음

---

## Step 1: Google Cloud Console 설정

### 1.1 프로젝트 생성
1. https://console.cloud.google.com 에서 프로젝트 생성 (또는 기존 프로젝트 선택)

### 1.2 OAuth 동의 화면 설정
1. APIs & Services > OAuth consent screen
2. User Type: External (또는 Internal if Google Workspace)
3. App name: Arcstride
4. Scopes: `email`, `profile`, `openid`

### 1.3 OAuth Client ID 생성
1. APIs & Services > Credentials > Create Credentials > OAuth client ID
2. Application type: **Web application**
3. Name: `Arcstride Backend`
4. Authorized redirect URIs 추가:

```
개발: http://localhost:8080/login/oauth2/code/google
운영: https://yourdomain.com/login/oauth2/code/google
```

중요: `/login/oauth2/code/google`은 Spring Security OAuth2 Client의 기본 callback URI입니다.
Spring의 `registrationId`가 `google`이면 이 경로가 자동 매핑됩니다.

5. Client ID / Client Secret 복사 후 보관

---

## Step 2: 의존성 및 application.yml

### 2.1 build.gradle 변경

기존 JWT 의존성은 유지(하위 호환)하고, OAuth2 Client 의존성 추가:

```groovy
dependencies {
    // 기존 그대로
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // 추가: OAuth2 Client (Google Login)
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'

    // 기존 JWT (필요 시 유지, 나중에 제거 가능)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'

    // ...나머지 기존 그대로
}
```

### 2.2 application.yml 변경

```yaml
spring:
  # 기존 datasource/jpa/jackson 설정 그대로 유지

  # 추가: OAuth2 Client 설정
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, email, profile

  # 추가: 세션 설정
  session:
    timeout: 7d  # 세션 만료 7일 (필요에 따라 조정)

server:
  port: 8080
  servlet:
    context-path: /
    session:
      cookie:
        http-only: true       # JS에서 접근 불가
        secure: false         # 개발 시 false, 운영 시 true (HTTPS)
        same-site: lax        # CSRF 기본 보호
        max-age: 604800       # 7일 (초 단위)
```

환경변수 주입 (개발 시):
```bash
export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-client-secret
```

또는 application-local.yml에 직접 값을 넣되, .gitignore에 반드시 추가합니다.

---

## Step 3: DB 변경 (users 테이블)

### 3.1 마이그레이션 SQL

```sql
-- google_sub 컬럼 추가 (Google OIDC subject 영구 식별자)
ALTER TABLE users
  ADD COLUMN google_sub VARCHAR(255) NULL AFTER password_hash,
  ADD UNIQUE KEY uk_users_google_sub (google_sub);

-- OAuth2 사용자는 password_hash가 불필요하므로 nullable로 변경
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- username에 대한 unique 제약은 유지 (Google 로그인 시 자동 생성)
```

### 3.2 변경 이유
- `google_sub`: Google OIDC의 `sub` claim으로 사용자를 영구 식별. email은 변경 가능하므로 sub가 정석
- `password_hash` nullable: OAuth2 전용 사용자는 비밀번호가 없음
- `username`: Google 사용자는 name claim에서 자동 생성. 중복 시 suffix 부여

---

## Step 4: User 엔티티 변경

```java
@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash")           // nullable로 변경
    private String passwordHash;

    @Column(name = "google_sub", unique = true)  // 추가
    private String googleSub;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

---

## Step 5: SecurityConfig (OAuth2 + 세션 기반)

### 핵심 변경점
- `SessionCreationPolicy.STATELESS` 제거 → 세션 기반으로 전환
- `csrf.disable()` 제거 → CookieCsrfTokenRepository 또는 API 경로만 제외
- `oauth2Login()` 활성화
- JWT 필터는 비활성화 (또는 조건부 동작)

### CSRF 전략 2가지

**A안 (MVP, 단순)**: /api/** 경로만 CSRF 제외
- SPA가 동일 오리진이고, SameSite=Lax 쿠키 + CORS 없음이면 실질적으로 안전
- 빠르게 시작하기 좋음

**B안 (정석)**: CookieCsrfTokenRepository 사용
- Spring이 XSRF-TOKEN 쿠키를 발급, React가 X-XSRF-TOKEN 헤더로 전송
- SPA 표준 방식이지만 React 쪽 설정이 필요

이 가이드에서는 A안을 기본으로 구현하고, B안 전환 방법도 주석으로 포함합니다.

---

## Step 6: React 변경 가이드

### 6.1 로그인
```jsx
// 기존 JWT 로그인 폼 대신:
<button onClick={() => window.location.href = "/oauth2/authorization/google"}>
  Google로 로그인
</button>
```

### 6.2 API 호출
동일 오리진이면 쿠키가 자동 전송되므로 특별한 설정 불필요:
```js
// fetch (동일 오리진이면 credentials 생략 가능)
const res = await fetch("/api/titles");

// 명시적으로 넣어도 됨 (cross-origin일 때 필수)
const res = await fetch("/api/titles", { credentials: "include" });
```

### 6.3 인증 상태 확인
```js
// AuthContext에서 사용
async function fetchMe() {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) return await res.json();
    return null; // 401 → 미로그인
  } catch {
    return null;
  }
}
```

### 6.4 로그아웃
```js
async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}
```

### 6.5 기존 JWT 로직 제거 대상
- localStorage의 arc_at, arc_rt 관련 코드
- Authorization: Bearer 헤더 주입 로직
- 401 시 refresh token 재시도 로직

---

## Step 7: 동일 오리진 구성

### A. Spring이 React 정적 파일 서빙 (가장 간단)
1. React 빌드: `npm run build`
2. 빌드 결과물을 `src/main/resources/static/` 에 복사
3. Spring이 `/index.html` 및 정적 자산을 자동 서빙
4. SPA fallback을 위해 WebMvcConfigurer에서 forwarding 설정 필요

### B. Nginx Reverse Proxy (운영 권장)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # React SPA
    location / {
        root /var/www/arcstride/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API + OAuth2 → Spring Boot
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_path / /;
    }

    # OAuth2 경로도 Spring으로
    location /oauth2/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /login/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

핵심: `/api/**`, `/oauth2/**`, `/login/oauth2/**` 는 모두 Spring으로 프록시해야 합니다.

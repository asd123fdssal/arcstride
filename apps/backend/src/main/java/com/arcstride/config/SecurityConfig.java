package com.arcstride.config;

import com.arcstride.common.dto.ErrorResponse;
import com.arcstride.security.handler.OAuth2LoginSuccessHandler;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Slf4j
@Configuration
@EnableWebSecurity
@ConfigurationPropertiesScan("com.arcstride")
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final ObjectMapper objectMapper;
    private final Environment environment;

    /**
     * CSP 정책: 프로덕션에서는 unsafe-eval 제거.
     * Next.js nonce 기반으로 완전 전환 시 unsafe-inline도 제거 가능.
     */
    private String buildCspDirectives() {
        boolean isProd = environment.matchesProfiles("prod") || environment.matchesProfiles("production");
        String scriptSrc = isProd
                ? "script-src 'self' 'unsafe-inline'; "
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'; ";
        String connectSrc = isProd
                ? "connect-src 'self'; "
                : "connect-src 'self' ws: http://localhost:3000; ";  // dev: Next.js HMR WebSocket
        return "default-src 'self'; " +
                scriptSrc +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' https: data:; " +
                connectSrc +
                "frame-ancestors 'none'";
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ---- 보안 헤더 ----
                .headers(headers -> headers
                        .contentTypeOptions(opts -> {})                    // X-Content-Type-Options: nosniff (기본 활성)
                        .frameOptions(frame -> frame.deny())              // X-Frame-Options: DENY
                        .referrerPolicy(ref -> ref.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(buildCspDirectives()))
                        .permissionsPolicy(pp -> pp.policy("camera=(), microphone=(), geolocation=()"))
                )

                // ---- CSRF ----
                // CookieCsrfTokenRepository: XSRF-TOKEN 쿠키 발급 → React가 X-XSRF-TOKEN 헤더로 전송
                // SpaCsrfTokenRequestHandler.java: SPA에서 BREACH 보호 + 헤더 기반 검증 지원
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new com.arcstride.config.csrf.SpaCsrfTokenRequestHandler())
                        // OAuth2 callback은 외부(Google)에서 오므로 CSRF 제외
                        .ignoringRequestMatchers("/login/oauth2/**")
                )

                // ---- 세션 관리 (BFF: 세션 기반) ----
                // SessionCreationPolicy.STATELESS를 명시하지 않음 → 기본값 IF_REQUIRED 사용
                // Spring Security가 OAuth2 로그인 성공 시 자동으로 세션 생성

                // ---- 예외 처리 ----
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            if (request.getRequestURI().startsWith("/api/")) {
                                response.setStatus(401);
                                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                response.setCharacterEncoding("UTF-8");
                                response.setHeader("Cache-Control", "no-store");
                                objectMapper.writeValue(response.getWriter(),
                                        ErrorResponse.of("UNAUTHORIZED", "인증이 필요합니다."));
                            } else {
                                response.sendRedirect("/login");
                            }
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            if (request.getRequestURI().startsWith("/api/")) {
                                response.setStatus(403);
                                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                response.setCharacterEncoding("UTF-8");
                                response.setHeader("Cache-Control", "no-store");
                                String code = "FORBIDDEN";
                                String message = "권한이 없습니다.";
                                if (accessDeniedException instanceof org.springframework.security.web.csrf.MissingCsrfTokenException
                                        || accessDeniedException instanceof org.springframework.security.web.csrf.InvalidCsrfTokenException) {
                                    code = "CSRF_INVALID";
                                    message = "보안 토큰이 만료되었습니다.";
                                    log.warn("CSRF validation failed: {} {} (remote={})",
                                            request.getMethod(), request.getRequestURI(), request.getRemoteAddr());
                                }
                                objectMapper.writeValue(response.getWriter(),
                                        ErrorResponse.of(code, message));
                            } else {
                                String uri = request.getRequestURI();
                                String qs = request.getQueryString();
                                String next = uri + (qs != null ? "?" + qs : "");
                                response.sendRedirect("/login?error=access_denied&next=" +
                                        java.net.URLEncoder.encode(next, java.nio.charset.StandardCharsets.UTF_8));
                            }
                        })
                )

                // ---- 인가 규칙 ----
                .authorizeHttpRequests(auth -> auth
                        // OAuth2 관련 경로
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // 공개 API
                        .requestMatchers("/api/public/**").permitAll()

                        // Title - 공개 조회
                        .requestMatchers(HttpMethod.GET, "/api/titles", "/api/titles/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles/{titleId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles/{titleId}/units").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles/{titleId}/characters").permitAll()

                        // Review, Comment - 공개 조회
                        .requestMatchers(HttpMethod.GET, "/api/titles/{titleId}/reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/titles/{titleId}/comments").permitAll()

                        // Guide - 공개 조회
                        .requestMatchers(HttpMethod.GET, "/api/guides", "/api/guides/{guideId}").permitAll()

                        // Store - 공개 조회
                        .requestMatchers(HttpMethod.GET, "/api/stores").permitAll()

                        // 정적 파일 (React SPA) + 로그인 페이지 + API 문서
                        .requestMatchers("/", "/index.html", "/login", "/signup", "/static/**", "/assets/**", "/favicon.ico").permitAll()
                        .requestMatchers("/api/docs/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // 나머지 전부 인증 필요
                        .anyRequest().authenticated()
                )

                // ---- OAuth2 로그인 ----
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                        // 실패 시 에러 파라미터와 함께 홈으로
                        .failureHandler((request, response, exception) -> {
                            response.sendRedirect("/login?error=login_failed");
                        })
                )

                // ---- 로그아웃 ----
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            // API 호출이므로 JSON 응답 (204 No Content)
                            response.setStatus(204);
                        })
                )

                // ---- CSRF 쿠키 발급 필터 ----
                // Spring Security 6의 deferred CsrfToken을 강제 실체화하여 XSRF-TOKEN 쿠키 발급
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class);

        return http.build();
    }
}

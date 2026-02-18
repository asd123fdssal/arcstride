package com.arcstride.security.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공개 엔드포인트.
 * 인증 불필요, CSRF 쿠키 발급 보장 용도.
 */
@Tag(name = "Public", description = "공개 엔드포인트")
@RestController
@RequestMapping("/api/public")
public class PublicController {

    /**
     * GET /api/public/ping
     * - 헬스체크 / CSRF 쿠키 재발급 유도
     * - CsrfCookieFilter가 응답에 XSRF-TOKEN 쿠키를 세팅
     * - Cache-Control: no-store로 프록시/CDN 캐시 방지
     */
    @GetMapping("/ping")
    public ResponseEntity<Void> ping() {
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }
}

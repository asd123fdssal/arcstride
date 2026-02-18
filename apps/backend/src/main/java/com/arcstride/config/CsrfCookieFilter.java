package com.arcstride.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Spring Security 6에서 CsrfToken은 deferred(지연) 로딩입니다.
 * SPA에서는 페이지 로드 시 XSRF-TOKEN 쿠키가 즉시 발급되어야 하므로,
 * 이 필터에서 csrfToken.getToken()을 호출해 쿠키 발급을 강제합니다.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
        if (csrfToken != null) {
            // getToken() 호출 시 deferred 토큰이 실체화되어 쿠키가 발급됨
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}

package com.arcstride.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * Spring Security 6 SPA용 CSRF 토큰 핸들러.
 *
 * 동작:
 * 1. 브라우저 쿠키(XSRF-TOKEN)에는 XOR 인코딩된 토큰 저장 (BREACH 공격 방어)
 * 2. 검증 시 X-XSRF-TOKEN 헤더가 있으면 XOR 디코딩 후 비교
 * 3. 헤더가 없으면 기본 CsrfTokenRequestAttributeHandler로 폴백 (form _csrf 등)
 *
 * 참고: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa
 */
public class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       Supplier<CsrfToken> csrfToken) {
        // CsrfToken을 request attribute에 설정 (XOR 핸들러가 BREACH 보호된 값 생성)
        xor.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String header = request.getHeader(csrfToken.getHeaderName());
        // 헤더에 토큰이 있으면 XOR 디코딩으로 검증 (SPA)
        // 없으면 form parameter 기반 검증 (폴백)
        return StringUtils.hasText(header)
                ? xor.resolveCsrfTokenValue(request, csrfToken)
                : plain.resolveCsrfTokenValue(request, csrfToken);
    }
}

package com.arcstride.config.csrf;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;

import java.util.function.Supplier;

public class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler xorDelegate = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        // response에 노출되는 CsrfToken(request attribute)은 XOR 방식으로 처리(브리치 방어)
        xorDelegate.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        // SPA는 헤더(X-XSRF-TOKEN)로 raw 토큰을 보내므로, XOR unmask 로직 대신
        // "요청에서 들어온 값"을 그대로 사용하게 해야 함.
        // XorCsrfTokenRequestAttributeHandler는 폼 기반(마스킹된 값) 케이스에 필요.
        // 헤더 기반은 그냥 헤더값을 우선으로 받아 raw로 검증되게 둔다.
        String header = request.getHeader(csrfToken.getHeaderName());
        if (header != null && !header.isBlank()) return header;

        // fallback: 파라미터 등은 XOR delegate가 처리
        return xorDelegate.resolveCsrfTokenValue(request, csrfToken);
    }
}

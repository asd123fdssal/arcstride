package com.arcstride.security.handler;

import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.io.IOException;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    private static final String DEFAULT_REDIRECT = "/titles";
    private static final Set<String> ALLOWED_PREFIXES = Set.of("/titles", "/my", "/guides");
    private static final Pattern USERNAME_CHARS = Pattern.compile("[^a-z0-9_]");

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();

        String googleSub = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String picture = oidcUser.getAttribute("picture");

        User user = userRepository.findByGoogleSub(googleSub)
                .map(existing -> {
                    existing.setEmail(email);
                    existing.setProfilePictureUrl(picture);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    String username = generateUniqueUsername(name, email);
                    User newUser = User.builder()
                            .googleSub(googleSub)
                            .email(email)
                            .username(username)
                            .profilePictureUrl(picture)
                            .build();
                    return userRepository.save(newUser);
                });

        log.info("OAuth2 login success: userId={}, email={}", user.getUserId(), user.getEmail());

        String redirectTo = resolveRedirect(request, response);
        response.sendRedirect(redirectTo);
    }

    private final HttpSessionRequestCache requestCache = new HttpSessionRequestCache();

    /**
     * 로그인 전 원래 페이지로 복귀하는 로직.
     * 우선순위: SavedRequest(RequestCache) > next 파라미터 > 기본값
     */
    private String resolveRedirect(HttpServletRequest request, HttpServletResponse response) {
        // 1. Spring Security RequestCache (인증 전 접근한 보호 페이지 URL)
        SavedRequest saved = requestCache.getRequest(request, response);
        if (saved != null) {
            String url = saved.getRedirectUrl();
            requestCache.removeRequest(request, response);
            try {
                java.net.URI uri = java.net.URI.create(url);
                String path = uri.getPath();
                if (uri.getQuery() != null) path += "?" + uri.getQuery();
                if (isAllowedRedirect(path)) {
                    return path;
                }
            } catch (Exception ignored) { }
        }

        // 2. next 쿼리 파라미터 (프론트에서 명시적으로 전달)
        String next = request.getParameter("next");
        if (StringUtils.hasText(next) && isAllowedRedirect(next)) {
            return next;
        }

        // 3. 기본값
        return DEFAULT_REDIRECT;
    }

    private boolean isAllowedRedirect(String path) {
        // 상대경로만 허용 (절대 URL / 프로토콜 상대경로 차단)
        if (!path.startsWith("/") || path.startsWith("//")) return false;
        return ALLOWED_PREFIXES.stream().anyMatch(path::startsWith);
    }

    /**
     * username 생성: 영문 소문자 + 숫자 + 언더스코어만 허용.
     * 한글/특수문자/이모지 제거, 빈 값이면 email 앞부분 사용.
     */
    private String generateUniqueUsername(String name, String email) {
        String base;
        if (name != null && !name.isBlank()) {
            base = USERNAME_CHARS.matcher(name.toLowerCase()).replaceAll("");
        } else {
            base = "";
        }

        // name 정규화 결과가 비어있으면 email 앞부분 사용
        if (base.length() < 3) {
            String emailPrefix = email.split("@")[0].toLowerCase();
            base = USERNAME_CHARS.matcher(emailPrefix).replaceAll("");
        }

        // 그래도 짧으면 기본값
        if (base.length() < 3) {
            base = "user";
        }

        if (base.length() > 45) {
            base = base.substring(0, 45);
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }
}

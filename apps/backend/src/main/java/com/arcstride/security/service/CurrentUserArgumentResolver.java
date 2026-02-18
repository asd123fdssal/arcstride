package com.arcstride.security.service;

import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * 컨트롤러 파라미터에 현재 인증된 사용자의 userId를 주입하는 ArgumentResolver.
 * OAuth2 세션(OidcUser) → google_sub로 DB 조회 → userId 반환.
 *
 * 사용: void method(@CurrentUserId Long userId, ...)
 */
@Component
@RequiredArgsConstructor
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final UserRepository userRepository;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
                && Long.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw ApiException.badRequest("인증 정보가 없습니다.");
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof OidcUser oidcUser) {
            String googleSub = oidcUser.getSubject();
            User user = userRepository.findByGoogleSub(googleSub)
                    .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));
            return user.getUserId();
        }

        throw ApiException.badRequest("지원하지 않는 인증 방식입니다.");
    }
}

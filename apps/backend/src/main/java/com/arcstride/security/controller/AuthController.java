package com.arcstride.security.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import com.arcstride.security.dto.UserMeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "인증/세션 관리")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    /**
     * GET /api/auth/me
     * 세션 기반 (OAuth2). 미인증 시 SecurityConfig entryPoint가 401 반환.
     */
    @GetMapping("/auth/me")
    public ResponseEntity<UserMeResponse> me(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(new UserMeResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getProfilePictureUrl(),
                user.getCreatedAt()
        ));
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw ApiException.badRequest("인증 정보가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof OidcUser oidcUser) {
            String googleSub = oidcUser.getSubject();
            return userRepository.findByGoogleSub(googleSub)
                    .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));
        }

        throw ApiException.badRequest("지원하지 않는 인증 방식입니다.");
    }
}

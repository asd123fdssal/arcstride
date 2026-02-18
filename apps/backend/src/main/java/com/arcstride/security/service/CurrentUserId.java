package com.arcstride.security.service;

import java.lang.annotation.*;

/**
 * 컨트롤러 파라미터에 현재 인증된 사용자의 userId를 주입합니다.
 * OAuth2(세션) / JWT 모두 지원.
 *
 * 사용: void method(@CurrentUserId Long userId, ...)
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUserId {
}

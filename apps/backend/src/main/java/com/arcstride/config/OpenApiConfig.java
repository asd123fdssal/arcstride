package com.arcstride.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI arcstrideOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Arcstride API")
                        .description("서브컬쳐 미디어 진행도 관리 플랫폼 API")
                        .version("0.1.0")
                        .contact(new Contact().name("Arcstride")))
                .components(new Components()
                        .addSecuritySchemes("session", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")
                                .description("세션 기반 인증 (OAuth2 로그인 후 자동 발급)"))
                        .addSecuritySchemes("csrf", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-XSRF-TOKEN")
                                .description("CSRF 토큰 (XSRF-TOKEN 쿠키에서 읽어 헤더로 전송)")))
                .addSecurityItem(new SecurityRequirement().addList("session"));
    }
}

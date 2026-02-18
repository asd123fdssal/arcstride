package com.arcstride.security.dto;

import java.time.LocalDateTime;

public record UserMeResponse(
        Long userId,
        String username,
        String email,
        String profilePictureUrl,
        LocalDateTime createdAt
) {}

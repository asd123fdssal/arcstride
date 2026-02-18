package com.arcstride.domain.guide.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.guide.dto.GuideDtos;
import com.arcstride.domain.guide.service.GuideService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Guide", description = "공략 관리")
@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;

    /** POST /api/guides */
    @PostMapping
    public ResponseEntity<GuideDtos.CreateResponse> create(
            @Valid @RequestBody GuideDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(guideService.create(userId, req));
    }

    /** GET /api/guides (공개) */
    @GetMapping
    public ResponseEntity<PageResponse<GuideDtos.GuideListItem>> list(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(guideService.list(targetType, targetId, pageable)));
    }

    /** GET /api/guides/{guideId} (공개) */
    @GetMapping("/{guideId}")
    public ResponseEntity<GuideDtos.GuideDetailResponse> detail(@PathVariable Long guideId) {
        return ResponseEntity.ok(guideService.detail(guideId));
    }

    /** PATCH /api/guides/{guideId} (작성자만) */
    @PatchMapping("/{guideId}")
    public ResponseEntity<GuideDtos.GuideDetailResponse> patch(
            @PathVariable Long guideId,
            @RequestBody GuideDtos.PatchRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(guideService.patch(userId, guideId, req));
    }

    /** DELETE /api/guides/{guideId} (작성자만) */
    @DeleteMapping("/{guideId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long guideId,
            @CurrentUserId Long userId) {
        guideService.delete(userId, guideId);
        return ResponseEntity.noContent().build();
    }
}

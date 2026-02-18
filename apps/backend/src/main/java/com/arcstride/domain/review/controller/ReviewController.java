package com.arcstride.domain.review.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.review.dto.ReviewDtos;
import com.arcstride.domain.review.service.ReviewService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Review", description = "리뷰 관리")
@RestController
@RequestMapping("/api/titles/{titleId}")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** PUT /api/titles/{titleId}/my-review */
    @PutMapping("/my-review")
    public ResponseEntity<ReviewDtos.MyReviewResponse> upsert(
            @PathVariable Long titleId,
            @Valid @RequestBody ReviewDtos.UpsertRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(reviewService.upsert(userId, titleId, req));
    }

    /** DELETE /api/titles/{titleId}/my-review */
    @DeleteMapping("/my-review")
    public ResponseEntity<Void> delete(
            @PathVariable Long titleId,
            @CurrentUserId Long userId) {
        reviewService.delete(userId, titleId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/titles/{titleId}/reviews (공개) */
    @GetMapping("/reviews")
    public ResponseEntity<PageResponse<ReviewDtos.PublicReviewItem>> list(
            @PathVariable Long titleId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(reviewService.listByTitle(titleId, pageable)));
    }
}

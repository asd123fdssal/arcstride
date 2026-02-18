package com.arcstride.domain.progress.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.ItemsResponse;
import com.arcstride.domain.progress.dto.ProgressDtos;
import com.arcstride.domain.progress.service.ProgressService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Progress", description = "진행도 관리")
@RestController
@RequestMapping("/api/me/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PutMapping("/units/{unitId}")
    public ResponseEntity<ProgressDtos.UnitProgressResponse> upsert(
            @PathVariable Long unitId,
            @Valid @RequestBody ProgressDtos.UpsertRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(progressService.upsert(userId, unitId, req));
    }

    @GetMapping("/titles/{titleId}")
    public ResponseEntity<ProgressDtos.TitleSummaryResponse> titleSummary(
            @PathVariable Long titleId,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(progressService.titleSummary(userId, titleId));
    }

    @GetMapping("/titles/{titleId}/units")
    public ResponseEntity<ItemsResponse<ProgressDtos.UnitStatusItem>> unitList(
            @PathVariable Long titleId,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(
                ItemsResponse.of(progressService.unitProgressList(userId, titleId)));
    }
}

package com.arcstride.domain.progress.dto;

import com.arcstride.common.enums.Enums.ProgressStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.Map;

public final class ProgressDtos {
    private ProgressDtos() {}

    public record UpsertRequest(
            @NotNull ProgressStatus status,
            LocalDateTime startedAt,
            LocalDateTime finishedAt
    ) {}

    public record UnitProgressResponse(
            Long unitId,
            ProgressStatus status,
            LocalDateTime startedAt,
            LocalDateTime finishedAt,
            LocalDateTime updatedAt
    ) {}

    public record TitleSummaryResponse(
            Long titleId,
            ProgressStatus derivedStatus,
            Map<String, Long> unitSummary
    ) {}

    public record UnitStatusItem(
            Long unitId,
            ProgressStatus status
    ) {}
}

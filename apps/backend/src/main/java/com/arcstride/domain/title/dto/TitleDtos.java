package com.arcstride.domain.title.dto;

import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.entity.TitleStats;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class TitleDtos {
    private TitleDtos() {}

    public record CreateRequest(
            @NotNull TitleType type,
            @NotBlank String originalTitle,
            String koreanTitle,
            LocalDate releaseDate,
            String coverUrl,
            String summary,
            @NotNull Boolean isExplicit
    ) {}

    public record CreateResponse(Long titleId) {}

    public record ListItem(
            Long titleId,
            String type,
            String originalTitle,
            String koreanTitle,
            LocalDate releaseDate,
            String coverUrl,
            Boolean isExplicit,
            StatsDto stats
    ) {
        public static ListItem from(Title t) {
            return new ListItem(
                    t.getTitleId(), t.getType().name(), t.getOriginalTitle(), t.getKoreanTitle(),
                    t.getReleaseDate(), t.getCoverUrl(), t.getIsExplicit(),
                    StatsDto.from(t.getStats())
            );
        }
    }

    public record DetailResponse(
            Long titleId,
            String type,
            String originalTitle,
            String koreanTitle,
            LocalDate releaseDate,
            String coverUrl,
            String summary,
            Boolean isExplicit,
            List<String> aliases,
            StatsDto stats,
            LocalDateTime createdAt
    ) {}

    public record StatsDto(
            Double avgGraphics,
            Double avgStory,
            Double avgMusic,
            Double avgEtc,
            Integer reviewCount,
            Integer commentCount
    ) {
        public static StatsDto from(TitleStats s) {
            if (s == null) return new StatsDto(0.0, 0.0, 0.0, 0.0, 0, 0);
            return new StatsDto(
                    s.avgGraphics(), s.avgStory(), s.avgMusic(), s.avgEtc(),
                    s.getReviewCount(), s.getCommentCount()
            );
        }
    }

    // Alias DTO (replaces Map<String, String>)
    public record AddAliasRequest(
            @NotBlank String aliasText
    ) {}

    public record AddAliasResponse(Long aliasId) {}
}

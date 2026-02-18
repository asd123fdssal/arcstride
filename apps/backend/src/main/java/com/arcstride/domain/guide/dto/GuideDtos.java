package com.arcstride.domain.guide.dto;

import com.arcstride.common.enums.Enums.TargetType;
import com.arcstride.common.enums.Enums.Visibility;
import com.arcstride.domain.guide.entity.Guide;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public final class GuideDtos {
    private GuideDtos() {}

    public record Target(
            @NotNull TargetType type,
            @NotNull Long id
    ) {}

    public record CreateRequest(
            @NotNull Target target,
            @NotBlank String title,
            @NotBlank String content,
            Visibility visibility
    ) {}

    public record PatchRequest(
            String title,
            String content,
            Visibility visibility
    ) {}

    public record CreateResponse(Long guideId) {}

    public record GuideListItem(
            Long guideId,
            UserRef author,
            Target target,
            String title,
            Visibility visibility,
            LocalDateTime createdAt
    ) {
        public static GuideListItem from(Guide g) {
            Target target = g.getTitle() != null
                    ? new Target(TargetType.TITLE, g.getTitle().getTitleId())
                    : new Target(TargetType.UNIT, g.getUnit().getUnitId());
            return new GuideListItem(
                    g.getGuideId(),
                    new UserRef(g.getAuthor().getUserId(), g.getAuthor().getUsername()),
                    target,
                    g.getGuideTitle(),
                    g.getVisibility(),
                    g.getCreatedAt()
            );
        }
    }

    public record GuideDetailResponse(
            Long guideId,
            UserRef author,
            Target target,
            String title,
            String content,
            Visibility visibility,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static GuideDetailResponse from(Guide g) {
            Target target = g.getTitle() != null
                    ? new Target(TargetType.TITLE, g.getTitle().getTitleId())
                    : new Target(TargetType.UNIT, g.getUnit().getUnitId());
            return new GuideDetailResponse(
                    g.getGuideId(),
                    new UserRef(g.getAuthor().getUserId(), g.getAuthor().getUsername()),
                    target,
                    g.getGuideTitle(),
                    g.getContent(),
                    g.getVisibility(),
                    g.getCreatedAt(),
                    g.getUpdatedAt()
            );
        }
    }

    public record UserRef(Long userId, String username) {}
}

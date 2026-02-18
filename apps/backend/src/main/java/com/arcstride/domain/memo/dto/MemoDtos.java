package com.arcstride.domain.memo.dto;

import com.arcstride.common.enums.Enums.TargetType;
import com.arcstride.common.enums.Enums.Visibility;
import com.arcstride.domain.memo.entity.UserMemo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public final class MemoDtos {
    private MemoDtos() {}

    /** 요청용: type + id만 */
    public record TargetRef(
            @NotNull TargetType type,
            @NotNull Long id
    ) {}

    /** 응답용: titleId 포함 (UNIT일 때 소속 Title로 링크용) */
    public record Target(
            TargetType type,
            Long id,
            Long titleId
    ) {}

    public record CreateRequest(
            @NotNull TargetRef target,
            @NotBlank String memoText,
            Boolean spoilerFlag,
            Visibility visibility
    ) {}

    public record PatchRequest(
            String memoText,
            Boolean spoilerFlag,
            Visibility visibility
    ) {}

    public record CreateResponse(Long memoId) {}

    public record MemoItem(
            Long memoId,
            Target target,
            String memoText,
            Boolean spoilerFlag,
            Visibility visibility,
            LocalDateTime updatedAt
    ) {
        public static MemoItem from(UserMemo m) {
            Target target;
            if (m.getTitle() != null) {
                target = new Target(TargetType.TITLE, m.getTitle().getTitleId(), m.getTitle().getTitleId());
            } else {
                target = new Target(TargetType.UNIT, m.getUnit().getUnitId(), m.getUnit().getTitle().getTitleId());
            }
            return new MemoItem(
                    m.getMemoId(), target, m.getMemoText(),
                    m.getSpoilerFlag(), m.getVisibility(), m.getUpdatedAt()
            );
        }
    }
}

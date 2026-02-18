package com.arcstride.domain.unit.dto;

import com.arcstride.common.enums.Enums.UnitType;
import com.arcstride.domain.unit.entity.Unit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class UnitDtos {
    private UnitDtos() {}

    public record CreateRequest(
            @NotNull UnitType unitType,
            @NotBlank String unitKey,
            String displayName,
            Integer sortOrder,
            LocalDate releaseDate,
            Long characterId
    ) {}

    public record CreateResponse(Long unitId) {}

    public record ListItem(
            Long unitId,
            String unitType,
            String unitKey,
            String displayName,
            Integer sortOrder,
            LocalDate releaseDate,
            Long characterId,
            LocalDateTime createdAt
    ) {
        public static ListItem from(Unit u) {
            return new ListItem(
                    u.getUnitId(), u.getUnitType().name(), u.getUnitKey(), u.getDisplayName(),
                    u.getSortOrder(), u.getReleaseDate(),
                    u.getCharacter() != null ? u.getCharacter().getCharacterId() : null,
                    u.getCreatedAt()
            );
        }
    }

    public record PatchRequest(Integer sortOrder) {}

    public record PatchResponse(Long unitId, Integer sortOrder) {}
}

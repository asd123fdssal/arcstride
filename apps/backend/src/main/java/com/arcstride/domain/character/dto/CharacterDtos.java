package com.arcstride.domain.character.dto;

import com.arcstride.domain.character.entity.GameCharacter;

public final class CharacterDtos {
    private CharacterDtos() {}

    public record CreateRequest(
            String originalName,
            String koreanName,
            String characterImageUrl,
            Boolean isExplicit
    ) {}

    public record CreateResponse(Long characterId) {}

    public record ListItem(
            Long characterId,
            String originalName,
            String koreanName,
            String characterImageUrl,
            Boolean isExplicit
    ) {
        public static ListItem from(GameCharacter c) {
            return new ListItem(
                    c.getCharacterId(), c.getOriginalName(), c.getKoreanName(),
                    c.getCharacterImageUrl(), c.getIsExplicit()
            );
        }
    }
}

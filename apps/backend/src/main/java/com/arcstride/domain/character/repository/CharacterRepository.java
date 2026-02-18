package com.arcstride.domain.character.repository;

import com.arcstride.domain.character.entity.GameCharacter;
import com.arcstride.common.enums.Enums.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CharacterRepository extends JpaRepository<GameCharacter, Long> {

    List<GameCharacter> findByTitle_TitleIdAndStatus(Long titleId, ContentStatus status);

    boolean existsByTitle_TitleIdAndNormalizedOriginalName(Long titleId, String normalizedOriginalName);

    boolean existsByTitle_TitleIdAndNormalizedKoreanName(Long titleId, String normalizedKoreanName);
}

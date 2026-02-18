package com.arcstride.domain.unit.repository;

import com.arcstride.domain.unit.entity.Unit;
import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UnitRepository extends JpaRepository<Unit, Long> {

    @Query("""
        SELECT u FROM Unit u
        WHERE u.title.titleId = :titleId
          AND u.status = 'ACTIVE'
          AND (:unitType IS NULL OR u.unitType = :unitType)
        ORDER BY
          CASE WHEN u.sortOrder IS NULL THEN 1 ELSE 0 END,
          u.sortOrder ASC,
          u.createdAt ASC
    """)
    List<Unit> findByTitleOrdered(@Param("titleId") Long titleId, @Param("unitType") String unitType);

    boolean existsByTitle_TitleIdAndUnitTypeAndNormalizedUnitKey(Long titleId, UnitType unitType, String normalizedUnitKey);

    long countByTitle_TitleIdAndStatus(Long titleId, ContentStatus status);
}

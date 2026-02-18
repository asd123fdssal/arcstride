package com.arcstride.domain.guide.repository;

import com.arcstride.domain.guide.entity.Guide;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.arcstride.common.enums.Enums.ContentStatus;
import java.util.Optional;

public interface GuideRepository extends JpaRepository<Guide, Long> {

    @Query("""
        SELECT g FROM Guide g
        WHERE g.status = 'ACTIVE'
          AND g.visibility = 'PUBLIC'
          AND (:targetType = 'TITLE' AND g.title.titleId = :targetId
               OR :targetType = 'UNIT' AND g.unit.unitId = :targetId)
    """)
    Page<Guide> findPublicByTarget(@Param("targetType") String targetType,
                                    @Param("targetId") Long targetId,
                                    Pageable pageable);

    @Query("""
        SELECT g FROM Guide g
        WHERE g.status = 'ACTIVE' AND g.visibility = 'PUBLIC'
    """)
    Page<Guide> findAllPublic(Pageable pageable);

    Optional<Guide> findByGuideIdAndStatus(Long guideId, ContentStatus status);
}

package com.arcstride.domain.title.repository;

import com.arcstride.domain.title.entity.Title;
import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.TitleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TitleRepository extends JpaRepository<Title, Long> {

    Page<Title> findByStatus(ContentStatus status, Pageable pageable);

    Page<Title> findByTypeAndStatus(TitleType type, ContentStatus status, Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM Title t
        LEFT JOIN TitleAlias a ON a.title = t
        WHERE t.status = 'ACTIVE'
          AND (:type IS NULL OR t.type = :type)
          AND (
            LOWER(t.originalTitle) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(t.koreanTitle) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.aliasText) LIKE LOWER(CONCAT('%', :q, '%'))
          )
    """)
    Page<Title> search(@Param("q") String query, @Param("type") TitleType type, Pageable pageable);
}

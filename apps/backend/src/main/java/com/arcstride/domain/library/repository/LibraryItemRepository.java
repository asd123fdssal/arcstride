package com.arcstride.domain.library.repository;

import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.domain.library.entity.UserLibraryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LibraryItemRepository extends JpaRepository<UserLibraryItem, Long> {

    Optional<UserLibraryItem> findByUser_UserIdAndTitle_TitleId(Long userId, Long titleId);

    @Query("""
        SELECT li FROM UserLibraryItem li
        JOIN FETCH li.title t
        JOIN FETCH li.store s
        WHERE li.user.userId = :userId
          AND (:type IS NULL OR t.type = :type)
        ORDER BY li.updatedAt DESC
    """)
    Page<UserLibraryItem> findByUserFiltered(@Param("userId") Long userId,
                                              @Param("type") TitleType type,
                                              Pageable pageable);

    @Query("""
        SELECT li FROM UserLibraryItem li
        JOIN FETCH li.title t
        JOIN FETCH li.store s
        LEFT JOIN TitleAlias a ON a.title = t
        WHERE li.user.userId = :userId
          AND (:type IS NULL OR t.type = :type)
          AND (
            LOWER(t.originalTitle) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(t.koreanTitle) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.aliasText) LIKE LOWER(CONCAT('%', :q, '%'))
          )
        ORDER BY li.updatedAt DESC
    """)
    Page<UserLibraryItem> searchByUser(@Param("userId") Long userId,
                                        @Param("type") TitleType type,
                                        @Param("q") String query,
                                        Pageable pageable);
}

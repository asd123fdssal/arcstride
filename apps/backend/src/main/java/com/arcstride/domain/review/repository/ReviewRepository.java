package com.arcstride.domain.review.repository;

import com.arcstride.domain.review.entity.UserReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<UserReview, Long> {

    Optional<UserReview> findByUser_UserIdAndTitle_TitleId(Long userId, Long titleId);

    Page<UserReview> findByTitle_TitleId(Long titleId, Pageable pageable);

    long countByTitle_TitleId(Long titleId);

    @Query("""
        SELECT
            COALESCE(AVG(r.graphicsScoreX2), 0),
            COALESCE(AVG(r.storyScoreX2), 0),
            COALESCE(AVG(r.musicScoreX2), 0),
            COALESCE(AVG(r.etcScoreX2), 0),
            COUNT(r)
        FROM UserReview r
        WHERE r.title.titleId = :titleId
    """)
    Object[] aggregateByTitle(@Param("titleId") Long titleId);
}

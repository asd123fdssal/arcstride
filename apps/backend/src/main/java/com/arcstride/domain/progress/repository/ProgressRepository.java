package com.arcstride.domain.progress.repository;

import com.arcstride.domain.progress.entity.UserUnitProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<UserUnitProgress, Long> {

    Optional<UserUnitProgress> findByUser_UserIdAndUnit_UnitId(Long userId, Long unitId);

    @Query("""
        SELECT p FROM UserUnitProgress p
        JOIN p.unit u
        WHERE p.user.userId = :userId
          AND u.title.titleId = :titleId
    """)
    List<UserUnitProgress> findByUserAndTitle(@Param("userId") Long userId, @Param("titleId") Long titleId);

    @Query("""
        SELECT p.status AS status, COUNT(p) AS cnt
        FROM UserUnitProgress p
        JOIN p.unit u
        WHERE p.user.userId = :userId
          AND u.title.titleId = :titleId
        GROUP BY p.status
    """)
    List<StatusCount> countByUserAndTitleGroupByStatus(@Param("userId") Long userId, @Param("titleId") Long titleId);

    interface StatusCount {
        String getStatus();
        Long getCnt();
    }
}

package com.arcstride.domain.memo.repository;

import com.arcstride.domain.memo.entity.UserMemo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemoRepository extends JpaRepository<UserMemo, Long> {

    List<UserMemo> findByUser_UserIdAndTitle_TitleId(Long userId, Long titleId);

    List<UserMemo> findByUser_UserIdAndUnit_UnitId(Long userId, Long unitId);

    List<UserMemo> findByUser_UserIdOrderByUpdatedAtDesc(Long userId);

    Optional<UserMemo> findByMemoIdAndUser_UserId(Long memoId, Long userId);

    // ── 페이지네이션 ──

    Page<UserMemo> findByUser_UserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT m FROM UserMemo m WHERE m.user.userId = :userId AND m.title IS NOT NULL ORDER BY m.updatedAt DESC")
    Page<UserMemo> findByUserIdAndTargetTitle(Long userId, Pageable pageable);

    @Query("SELECT m FROM UserMemo m WHERE m.user.userId = :userId AND m.unit IS NOT NULL ORDER BY m.updatedAt DESC")
    Page<UserMemo> findByUserIdAndTargetUnit(Long userId, Pageable pageable);

    // ── 텍스트 검색 + 페이지네이션 ──

    @Query("""
        SELECT m FROM UserMemo m WHERE m.user.userId = :userId
          AND LOWER(m.memoText) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY m.updatedAt DESC
    """)
    Page<UserMemo> searchByUser(@Param("userId") Long userId, @Param("q") String query, Pageable pageable);

    @Query("""
        SELECT m FROM UserMemo m WHERE m.user.userId = :userId
          AND m.title IS NOT NULL
          AND LOWER(m.memoText) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY m.updatedAt DESC
    """)
    Page<UserMemo> searchByUserAndTargetTitle(@Param("userId") Long userId, @Param("q") String query, Pageable pageable);

    @Query("""
        SELECT m FROM UserMemo m WHERE m.user.userId = :userId
          AND m.unit IS NOT NULL
          AND LOWER(m.memoText) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY m.updatedAt DESC
    """)
    Page<UserMemo> searchByUserAndTargetUnit(@Param("userId") Long userId, @Param("q") String query, Pageable pageable);
}

package com.arcstride.domain.comment.repository;

import com.arcstride.domain.comment.entity.Comment;
import com.arcstride.common.enums.Enums.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByTitle_TitleIdAndStatus(Long titleId, ContentStatus status, Pageable pageable);

    long countByTitle_TitleIdAndStatus(Long titleId, ContentStatus status);

    Optional<Comment> findByCommentIdAndUser_UserId(Long commentId, Long userId);
}

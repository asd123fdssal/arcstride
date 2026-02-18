package com.arcstride.domain.comment.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.comment.dto.CommentDtos;
import com.arcstride.domain.comment.entity.Comment;
import com.arcstride.domain.comment.repository.CommentRepository;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.entity.TitleStats;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.title.repository.TitleStatsRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TitleRepository titleRepository;
    private final TitleStatsRepository statsRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentDtos.CreateResponse create(Long userId, Long titleId, CommentDtos.CreateRequest req) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        Comment comment = Comment.builder()
                .title(title)
                .user(user)
                .body(req.body())
                .spoilerFlag(req.spoilerFlag() != null ? req.spoilerFlag() : false)
                .parentId(req.parentId())
                .build();
        comment = commentRepository.save(comment);

        refreshCommentCount(titleId);

        return new CommentDtos.CreateResponse(comment.getCommentId());
    }

    @Transactional(readOnly = true)
    public Page<CommentDtos.CommentItem> listByTitle(Long titleId, Pageable pageable) {
        if (!titleRepository.existsById(titleId)) {
            throw ApiException.notFound("작품을 찾을 수 없습니다.");
        }
        return commentRepository.findByTitle_TitleIdAndStatus(titleId, ContentStatus.ACTIVE, pageable)
                .map(CommentDtos.CommentItem::from);
    }

    @Transactional
    public void delete(Long userId, Long commentId) {
        Comment comment = commentRepository.findByCommentIdAndUser_UserId(commentId, userId)
                .orElseThrow(() -> ApiException.forbidden("댓글을 찾을 수 없거나 삭제 권한이 없습니다."));

        Long titleId = comment.getTitle().getTitleId();
        commentRepository.delete(comment);
        refreshCommentCount(titleId);
    }

    private void refreshCommentCount(Long titleId) {
        long count = commentRepository.countByTitle_TitleIdAndStatus(titleId, ContentStatus.ACTIVE);
        TitleStats stats = statsRepository.findById(titleId)
                .orElseGet(() -> {
                    Title t = titleRepository.getReferenceById(titleId);
                    return TitleStats.builder().title(t).build();
                });
        stats.setCommentCount((int) count);
        statsRepository.save(stats);
    }
}

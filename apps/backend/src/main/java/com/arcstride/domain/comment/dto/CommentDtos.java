package com.arcstride.domain.comment.dto;

import com.arcstride.domain.comment.entity.Comment;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public final class CommentDtos {
    private CommentDtos() {}

    public record CreateRequest(
            @NotBlank String body,
            Boolean spoilerFlag,
            Long parentId
    ) {}

    public record CreateResponse(Long commentId) {}

    public record CommentItem(
            Long commentId,
            UserRef user,
            String body,
            Boolean spoilerFlag,
            Long parentId,
            LocalDateTime createdAt
    ) {
        public static CommentItem from(Comment c) {
            return new CommentItem(
                    c.getCommentId(),
                    new UserRef(c.getUser().getUserId(), c.getUser().getUsername()),
                    c.getBody(),
                    c.getSpoilerFlag(),
                    c.getParentId(),
                    c.getCreatedAt()
            );
        }
    }

    public record UserRef(Long userId, String username) {}
}

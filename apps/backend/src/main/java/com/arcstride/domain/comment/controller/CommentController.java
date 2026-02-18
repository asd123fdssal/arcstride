package com.arcstride.domain.comment.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.comment.dto.CommentDtos;
import com.arcstride.domain.comment.service.CommentService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Comment", description = "댓글 관리")
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** POST /api/titles/{titleId}/comments */
    @PostMapping("/api/titles/{titleId}/comments")
    public ResponseEntity<CommentDtos.CreateResponse> create(
            @PathVariable Long titleId,
            @Valid @RequestBody CommentDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.create(userId, titleId, req));
    }

    /** GET /api/titles/{titleId}/comments (공개) */
    @GetMapping("/api/titles/{titleId}/comments")
    public ResponseEntity<PageResponse<CommentDtos.CommentItem>> list(
            @PathVariable Long titleId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(commentService.listByTitle(titleId, pageable)));
    }

    /** DELETE /api/comments/{commentId} */
    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long commentId,
            @CurrentUserId Long userId) {
        commentService.delete(userId, commentId);
        return ResponseEntity.noContent().build();
    }
}

package com.arcstride.domain.memo.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.ItemsResponse;
import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.memo.dto.MemoDtos;
import com.arcstride.domain.memo.service.MemoService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Memo", description = "메모 관리")
@RestController
@RequestMapping("/api/me/memos")
@RequiredArgsConstructor
public class MemoController {

    private final MemoService memoService;

    @PostMapping
    public ResponseEntity<MemoDtos.CreateResponse> create(
            @Valid @RequestBody MemoDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memoService.create(userId, req));
    }

    @GetMapping
    public ResponseEntity<ItemsResponse<MemoDtos.MemoItem>> list(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(
                ItemsResponse.of(memoService.list(userId, targetType, targetId)));
    }

    /** GET /api/me/memos/paged?q=&targetType=TITLE&page=0&size=20 */
    @GetMapping("/paged")
    public ResponseEntity<PageResponse<MemoDtos.MemoItem>> pagedList(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String targetType,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @CurrentUserId Long userId) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(
                    PageResponse.of(memoService.searchPagedList(userId, q.trim(), targetType, pageable)));
        }
        return ResponseEntity.ok(
                PageResponse.of(memoService.pagedList(userId, targetType, pageable)));
    }

    @PatchMapping("/{memoId}")
    public ResponseEntity<MemoDtos.MemoItem> patch(
            @PathVariable Long memoId,
            @RequestBody MemoDtos.PatchRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(memoService.patch(userId, memoId, req));
    }

    @DeleteMapping("/{memoId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long memoId,
            @CurrentUserId Long userId) {
        memoService.delete(userId, memoId);
        return ResponseEntity.noContent().build();
    }
}

package com.arcstride.domain.library.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.ItemsResponse;
import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.library.dto.LibraryDtos;
import com.arcstride.domain.library.service.LibraryService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Library", description = "라이브러리/소장 관리")
@RestController
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    /** PUT /api/me/library/titles/{titleId} */
    @PutMapping("/api/me/library/titles/{titleId}")
    public ResponseEntity<LibraryDtos.LibraryItemResponse> upsert(
            @PathVariable Long titleId,
            @Valid @RequestBody LibraryDtos.UpsertRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(libraryService.upsert(userId, titleId, req));
    }

    /** GET /api/me/library/titles/{titleId} */
    @GetMapping("/api/me/library/titles/{titleId}")
    public ResponseEntity<LibraryDtos.LibraryItemResponse> getOne(
            @PathVariable Long titleId,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(libraryService.getOne(userId, titleId));
    }

    /** GET /api/me/library?q=&type=VIDEO&page=0&size=20 */
    @GetMapping("/api/me/library")
    public ResponseEntity<PageResponse<LibraryDtos.LibraryListItem>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20) Pageable pageable,
            @CurrentUserId Long userId) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(PageResponse.of(libraryService.search(userId, q.trim(), type, pageable)));
        }
        return ResponseEntity.ok(PageResponse.of(libraryService.list(userId, type, pageable)));
    }

    /** DELETE /api/me/library/titles/{titleId} */
    @DeleteMapping("/api/me/library/titles/{titleId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long titleId,
            @CurrentUserId Long userId) {
        libraryService.delete(userId, titleId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/stores (공개) */
    @GetMapping("/api/stores")
    public ResponseEntity<ItemsResponse<LibraryDtos.StoreItem>> listStores() {
        return ResponseEntity.ok(ItemsResponse.of(libraryService.listStores()));
    }
}

package com.arcstride.domain.title.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.PageResponse;
import com.arcstride.domain.title.dto.TitleDtos;
import com.arcstride.domain.title.service.TitleService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Title", description = "작품 관리")
@RestController
@RequestMapping("/api/titles")
@RequiredArgsConstructor
public class TitleController {

    private final TitleService titleService;

    @PostMapping
    public ResponseEntity<TitleDtos.CreateResponse> create(
            @Valid @RequestBody TitleDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(titleService.create(req, userId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<TitleDtos.ListItem>> list(
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(titleService.list(type, pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<TitleDtos.ListItem>> search(
            @RequestParam String q,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.of(titleService.search(q, type, pageable)));
    }

    @GetMapping("/{titleId}")
    public ResponseEntity<TitleDtos.DetailResponse> detail(@PathVariable Long titleId) {
        return ResponseEntity.ok(titleService.detail(titleId));
    }

    @PostMapping("/{titleId}/aliases")
    public ResponseEntity<TitleDtos.AddAliasResponse> addAlias(
            @PathVariable Long titleId,
            @Valid @RequestBody TitleDtos.AddAliasRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(titleService.addAlias(titleId, req));
    }

    @DeleteMapping("/{titleId}/aliases/{aliasId}")
    public ResponseEntity<Void> deleteAlias(
            @PathVariable Long titleId,
            @PathVariable Long aliasId) {
        titleService.deleteAlias(titleId, aliasId);
        return ResponseEntity.noContent().build();
    }
}

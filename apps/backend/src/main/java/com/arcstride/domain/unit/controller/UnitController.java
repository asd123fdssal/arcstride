package com.arcstride.domain.unit.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.ItemsResponse;
import com.arcstride.domain.unit.dto.UnitDtos;
import com.arcstride.domain.unit.service.UnitService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Unit", description = "에피소드/볼륨/루트 관리")
@RestController
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    @PostMapping("/api/titles/{titleId}/units")
    public ResponseEntity<UnitDtos.CreateResponse> create(
            @PathVariable Long titleId,
            @Valid @RequestBody UnitDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(unitService.create(titleId, req, userId));
    }

    @GetMapping("/api/titles/{titleId}/units")
    public ResponseEntity<ItemsResponse<UnitDtos.ListItem>> list(
            @PathVariable Long titleId,
            @RequestParam(required = false) String unitType) {
        return ResponseEntity.ok(ItemsResponse.of(unitService.listByTitle(titleId, unitType)));
    }

    @PatchMapping("/api/units/{unitId}")
    public ResponseEntity<UnitDtos.PatchResponse> patchSortOrder(
            @PathVariable Long unitId,
            @RequestBody UnitDtos.PatchRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.ok(unitService.patchSortOrder(unitId, req));
    }
}

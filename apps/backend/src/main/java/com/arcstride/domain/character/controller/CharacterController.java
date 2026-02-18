package com.arcstride.domain.character.controller;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.arcstride.common.dto.ItemsResponse;
import com.arcstride.domain.character.dto.CharacterDtos;
import com.arcstride.domain.character.service.CharacterService;
import com.arcstride.security.service.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Character", description = "캐릭터 관리")
@RestController
@RequestMapping("/api/titles/{titleId}/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping
    public ResponseEntity<CharacterDtos.CreateResponse> create(
            @PathVariable Long titleId,
            @Valid @RequestBody CharacterDtos.CreateRequest req,
            @CurrentUserId Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(characterService.create(titleId, req, userId));
    }

    @GetMapping
    public ResponseEntity<ItemsResponse<CharacterDtos.ListItem>> list(@PathVariable Long titleId) {
        return ResponseEntity.ok(ItemsResponse.of(characterService.listByTitle(titleId)));
    }
}

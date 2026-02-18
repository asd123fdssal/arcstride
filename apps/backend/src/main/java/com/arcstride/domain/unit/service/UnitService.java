package com.arcstride.domain.unit.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.exception.ApiException;
import com.arcstride.common.util.NormalizeUtil;
import com.arcstride.domain.character.entity.GameCharacter;
import com.arcstride.domain.character.repository.CharacterRepository;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.unit.dto.UnitDtos;
import com.arcstride.domain.unit.entity.Unit;
import com.arcstride.domain.unit.repository.UnitRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final TitleRepository titleRepository;
    private final CharacterRepository characterRepository;
    private final UserRepository userRepository;

    @Transactional
    public UnitDtos.CreateResponse create(Long titleId, UnitDtos.CreateRequest req, Long userId) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        String normalized = NormalizeUtil.normalize(req.unitKey());

        if (unitRepository.existsByTitle_TitleIdAndUnitTypeAndNormalizedUnitKey(titleId, req.unitType(), normalized)) {
            throw ApiException.conflict("동일한 유닛이 이미 존재합니다.");
        }

        GameCharacter character = null;
        if (req.characterId() != null) {
            character = characterRepository.findById(req.characterId())
                    .orElseThrow(() -> ApiException.notFound("캐릭터를 찾을 수 없습니다."));
        }

        Unit unit = Unit.builder()
                .title(title)
                .unitType(req.unitType())
                .unitKey(req.unitKey().strip())
                .normalizedUnitKey(normalized)
                .displayName(req.displayName())
                .sortOrder(req.sortOrder())
                .releaseDate(req.releaseDate())
                .character(character)
                .createdBy(user)
                .build();
        unit = unitRepository.save(unit);

        return new UnitDtos.CreateResponse(unit.getUnitId());
    }

    @Transactional(readOnly = true)
    public List<UnitDtos.ListItem> listByTitle(Long titleId, String unitType) {
        if (!titleRepository.existsById(titleId)) {
            throw ApiException.notFound("작품을 찾을 수 없습니다.");
        }
        return unitRepository.findByTitleOrdered(titleId, unitType).stream()
                .map(UnitDtos.ListItem::from)
                .toList();
    }

    @Transactional
    public UnitDtos.PatchResponse patchSortOrder(Long unitId, UnitDtos.PatchRequest req) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> ApiException.notFound("유닛을 찾을 수 없습니다."));
        unit.setSortOrder(req.sortOrder());
        return new UnitDtos.PatchResponse(unit.getUnitId(), unit.getSortOrder());
    }
}

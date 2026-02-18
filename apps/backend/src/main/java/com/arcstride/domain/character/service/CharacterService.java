package com.arcstride.domain.character.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.common.exception.ApiException;
import com.arcstride.common.util.NormalizeUtil;
import com.arcstride.domain.character.dto.CharacterDtos;
import com.arcstride.domain.character.entity.GameCharacter;
import com.arcstride.domain.character.repository.CharacterRepository;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final TitleRepository titleRepository;
    private final UserRepository userRepository;

    @Transactional
    public CharacterDtos.CreateResponse create(Long titleId, CharacterDtos.CreateRequest req, Long userId) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));

        if (title.getType() != TitleType.GAME) {
            throw ApiException.badRequest("캐릭터는 GAME 타입 작품에만 등록 가능합니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        String normOrig = NormalizeUtil.normalize(req.originalName());
        String normKor = NormalizeUtil.normalize(req.koreanName());

        // 중복 검사 (정규화 기준)
        if (normOrig != null && characterRepository.existsByTitle_TitleIdAndNormalizedOriginalName(titleId, normOrig)) {
            throw ApiException.conflict("동일한 원어 이름의 캐릭터가 이미 존재합니다.");
        }
        if (normKor != null && characterRepository.existsByTitle_TitleIdAndNormalizedKoreanName(titleId, normKor)) {
            throw ApiException.conflict("동일한 한국어 이름의 캐릭터가 이미 존재합니다.");
        }

        GameCharacter character = GameCharacter.builder()
                .title(title)
                .originalName(req.originalName())
                .koreanName(req.koreanName())
                .normalizedOriginalName(normOrig)
                .normalizedKoreanName(normKor)
                .characterImageUrl(req.characterImageUrl())
                .isExplicit(req.isExplicit() != null ? req.isExplicit() : false)
                .createdBy(user)
                .build();
        character = characterRepository.save(character);

        return new CharacterDtos.CreateResponse(character.getCharacterId());
    }

    @Transactional(readOnly = true)
    public List<CharacterDtos.ListItem> listByTitle(Long titleId) {
        if (!titleRepository.existsById(titleId)) {
            throw ApiException.notFound("작품을 찾을 수 없습니다.");
        }
        return characterRepository.findByTitle_TitleIdAndStatus(titleId, ContentStatus.ACTIVE).stream()
                .map(CharacterDtos.ListItem::from)
                .toList();
    }
}

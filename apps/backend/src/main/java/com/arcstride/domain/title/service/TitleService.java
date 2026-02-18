package com.arcstride.domain.title.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.title.dto.TitleDtos;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.entity.TitleAlias;
import com.arcstride.domain.title.entity.TitleStats;
import com.arcstride.domain.title.repository.TitleAliasRepository;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.title.repository.TitleStatsRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TitleService {

    private final TitleRepository titleRepository;
    private final TitleAliasRepository aliasRepository;
    private final TitleStatsRepository statsRepository;
    private final UserRepository userRepository;

    @Transactional
    public TitleDtos.CreateResponse create(TitleDtos.CreateRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        Title title = Title.builder()
                .type(req.type())
                .originalTitle(req.originalTitle())
                .koreanTitle(req.koreanTitle())
                .releaseDate(req.releaseDate())
                .coverUrl(req.coverUrl())
                .summary(req.summary())
                .isExplicit(req.isExplicit())
                .createdBy(user)
                .build();
        title = titleRepository.save(title);

        TitleStats stats = TitleStats.builder().title(title).build();
        statsRepository.save(stats);

        return new TitleDtos.CreateResponse(title.getTitleId());
    }

    @Transactional(readOnly = true)
    public Page<TitleDtos.ListItem> list(String type, Pageable pageable) {
        Page<Title> page;
        TitleType titleType = parseTitleType(type);
        if (titleType != null) {
            page = titleRepository.findByTypeAndStatus(titleType, ContentStatus.ACTIVE, pageable);
        } else {
            page = titleRepository.findByStatus(ContentStatus.ACTIVE, pageable);
        }
        return page.map(TitleDtos.ListItem::from);
    }

    @Transactional(readOnly = true)
    public Page<TitleDtos.ListItem> search(String q, String type, Pageable pageable) {
        TitleType titleType = parseTitleType(type);
        return titleRepository.search(q, titleType, pageable).map(TitleDtos.ListItem::from);
    }

    private TitleType parseTitleType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return TitleType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("type 값이 올바르지 않습니다: " + type);
        }
    }

    @Transactional(readOnly = true)
    public TitleDtos.DetailResponse detail(Long titleId) {
        Title t = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));

        List<String> aliases = aliasRepository.findByTitle_TitleId(titleId).stream()
                .map(TitleAlias::getAliasText)
                .toList();

        return new TitleDtos.DetailResponse(
                t.getTitleId(), t.getType().name(), t.getOriginalTitle(), t.getKoreanTitle(),
                t.getReleaseDate(), t.getCoverUrl(), t.getSummary(), t.getIsExplicit(),
                aliases,
                TitleDtos.StatsDto.from(t.getStats()),
                t.getCreatedAt()
        );
    }

    @Transactional
    public TitleDtos.AddAliasResponse addAlias(Long titleId, TitleDtos.AddAliasRequest req) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));

        if (aliasRepository.existsByTitle_TitleIdAndAliasText(titleId, req.aliasText())) {
            throw ApiException.conflict("동일한 별칭이 이미 존재합니다.");
        }

        TitleAlias alias = TitleAlias.builder()
                .title(title)
                .aliasText(req.aliasText())
                .build();
        alias = aliasRepository.save(alias);
        return new TitleDtos.AddAliasResponse(alias.getAliasId());
    }

    @Transactional
    public void deleteAlias(Long titleId, Long aliasId) {
        TitleAlias alias = aliasRepository.findById(aliasId)
                .orElseThrow(() -> ApiException.notFound("별칭을 찾을 수 없습니다."));
        if (!alias.getTitle().getTitleId().equals(titleId)) {
            throw ApiException.badRequest("타이틀 ID가 일치하지 않습니다.");
        }
        aliasRepository.delete(alias);
    }
}

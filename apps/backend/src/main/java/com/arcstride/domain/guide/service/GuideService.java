package com.arcstride.domain.guide.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.Visibility;
import com.arcstride.common.exception.ApiException;
import com.arcstride.common.util.TargetResolver;
import com.arcstride.domain.guide.dto.GuideDtos;
import com.arcstride.domain.guide.entity.Guide;
import com.arcstride.domain.guide.repository.GuideRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GuideService {

    private final GuideRepository guideRepository;
    private final UserRepository userRepository;
    private final TargetResolver targetResolver;

    @Transactional
    public GuideDtos.CreateResponse create(Long userId, GuideDtos.CreateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        TargetResolver.Resolved resolved = targetResolver.resolve(req.target().type(), req.target().id());

        Guide guide = Guide.builder()
                .author(user)
                .title(resolved.title())
                .unit(resolved.unit())
                .guideTitle(req.title())
                .content(req.content())
                .visibility(req.visibility() != null ? req.visibility() : Visibility.PUBLIC)
                .build();
        guide = guideRepository.save(guide);

        return new GuideDtos.CreateResponse(guide.getGuideId());
    }

    @Transactional(readOnly = true)
    public Page<GuideDtos.GuideListItem> list(String targetType, Long targetId, Pageable pageable) {
        Page<Guide> page;
        if (targetType != null && targetId != null) {
            page = guideRepository.findPublicByTarget(targetType.toUpperCase(), targetId, pageable);
        } else {
            page = guideRepository.findAllPublic(pageable);
        }
        return page.map(GuideDtos.GuideListItem::from);
    }

    @Transactional(readOnly = true)
    public GuideDtos.GuideDetailResponse detail(Long guideId) {
        Guide guide = guideRepository.findByGuideIdAndStatus(guideId, ContentStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("공략을 찾을 수 없습니다."));
        return GuideDtos.GuideDetailResponse.from(guide);
    }

    @Transactional
    public GuideDtos.GuideDetailResponse patch(Long userId, Long guideId, GuideDtos.PatchRequest req) {
        Guide guide = findOwned(userId, guideId);
        if (req.title() != null) guide.setGuideTitle(req.title());
        if (req.content() != null) guide.setContent(req.content());
        if (req.visibility() != null) guide.setVisibility(req.visibility());
        return GuideDtos.GuideDetailResponse.from(guide);
    }

    @Transactional
    public void delete(Long userId, Long guideId) {
        Guide guide = findOwned(userId, guideId);
        guideRepository.delete(guide);
    }

    private Guide findOwned(Long userId, Long guideId) {
        Guide guide = guideRepository.findByGuideIdAndStatus(guideId, ContentStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("공략을 찾을 수 없습니다."));
        if (!guide.getAuthor().getUserId().equals(userId)) {
            throw ApiException.forbidden("작성자만 수정/삭제할 수 있습니다.");
        }
        return guide;
    }
}

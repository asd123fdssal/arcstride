package com.arcstride.common.util;

import com.arcstride.common.enums.Enums.TargetType;
import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.unit.entity.Unit;
import com.arcstride.domain.unit.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TargetResolver {

    private final TitleRepository titleRepository;
    private final UnitRepository unitRepository;

    public record Resolved(Title title, Unit unit) {}

    public Resolved resolve(TargetType type, Long id) {
        return switch (type) {
            case TITLE -> new Resolved(
                    titleRepository.findById(id)
                            .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다.")),
                    null);
            case UNIT -> new Resolved(
                    null,
                    unitRepository.findById(id)
                            .orElseThrow(() -> ApiException.notFound("유닛을 찾을 수 없습니다.")));
        };
    }
}

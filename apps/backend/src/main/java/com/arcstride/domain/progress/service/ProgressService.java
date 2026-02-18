package com.arcstride.domain.progress.service;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.common.enums.Enums.ProgressStatus;
import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.progress.dto.ProgressDtos;
import com.arcstride.domain.progress.entity.UserUnitProgress;
import com.arcstride.domain.progress.repository.ProgressRepository;
import com.arcstride.domain.unit.entity.Unit;
import com.arcstride.domain.unit.repository.UnitRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;

    /**
     * PUT /api/me/progress/units/{unitId}
     * Upsert: 있으면 업데이트, 없으면 새로 생성
     */
    @Transactional
    public ProgressDtos.UnitProgressResponse upsert(Long userId, Long unitId, ProgressDtos.UpsertRequest req) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> ApiException.notFound("유닛을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        UserUnitProgress progress = progressRepository.findByUser_UserIdAndUnit_UnitId(userId, unitId)
                .orElseGet(() -> UserUnitProgress.builder()
                        .user(user)
                        .unit(unit)
                        .build());

        progress.setStatus(req.status());
        progress.setStartedAt(req.startedAt());
        progress.setFinishedAt(req.finishedAt());

        progress = progressRepository.save(progress);

        return new ProgressDtos.UnitProgressResponse(
                unitId,
                progress.getStatus(),
                progress.getStartedAt(),
                progress.getFinishedAt(),
                progress.getUpdatedAt()
        );
    }

    /**
     * GET /api/me/progress/titles/{titleId}
     * Title의 derived 상태 + unit별 카운트
     */
    @Transactional(readOnly = true)
    public ProgressDtos.TitleSummaryResponse titleSummary(Long userId, Long titleId) {
        long totalUnits = unitRepository.countByTitle_TitleIdAndStatus(titleId, ContentStatus.ACTIVE);

        List<ProgressRepository.StatusCount> counts =
                progressRepository.countByUserAndTitleGroupByStatus(userId, titleId);

        Map<String, Long> summary = new LinkedHashMap<>();
        long done = 0, inProgress = 0, none = 0;

        for (ProgressRepository.StatusCount sc : counts) {
            // StatusCount.getStatus() returns String from JPQL projection (enum stored as VARCHAR)
            switch (sc.getStatus()) {
                case "DONE" -> done = sc.getCnt();
                case "PROGRESS" -> inProgress = sc.getCnt();
                case "NONE" -> none = sc.getCnt();
                default -> { /* ignore unknown status */ }
            }
        }

        // 진행도가 없는 유닛(progress 레코드 자체가 없는)은 NONE으로 취급
        long tracked = done + inProgress + none;
        none += (totalUnits - tracked);

        summary.put("total", totalUnits);
        summary.put("done", done);
        summary.put("progress", inProgress);
        summary.put("none", none);

        // Derived status logic
        ProgressStatus derivedStatus;
        if (totalUnits == 0) {
            derivedStatus = ProgressStatus.NONE;
        } else if (done == totalUnits) {
            derivedStatus = ProgressStatus.DONE;
        } else if (inProgress > 0 || done > 0) {
            derivedStatus = ProgressStatus.PROGRESS;
        } else {
            derivedStatus = ProgressStatus.NONE;
        }

        return new ProgressDtos.TitleSummaryResponse(titleId, derivedStatus, summary);
    }

    /**
     * GET /api/me/progress/titles/{titleId}/units
     * Title의 모든 유닛에 대한 내 진행도 목록
     */
    @Transactional(readOnly = true)
    public List<ProgressDtos.UnitStatusItem> unitProgressList(Long userId, Long titleId) {
        List<UserUnitProgress> progresses = progressRepository.findByUserAndTitle(userId, titleId);

        return progresses.stream()
                .map(p -> new ProgressDtos.UnitStatusItem(p.getUnit().getUnitId(), p.getStatus()))
                .toList();
    }
}

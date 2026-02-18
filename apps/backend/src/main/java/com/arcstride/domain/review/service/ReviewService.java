package com.arcstride.domain.review.service;

import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.review.dto.ReviewDtos;
import com.arcstride.domain.review.entity.UserReview;
import com.arcstride.domain.review.repository.ReviewRepository;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.entity.TitleStats;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.title.repository.TitleStatsRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TitleRepository titleRepository;
    private final TitleStatsRepository statsRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewDtos.MyReviewResponse upsert(Long userId, Long titleId, ReviewDtos.UpsertRequest req) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        validateScoreStep(req.graphics());
        validateScoreStep(req.story());
        validateScoreStep(req.music());
        validateScoreStep(req.etc());

        UserReview review = reviewRepository.findByUser_UserIdAndTitle_TitleId(userId, titleId)
                .orElseGet(() -> UserReview.builder()
                        .user(user)
                        .title(title)
                        .build());

        review.setGraphicsScoreX2(UserReview.toX2(req.graphics()));
        review.setStoryScoreX2(UserReview.toX2(req.story()));
        review.setMusicScoreX2(UserReview.toX2(req.music()));
        review.setEtcScoreX2(UserReview.toX2(req.etc()));
        review.setReviewText(req.reviewText());
        review.setSpoilerFlag(req.spoilerFlag() != null ? req.spoilerFlag() : false);

        review = reviewRepository.save(review);
        refreshTitleStats(titleId);

        return ReviewDtos.MyReviewResponse.from(review);
    }

    @Transactional
    public void delete(Long userId, Long titleId) {
        UserReview review = reviewRepository.findByUser_UserIdAndTitle_TitleId(userId, titleId)
                .orElseThrow(() -> ApiException.notFound("리뷰를 찾을 수 없습니다."));
        reviewRepository.delete(review);
        refreshTitleStats(titleId);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDtos.PublicReviewItem> listByTitle(Long titleId, Pageable pageable) {
        if (!titleRepository.existsById(titleId)) {
            throw ApiException.notFound("작품을 찾을 수 없습니다.");
        }
        return reviewRepository.findByTitle_TitleId(titleId, pageable)
                .map(ReviewDtos.PublicReviewItem::from);
    }


    private void refreshTitleStats(Long titleId) {
        Object[] agg = reviewRepository.aggregateByTitle(titleId);
        TitleStats stats = statsRepository.findById(titleId)
                .orElseGet(() -> {
                    Title t = titleRepository.getReferenceById(titleId);
                    return TitleStats.builder().title(t).build();
                });

        stats.setAvgGraphicsX2(toBigDecimal(agg[0]));
        stats.setAvgStoryX2(toBigDecimal(agg[1]));
        stats.setAvgMusicX2(toBigDecimal(agg[2]));
        stats.setAvgEtcX2(toBigDecimal(agg[3]));
        stats.setReviewCount(((Number) agg[4]).intValue());

        statsRepository.save(stats);
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        return BigDecimal.valueOf(((Number) obj).doubleValue());
    }

    private void validateScoreStep(double score) {
        // 0.5 단위 검증: score * 2 가 정수인지 확인
        if (score * 2 != Math.floor(score * 2)) {
            throw ApiException.badRequest("점수는 0.5 단위로 입력해야 합니다.");
        }
    }
}

package com.arcstride.domain.review.dto;

import com.arcstride.domain.review.entity.UserReview;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public final class ReviewDtos {
    private ReviewDtos() {}


    public record UpsertRequest(
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double graphics,
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double story,
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double music,
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double etc,
            String reviewText,
            Boolean spoilerFlag
    ) {}


    public record MyReviewResponse(
            Long titleId,
            Long userId,
            Double graphics,
            Double story,
            Double music,
            Double etc,
            String reviewText,
            Boolean spoilerFlag,
            LocalDateTime updatedAt
    ) {
        public static MyReviewResponse from(UserReview r) {
            return new MyReviewResponse(
                    r.getTitle().getTitleId(),
                    r.getUser().getUserId(),
                    UserReview.fromX2(r.getGraphicsScoreX2()),
                    UserReview.fromX2(r.getStoryScoreX2()),
                    UserReview.fromX2(r.getMusicScoreX2()),
                    UserReview.fromX2(r.getEtcScoreX2()),
                    r.getReviewText(),
                    r.getSpoilerFlag(),
                    r.getUpdatedAt()
            );
        }
    }

    public record PublicReviewItem(
            UserRef user,
            Double graphics,
            Double story,
            Double music,
            Double etc,
            String reviewText,
            Boolean spoilerFlag,
            LocalDateTime createdAt
    ) {
        public static PublicReviewItem from(UserReview r) {
            return new PublicReviewItem(
                    new UserRef(r.getUser().getUserId(), r.getUser().getUsername()),
                    UserReview.fromX2(r.getGraphicsScoreX2()),
                    UserReview.fromX2(r.getStoryScoreX2()),
                    UserReview.fromX2(r.getMusicScoreX2()),
                    UserReview.fromX2(r.getEtcScoreX2()),
                    r.getReviewText(),
                    r.getSpoilerFlag(),
                    r.getCreatedAt()
            );
        }
    }

    public record UserRef(Long userId, String username) {}
}

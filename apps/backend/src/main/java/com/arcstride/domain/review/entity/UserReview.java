package com.arcstride.domain.review.entity;

import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_reviews")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "title_id", nullable = false)
    private Title title;

    /** 0~20 정수 (실제 점수 x2) */
    @Column(name = "graphics_score_x2", nullable = false)
    private Short graphicsScoreX2;

    @Column(name = "story_score_x2", nullable = false)
    private Short storyScoreX2;

    @Column(name = "music_score_x2", nullable = false)
    private Short musicScoreX2;

    @Column(name = "etc_score_x2", nullable = false)
    private Short etcScoreX2;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "spoiler_flag", nullable = false)
    @Builder.Default
    private Boolean spoilerFlag = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    public static short toX2(double score) {
        return (short) Math.round(score * 2);
    }

    public static double fromX2(short x2) {
        return x2 / 2.0;
    }
}

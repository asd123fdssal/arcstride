package com.arcstride.domain.title.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "title_stats")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TitleStats {

    @Id
    @Column(name = "title_id")
    private Long titleId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "title_id")
    private Title title;

    @Column(name = "avg_graphics_x2", precision = 6, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal avgGraphicsX2 = BigDecimal.ZERO;

    @Column(name = "avg_story_x2", precision = 6, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal avgStoryX2 = BigDecimal.ZERO;

    @Column(name = "avg_music_x2", precision = 6, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal avgMusicX2 = BigDecimal.ZERO;

    @Column(name = "avg_etc_x2", precision = 6, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal avgEtcX2 = BigDecimal.ZERO;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private Integer commentCount = 0;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public double avgGraphics() { return avgGraphicsX2.doubleValue() / 2.0; }
    public double avgStory() { return avgStoryX2.doubleValue() / 2.0; }
    public double avgMusic() { return avgMusicX2.doubleValue() / 2.0; }
    public double avgEtc() { return avgEtcX2.doubleValue() / 2.0; }
}

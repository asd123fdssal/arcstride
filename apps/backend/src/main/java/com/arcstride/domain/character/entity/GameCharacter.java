package com.arcstride.domain.character.entity;

import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "characters")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class GameCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "character_id")
    private Long characterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "title_id", nullable = false)
    private Title title;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "korean_name")
    private String koreanName;

    @Column(name = "normalized_original_name")
    private String normalizedOriginalName;

    @Column(name = "normalized_korean_name")
    private String normalizedKoreanName;

    @Column(name = "character_image_url")
    private String characterImageUrl;

    @Column(name = "is_explicit", nullable = false)
    @Builder.Default
    private Boolean isExplicit = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContentStatus status = ContentStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

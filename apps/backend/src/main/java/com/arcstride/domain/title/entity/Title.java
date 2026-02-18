package com.arcstride.domain.title.entity;

import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.common.enums.Enums.ContentStatus;
import com.arcstride.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "titles")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Title {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "title_id")
    private Long titleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TitleType type;

    @Column(name = "original_title", nullable = false)
    private String originalTitle;

    @Column(name = "korean_title")
    private String koreanTitle;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "cover_url")
    private String coverUrl;

    @Column(columnDefinition = "TEXT")
    private String summary;

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

    @OneToMany(mappedBy = "title", fetch = FetchType.LAZY)
    @Builder.Default
    private List<TitleAlias> aliases = new ArrayList<>();

    @OneToOne(mappedBy = "title", fetch = FetchType.LAZY)
    private TitleStats stats;
}

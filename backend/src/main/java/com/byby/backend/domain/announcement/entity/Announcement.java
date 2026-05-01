package com.byby.backend.domain.announcement.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.common.enums.AnnouncementCategory;
import com.byby.backend.domain.center.entity.Center;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "center_announcement")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Announcement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "center_id", nullable = false)
    private Center center;

    @Column(nullable = false)
    private UUID authorAuthUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AnnouncementCategory category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String linkUrl;

    @Column(nullable = false)
    private boolean pinned;

    @Builder
    public Announcement(Center center, UUID authorAuthUserId, AnnouncementCategory category,
                        String title, String content, String linkUrl, boolean pinned) {
        this.center = center;
        this.authorAuthUserId = authorAuthUserId;
        this.category = category;
        this.title = title;
        this.content = content;
        this.linkUrl = linkUrl;
        this.pinned = pinned;
    }

    public void update(AnnouncementCategory category, String title, String content, String linkUrl, boolean pinned) {
        this.category = category;
        this.title = title;
        this.content = content;
        this.linkUrl = linkUrl;
        this.pinned = pinned;
    }
}

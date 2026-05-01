package com.byby.backend.domain.announcement.dto;

import com.byby.backend.common.enums.AnnouncementCategory;
import com.byby.backend.domain.announcement.entity.Announcement;

import java.time.LocalDateTime;
import java.util.UUID;

public class AnnouncementResponse {

    public record Summary(
            UUID id,
            UUID centerId,
            String centerName,
            UUID authorAuthUserId,
            AnnouncementCategory category,
            String title,
            String content,
            String linkUrl,
            boolean pinned,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static Summary from(Announcement announcement) {
            return new Summary(
                    announcement.getId(),
                    announcement.getCenter().getId(),
                    announcement.getCenter().getName(),
                    announcement.getAuthorAuthUserId(),
                    announcement.getCategory(),
                    announcement.getTitle(),
                    announcement.getContent(),
                    announcement.getLinkUrl(),
                    announcement.isPinned(),
                    announcement.getCreatedAt(),
                    announcement.getUpdatedAt()
            );
        }
    }
}

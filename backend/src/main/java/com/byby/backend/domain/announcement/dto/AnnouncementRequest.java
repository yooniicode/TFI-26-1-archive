package com.byby.backend.domain.announcement.dto;

import com.byby.backend.common.enums.AnnouncementCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AnnouncementRequest {

    public record Upsert(
            @NotNull AnnouncementCategory category,
            @NotBlank @Size(max = 120) String title,
            @NotBlank String content,
            @Size(max = 500) String linkUrl,
            boolean pinned
    ) {}
}

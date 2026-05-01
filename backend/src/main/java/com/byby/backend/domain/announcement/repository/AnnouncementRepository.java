package com.byby.backend.domain.announcement.repository;

import com.byby.backend.domain.announcement.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    Page<Announcement> findByCenter_IdOrderByPinnedDescCreatedAtDesc(UUID centerId, Pageable pageable);

    Page<Announcement> findByCenter_IdInOrderByPinnedDescCreatedAtDesc(List<UUID> centerIds, Pageable pageable);
}

package com.byby.backend.domain.admin.repository;

import com.byby.backend.domain.admin.entity.AdminWorkLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.UUID;

public interface AdminWorkLogRepository extends JpaRepository<AdminWorkLog, UUID> {
    Page<AdminWorkLog> findByAuthUserIdAndWorkDateBetweenOrderByWorkDateDescCreatedAtDesc(
            UUID authUserId, LocalDate from, LocalDate to, Pageable pageable);
}

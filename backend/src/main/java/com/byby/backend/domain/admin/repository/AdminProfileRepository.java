package com.byby.backend.domain.admin.repository;

import com.byby.backend.domain.admin.entity.AdminProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdminProfileRepository extends JpaRepository<AdminProfile, UUID> {
    Optional<AdminProfile> findByAuthUserId(UUID authUserId);
}

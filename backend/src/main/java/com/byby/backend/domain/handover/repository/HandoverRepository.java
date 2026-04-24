package com.byby.backend.domain.handover.repository;

import com.byby.backend.domain.handover.entity.Handover;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HandoverRepository extends JpaRepository<Handover, UUID> {

    Page<Handover> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
}

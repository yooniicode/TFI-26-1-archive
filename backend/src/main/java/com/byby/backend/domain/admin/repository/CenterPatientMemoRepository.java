package com.byby.backend.domain.admin.repository;

import com.byby.backend.domain.admin.entity.CenterPatientMemo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CenterPatientMemoRepository extends JpaRepository<CenterPatientMemo, UUID> {
    Page<CenterPatientMemo> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
    Page<CenterPatientMemo> findByPatientIdAndInterpreterVisibleTrueOrderByCreatedAtDesc(UUID patientId, Pageable pageable);
}

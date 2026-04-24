package com.byby.backend.domain.matching.repository;

import com.byby.backend.domain.matching.entity.PatientMatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientMatchRepository extends JpaRepository<PatientMatch, UUID> {

    Optional<PatientMatch> findByPatientIdAndActiveTrue(UUID patientId);

    Page<PatientMatch> findByActiveTrue(Pageable pageable);

    Page<PatientMatch> findByInterpreterIdAndActiveTrue(UUID interpreterId, Pageable pageable);

    boolean existsByPatientIdAndActiveTrue(UUID patientId);

    boolean existsByPatientIdAndInterpreterIdAndActiveTrue(UUID patientId, UUID interpreterId);
}

package com.byby.backend.domain.patient.repository;

import com.byby.backend.domain.patient.entity.PatientCenter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientCenterRepository extends JpaRepository<PatientCenter, UUID> {

    boolean existsByPatientIdAndCenterId(UUID patientId, UUID centerId);

    Optional<PatientCenter> findByPatientIdAndCenterId(UUID patientId, UUID centerId);
}

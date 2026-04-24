package com.byby.backend.domain.patient.repository;

import com.byby.backend.domain.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByAuthUserId(UUID authUserId);
    boolean existsByAuthUserId(UUID authUserId);

    @Query("""
            SELECT p FROM Patient p
            WHERE p.id IN (
                SELECT pm.patient.id FROM PatientMatch pm
                WHERE pm.interpreter.id = :interpreterId AND pm.active = true
            )
            """)
    Page<Patient> findAssignedToInterpreter(@Param("interpreterId") UUID interpreterId, Pageable pageable);

    Page<Patient> findByNameContainingIgnoreCase(String name, Pageable pageable);
}

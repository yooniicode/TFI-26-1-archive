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
    Optional<Patient> findFirstByAuthUserIdIsNullAndNameIgnoreCaseAndPhone(String name, String phone);

    @Query("""
            SELECT p FROM Patient p
            WHERE p.id IN (
                SELECT pm.patient.id FROM PatientMatch pm
                WHERE pm.interpreter.id = :interpreterId AND pm.active = true
            )
            """)
    Page<Patient> findAssignedToInterpreter(@Param("interpreterId") UUID interpreterId, Pageable pageable);

    @Query("""
            SELECT p FROM Patient p
            WHERE :query IS NULL
               OR :query = ''
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(COALESCE(p.phone, '')) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(COALESCE(p.region, '')) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(COALESCE(p.workplaceName, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Patient> search(@Param("query") String query, Pageable pageable);

    @Query("""
            SELECT p FROM Patient p
            WHERE p.id IN (
                SELECT pm.patient.id FROM PatientMatch pm
                WHERE pm.interpreter.id = :interpreterId AND pm.active = true
            )
            AND (
                :query IS NULL
                OR :query = ''
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(COALESCE(p.phone, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(COALESCE(p.region, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(COALESCE(p.workplaceName, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            """)
    Page<Patient> searchAssignedToInterpreter(
            @Param("interpreterId") UUID interpreterId,
            @Param("query") String query,
            Pageable pageable);
}

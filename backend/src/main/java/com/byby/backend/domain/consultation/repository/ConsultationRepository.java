package com.byby.backend.domain.consultation.repository;

import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {

    Page<Consultation> findByInterpreter(Interpreter interpreter, Pageable pageable);

    Page<Consultation> findByPatient(Patient patient, Pageable pageable);

    @Query("""
            SELECT c FROM Consultation c
            WHERE c.interpreter.id = :interpreterId
            ORDER BY c.consultationDate DESC
            """)
    Page<Consultation> findByInterpreterId(@Param("interpreterId") UUID interpreterId, Pageable pageable);

    @Query("""
            SELECT c FROM Consultation c
            WHERE c.patient.id = :patientId
            ORDER BY c.consultationDate DESC
            """)
    Page<Consultation> findByPatientId(@Param("patientId") UUID patientId, Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
            FROM Consultation c
            WHERE c.patient.id = :patientId AND c.interpreter.id = :interpreterId
            """)
    boolean existsByPatientIdAndInterpreterId(@Param("patientId") UUID patientId, @Param("interpreterId") UUID interpreterId);
}

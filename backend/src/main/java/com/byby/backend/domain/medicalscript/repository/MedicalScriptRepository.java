package com.byby.backend.domain.medicalscript.repository;

import com.byby.backend.domain.medicalscript.entity.MedicalScript;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MedicalScriptRepository extends JpaRepository<MedicalScript, UUID> {

    Page<MedicalScript> findByPatientId(UUID patientId, Pageable pageable);
}

package com.byby.backend.domain.patient.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.matching.repository.PatientMatchRepository;
import com.byby.backend.domain.patient.dto.PatientRequest;
import com.byby.backend.domain.patient.dto.PatientResponse;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;
    private final PatientMatchRepository patientMatchRepository;

    @Transactional
    public PatientResponse.Detail create(PatientRequest.Create req, UserPrincipal principal) {
        if (!principal.isAdmin() && !principal.isPatient()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        UUID authUserId = principal.isAdmin() ? req.authUserId() : principal.getAuthUserId();
        if (authUserId != null && patientRepository.existsByAuthUserId(authUserId)) {
            throw new BusinessException(BusinessErrorCode.PATIENT_ALREADY_EXISTS);
        }
        Patient patient = Patient.builder()
                .authUserId(authUserId)
                .name(req.name())
                .nationality(req.nationality())
                .gender(req.gender())
                .visaType(req.visaType())
                .visaNote(req.visaNote())
                .birthDate(req.birthDate())
                .phone(req.phone())
                .region(req.region())
                .workplaceName(req.workplaceName())
                .build();
        return PatientResponse.Detail.from(patientRepository.save(patient));
    }

    public Page<PatientResponse.Summary> getAll(String query, Pageable pageable, UserPrincipal principal) {
        if (principal.isAdmin()) {
            return patientRepository.search(query, pageable).map(PatientResponse.Summary::from);
        }
        if (principal.isInterpreter()) {
            Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            return patientRepository.searchAssignedToInterpreter(interpreter.getId(), query, pageable)
                    .map(PatientResponse.Summary::from);
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    public PatientResponse.Detail getById(UUID id, UserPrincipal principal) {
        Patient patient = findPatient(id);
        checkPatientAccess(patient, principal);
        return PatientResponse.Detail.from(patient);
    }

    @Transactional
    public PatientResponse.Detail update(UUID id, PatientRequest.Update req, UserPrincipal principal) {
        Patient patient = findPatient(id);
        if (!principal.isAdmin()) {
            if (!principal.isPatient() || !principal.getAuthUserId().equals(patient.getAuthUserId())) {
                throw new GeneralException(GeneralErrorCode.FORBIDDEN);
            }
        }
        patient.updateInfo(req.phone(), req.region(), req.workplaceName(),
                req.visaNote(), req.visaType());
        return PatientResponse.Detail.from(patient);
    }

    private Patient findPatient(UUID id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
    }

    private void checkPatientAccess(Patient patient, UserPrincipal principal) {
        if (principal.isAdmin()) return;
        if (principal.isPatient()) {
            if (!principal.getAuthUserId().equals(patient.getAuthUserId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
            return;
        }
        if (principal.isInterpreter()) {
            Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            if (!patientMatchRepository.existsByPatientIdAndInterpreterIdAndActiveTrue(
                    patient.getId(), interpreter.getId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_ASSIGNED);
            }
            return;
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }
}

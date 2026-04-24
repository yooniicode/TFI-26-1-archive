package com.byby.backend.domain.auth.service;

import com.byby.backend.common.enums.UserRole;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.Interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.auth.dto.AuthRequest;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;

    @Transactional
    public void registerProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);

        if (principal.getRole() == UserRole.PATIENT) {
            registerPatientProfile(req, principal);
            return;
        }
        if (principal.getRole() == UserRole.INTERPRETER) {
            registerInterpreterProfile(req, principal);
            return;
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    private void registerPatientProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (patientRepository.existsByAuthUserId(principal.getAuthUserId())) return;
        if (req.nationality() == null || req.gender() == null || req.visaType() == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "nationality, gender, visaType are required for patient");
        }

        Patient patient = Patient.builder()
                .authUserId(principal.getAuthUserId())
                .name(req.name())
                .nationality(req.nationality())
                .gender(req.gender())
                .visaType(req.visaType())
                .visaNote(req.visaNote())
                .phone(req.phone())
                .region(req.region())
                .workplaceName(req.workplaceName())
                .build();
        patientRepository.save(patient);
    }

    private void registerInterpreterProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (interpreterRepository.existsByAuthUserId(principal.getAuthUserId())) return;
        if (req.interpreterRole() == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "interpreterRole is required");
        }

        Interpreter interpreter = Interpreter.builder()
                .authUserId(principal.getAuthUserId())
                .name(req.name())
                .phone(req.phone())
                .role(req.interpreterRole())
                .build();
        interpreterRepository.save(interpreter);
    }
}

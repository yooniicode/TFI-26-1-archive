package com.byby.backend.domain.matching.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.Interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.matching.dto.MatchRequest;
import com.byby.backend.domain.matching.dto.MatchResponse;
import com.byby.backend.domain.matching.entity.PatientMatch;
import com.byby.backend.domain.matching.repository.PatientMatchRepository;
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
public class PatientMatchService {

    private final PatientMatchRepository patientMatchRepository;
    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;

    @Transactional
    public MatchResponse.Detail create(MatchRequest.Create req, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);

        // 기존 활성 매칭이 있으면 비활성화
        patientMatchRepository.findByPatientIdAndActiveTrue(req.patientId())
                .ifPresent(PatientMatch::deactivate);

        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
        Interpreter interpreter = interpreterRepository.findById(req.interpreterId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));

        PatientMatch match = PatientMatch.builder()
                .patient(patient)
                .interpreter(interpreter)
                .build();
        return MatchResponse.Detail.from(patientMatchRepository.save(match));
    }

    public Page<MatchResponse.Detail> getAll(Pageable pageable, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        return patientMatchRepository.findByActiveTrue(pageable).map(MatchResponse.Detail::from);
    }

    public MatchResponse.Detail getByPatient(UUID patientId, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        return patientMatchRepository.findByPatientIdAndActiveTrue(patientId)
                .map(MatchResponse.Detail::from)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.MATCH_NOT_FOUND));
    }

    @Transactional
    public void deactivate(UUID matchId, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        PatientMatch match = patientMatchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.MATCH_NOT_FOUND));
        match.deactivate();
    }

    public boolean isAssigned(UUID patientId, UUID interpreterId) {
        return patientMatchRepository.existsByPatientIdAndInterpreterIdAndActiveTrue(patientId, interpreterId);
    }
}

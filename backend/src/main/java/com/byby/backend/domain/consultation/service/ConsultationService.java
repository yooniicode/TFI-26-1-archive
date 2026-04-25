package com.byby.backend.domain.consultation.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.consultation.dto.ConsultationRequest;
import com.byby.backend.domain.consultation.dto.ConsultationResponse;
import com.byby.backend.domain.consultation.entity.Consultation;
import com.byby.backend.domain.consultation.repository.ConsultationRepository;
import com.byby.backend.domain.hospital.entity.Hospital;
import com.byby.backend.domain.hospital.repository.HospitalRepository;
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
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;
    private final HospitalRepository hospitalRepository;

    @Transactional
    public ConsultationResponse.Detail create(ConsultationRequest.Create req, UserPrincipal principal) {
        if (!principal.isInterpreter()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);

        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
        Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
        Hospital hospital = req.hospitalId() != null
                ? hospitalRepository.findById(req.hospitalId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.HOSPITAL_NOT_FOUND))
                : null;

        Consultation consultation = Consultation.builder()
                .consultationDate(req.consultationDate())
                .patient(patient)
                .interpreter(interpreter)
                .hospital(hospital)
                .department(req.department())
                .issueType(req.issueType())
                .method(req.method())
                .processing(req.processing())
                .memo(req.memo())
                .durationHours(req.durationHours())
                .fee(req.fee())
                .nextAppointmentDate(req.nextAppointmentDate())
                .build();
        return ConsultationResponse.Detail.from(consultationRepository.save(consultation));
    }

    public Page<ConsultationResponse.Summary> getAll(Pageable pageable, UserPrincipal principal) {
        if (principal.isAdmin()) {
            return consultationRepository.findAll(pageable).map(ConsultationResponse.Summary::from);
        }
        if (principal.isInterpreter()) {
            Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            return consultationRepository.findByInterpreter(interpreter, pageable)
                    .map(ConsultationResponse.Summary::from);
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    public ConsultationResponse.Detail getById(UUID id, UserPrincipal principal) {
        Consultation c = findConsultation(id);
        checkAccess(c, principal);
        return ConsultationResponse.Detail.from(c);
    }

    @Transactional
    public ConsultationResponse.Detail update(UUID id, ConsultationRequest.Update req, UserPrincipal principal) {
        Consultation c = findConsultation(id);
        if (!principal.isInterpreter()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        if (c.isConfirmed()) throw new BusinessException(BusinessErrorCode.CONSULTATION_ALREADY_CONFIRMED);

        Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
        if (!c.getInterpreter().getId().equals(interpreter.getId())) {
            throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
        }
        c.update(req.memo(), req.nextAppointmentDate(), req.department(),
                req.durationHours(), req.fee());
        return ConsultationResponse.Detail.from(c);
    }

    @Transactional
    public ConsultationResponse.Detail confirm(UUID id, ConsultationRequest.Confirm req, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        Consultation c = findConsultation(id);
        if (c.isConfirmed()) throw new BusinessException(BusinessErrorCode.CONSULTATION_ALREADY_CONFIRMED);
        c.confirm(req.confirmedBy(), req.confirmedByPhone());
        return ConsultationResponse.Detail.from(c);
    }

    public Page<ConsultationResponse.Summary> getByPatient(UUID patientId, Pageable pageable, UserPrincipal principal) {
        if (principal.isPatient()) {
            Patient p = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!p.getId().equals(patientId)) throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
        } else if (principal.isInterpreter()) {
            Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            boolean isAssigned = consultationRepository.existsByPatientIdAndInterpreterId(patientId, interpreter.getId());
            if (!isAssigned) throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_ASSIGNED);
        } else if (!principal.isAdmin()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        return consultationRepository.findByPatientId(patientId, pageable)
                .map(ConsultationResponse.Summary::from);
    }

    public Page<ConsultationResponse.Summary> getByInterpreter(UUID interpreterId, Pageable pageable, UserPrincipal principal) {
        if (principal.isAdmin()) {
            return consultationRepository.findByInterpreterId(interpreterId, pageable)
                    .map(ConsultationResponse.Summary::from);
        }
        if (principal.isInterpreter()) {
            Interpreter self = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            if (!self.getId().equals(interpreterId)) throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            return consultationRepository.findByInterpreterId(interpreterId, pageable)
                    .map(ConsultationResponse.Summary::from);
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    public Page<ConsultationResponse.PatientView> getPatientView(UUID patientId, Pageable pageable, UserPrincipal principal) {
        if (principal.isPatient()) {
            Patient p = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!p.getId().equals(patientId)) throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
        }
        return consultationRepository.findByPatientId(patientId, pageable)
                .map(ConsultationResponse.PatientView::from);
    }

    private Consultation findConsultation(UUID id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.CONSULTATION_NOT_FOUND));
    }

    private void checkAccess(Consultation c, UserPrincipal principal) {
        if (principal.isAdmin()) return;
        if (principal.isInterpreter()) {
            Interpreter interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
            if (!c.getInterpreter().getId().equals(interpreter.getId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
            return;
        }
        if (principal.isPatient()) {
            Patient patient = patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .orElseThrow(() -> new BusinessException(BusinessErrorCode.PATIENT_NOT_FOUND));
            if (!c.getPatient().getId().equals(patient.getId())) {
                throw new BusinessException(BusinessErrorCode.ACCESS_DENIED_NOT_OWNER);
            }
            return;
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }
}

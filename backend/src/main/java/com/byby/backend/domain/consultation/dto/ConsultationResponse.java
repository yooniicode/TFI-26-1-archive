package com.byby.backend.domain.consultation.dto;

import com.byby.backend.common.enums.ConsultationMethod;
import com.byby.backend.common.enums.IssueType;
import com.byby.backend.common.enums.ProcessingType;
import com.byby.backend.domain.consultation.entity.Consultation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ConsultationResponse {

    public record Summary(
            UUID id,
            LocalDate consultationDate,
            UUID patientId,
            String patientName,
            UUID interpreterId,
            String interpreterName,
            String hospitalName,
            IssueType issueType,
            boolean confirmed,
            LocalDateTime createdAt
    ) {
        public static Summary from(Consultation c) {
            return new Summary(
                    c.getId(), c.getConsultationDate(),
                    c.getPatient().getId(), c.getPatient().getName(),
                    c.getInterpreter() != null ? c.getInterpreter().getId() : null,
                    c.getInterpreter() != null ? c.getInterpreter().getName() : null,
                    c.getHospital() != null ? c.getHospital().getName() : null,
                    c.getIssueType(), c.isConfirmed(), c.getCreatedAt());
        }
    }

    public record Detail(
            UUID id,
            LocalDate consultationDate,
            UUID patientId,
            String patientName,
            UUID interpreterId,
            String interpreterName,
            UUID hospitalId,
            String hospitalName,
            String department,
            IssueType issueType,
            ConsultationMethod method,
            ProcessingType processing,
            String memo,
            BigDecimal durationHours,
            Integer fee,
            LocalDate nextAppointmentDate,
            LocalDate confirmedAt,
            String confirmedBy,
            String confirmedByPhone,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static Detail from(Consultation c) {
            return new Detail(
                    c.getId(), c.getConsultationDate(),
                    c.getPatient().getId(), c.getPatient().getName(),
                    c.getInterpreter() != null ? c.getInterpreter().getId() : null,
                    c.getInterpreter() != null ? c.getInterpreter().getName() : null,
                    c.getHospital() != null ? c.getHospital().getId() : null,
                    c.getHospital() != null ? c.getHospital().getName() : null,
                    c.getDepartment(), c.getIssueType(), c.getMethod(), c.getProcessing(),
                    c.getMemo(), c.getDurationHours(), c.getFee(), c.getNextAppointmentDate(),
                    c.getConfirmedAt(), c.getConfirmedBy(), c.getConfirmedByPhone(),
                    c.getCreatedAt(), c.getUpdatedAt());
        }
    }

    // 이주민용 간소화 뷰 — 운영 정보(통역비, 확인자 등) 제외
    public record PatientView(
            UUID id,
            LocalDate consultationDate,
            String hospitalName,
            String department,
            LocalDate nextAppointmentDate
    ) {
        public static PatientView from(Consultation c) {
            return new PatientView(
                    c.getId(), c.getConsultationDate(),
                    c.getHospital() != null ? c.getHospital().getName() : null,
                    c.getDepartment(), c.getNextAppointmentDate());
        }
    }
}

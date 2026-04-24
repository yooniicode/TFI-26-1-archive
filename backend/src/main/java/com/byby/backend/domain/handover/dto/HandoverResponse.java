package com.byby.backend.domain.handover.dto;

import com.byby.backend.domain.handover.entity.Handover;

import java.time.LocalDateTime;
import java.util.UUID;

public class HandoverResponse {

    public record Detail(
            UUID id,
            UUID patientId,
            String patientName,
            UUID fromInterpreterId,
            String fromInterpreterName,
            UUID toInterpreterId,
            String toInterpreterName,
            UUID consultationId,
            String reason,
            String notes,
            boolean assigned,
            LocalDateTime createdAt
    ) {
        public static Detail from(Handover h) {
            return new Detail(
                    h.getId(),
                    h.getPatient().getId(),
                    h.getPatient().getName(),
                    h.getFromInterpreter() != null ? h.getFromInterpreter().getId() : null,
                    h.getFromInterpreter() != null ? h.getFromInterpreter().getName() : null,
                    h.getToInterpreter() != null ? h.getToInterpreter().getId() : null,
                    h.getToInterpreter() != null ? h.getToInterpreter().getName() : null,
                    h.getConsultation() != null ? h.getConsultation().getId() : null,
                    h.getReason(),
                    h.getNotes(),
                    h.getToInterpreter() != null,
                    h.getCreatedAt()
            );
        }
    }
}

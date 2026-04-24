package com.byby.backend.domain.medicalscript.dto;

import com.byby.backend.common.enums.ScriptType;
import com.byby.backend.domain.medicalscript.entity.MedicalScript;

import java.time.LocalDateTime;
import java.util.UUID;

public class ScriptResponse {

    public record Detail(
            UUID id,
            UUID patientId,
            String patientName,
            UUID consultationId,
            ScriptType scriptType,
            String contentKo,
            String contentOrigin,
            LocalDateTime createdAt
    ) {
        public static Detail from(MedicalScript s) {
            return new Detail(
                    s.getId(),
                    s.getPatient().getId(),
                    s.getPatient().getName(),
                    s.getConsultation() != null ? s.getConsultation().getId() : null,
                    s.getScriptType(),
                    s.getContentKo(),
                    s.getContentOrigin(),
                    s.getCreatedAt());
        }
    }

    public record Summary(
            UUID id,
            ScriptType scriptType,
            String preview,
            LocalDateTime createdAt
    ) {
        public static Summary from(MedicalScript s) {
            String preview = s.getContentKo() != null && s.getContentKo().length() > 80
                    ? s.getContentKo().substring(0, 80) + "..." : s.getContentKo();
            return new Summary(s.getId(), s.getScriptType(), preview, s.getCreatedAt());
        }
    }
}

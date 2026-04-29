package com.byby.backend.domain.patient.dto;

import com.byby.backend.common.enums.Gender;
import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.VisaType;
import com.byby.backend.domain.patient.entity.Patient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PatientResponse {

    public record Summary(
            UUID id,
            String name,
            Nationality nationality,
            Gender gender,
            VisaType visaType,
            String region,
            boolean accountLinked,
            LocalDateTime createdAt
    ) {
        public static Summary from(Patient p) {
            return new Summary(p.getId(), p.getName(), p.getNationality(),
                    p.getGender(), p.getVisaType(), p.getRegion(),
                    p.getAuthUserId() != null, p.getCreatedAt());
        }
    }

    public record Detail(
            UUID id,
            String name,
            Nationality nationality,
            Gender gender,
            VisaType visaType,
            String visaNote,
            LocalDate birthDate,
            String phone,
            String region,
            String workplaceName,
            boolean accountLinked,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static Detail from(Patient p) {
            return new Detail(p.getId(), p.getName(), p.getNationality(), p.getGender(),
                    p.getVisaType(), p.getVisaNote(), p.getBirthDate(), p.getPhone(),
                    p.getRegion(), p.getWorkplaceName(), p.getAuthUserId() != null,
                    p.getCreatedAt(), p.getUpdatedAt());
        }
    }
}

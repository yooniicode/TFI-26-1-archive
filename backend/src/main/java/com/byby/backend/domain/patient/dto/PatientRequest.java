package com.byby.backend.domain.patient.dto;

import com.byby.backend.common.enums.Gender;
import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.VisaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class PatientRequest {

    public record Create(
            UUID authUserId,
            @NotBlank String name,
            @NotNull Nationality nationality,
            @NotNull Gender gender,
            @NotNull VisaType visaType,
            String visaNote,
            LocalDate birthDate,
            String phone,
            String region,
            String workplaceName
    ) {}

    public record Update(
            VisaType visaType,
            String visaNote,
            String phone,
            String region,
            String workplaceName
    ) {}
}

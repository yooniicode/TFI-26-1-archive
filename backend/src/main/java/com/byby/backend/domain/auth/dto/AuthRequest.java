package com.byby.backend.domain.auth.dto;

import com.byby.backend.common.enums.Gender;
import com.byby.backend.common.enums.InterpreterRole;
import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.VisaType;
import jakarta.validation.constraints.NotBlank;

public class AuthRequest {

    public record RegisterProfile(
            @NotBlank String name,
            Nationality nationality,
            Gender gender,
            VisaType visaType,
            String visaNote,
            String phone,
            String region,
            String workplaceName,
            InterpreterRole interpreterRole
    ) {}
}

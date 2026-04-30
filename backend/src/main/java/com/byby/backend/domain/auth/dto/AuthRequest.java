package com.byby.backend.domain.auth.dto;

import com.byby.backend.common.enums.Gender;
import com.byby.backend.common.enums.InterpreterRole;
import com.byby.backend.common.enums.Nationality;
import com.byby.backend.common.enums.UserRole;
import com.byby.backend.common.enums.VisaType;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class AuthRequest {

    public record RegisterProfile(
            @NotBlank String name,
            UserRole role,
            Nationality nationality,
            Gender gender,
            VisaType visaType,
            String visaNote,
            String phone,
            String region,
            InterpreterRole interpreterRole,
            UUID centerId,
            String centerName
    ) {}

    public record UpdateMemberRole(
            UserRole role,
            InterpreterRole interpreterRole,
            String name,
            String phone,
            UUID centerId,
            String centerName
    ) {}

    public record BootstrapAdmin(
            @NotBlank String secretCode,
            String centerName
    ) {}
}

package com.byby.backend.domain.auth.dto;

import com.byby.backend.common.enums.UserRole;

import java.util.UUID;

public class AuthResponse {

    public record Me(
            UUID authUserId,
            UserRole role,
            String name,
            UUID entityId  // interpreter.id 또는 patient.id
    ) {}
}

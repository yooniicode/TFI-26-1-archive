package com.byby.backend.domain.auth.dto;

import com.byby.backend.common.enums.InterpreterRole;
import com.byby.backend.common.enums.UserRole;

import java.util.UUID;

public class AuthResponse {

    public record Me(
            UUID authUserId,
            UserRole role,
            String name,
            UUID entityId
    ) {}

    public record Member(
            UUID authUserId,
            String email,
            String name,
            String phone,
            UserRole role,
            InterpreterRole interpreterRole,
            UUID interpreterId,
            boolean profileRegistered
    ) {}
}

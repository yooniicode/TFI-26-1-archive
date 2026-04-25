package com.byby.backend.domain.interpreter.dto;

import com.byby.backend.common.enums.InterpreterRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class InterpreterRequest {

    public record Create(
            @NotNull UUID authUserId,
            @NotBlank String name,
            String phone,
            @NotNull InterpreterRole role,
            List<String> languages
    ) {}

    public record Update(
            String phone,
            InterpreterRole role
    ) {}
}

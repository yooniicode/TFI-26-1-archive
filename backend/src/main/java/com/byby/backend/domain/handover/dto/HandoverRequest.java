package com.byby.backend.domain.handover.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class HandoverRequest {

    public record Create(
            @NotNull UUID patientId,
            UUID consultationId,
            @NotNull String reason,
            String notes
    ) {}

    public record Assign(
            @NotNull UUID toInterpreterId
    ) {}
}

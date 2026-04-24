package com.byby.backend.domain.matching.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class MatchRequest {

    public record Create(
            @NotNull UUID patientId,
            @NotNull UUID interpreterId
    ) {}
}

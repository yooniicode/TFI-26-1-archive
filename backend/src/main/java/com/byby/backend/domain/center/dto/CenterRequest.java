package com.byby.backend.domain.center.dto;

import jakarta.validation.constraints.NotBlank;

public class CenterRequest {

    public record Upsert(
            @NotBlank String name,
            String address,
            String phone,
            Boolean active
    ) {}
}

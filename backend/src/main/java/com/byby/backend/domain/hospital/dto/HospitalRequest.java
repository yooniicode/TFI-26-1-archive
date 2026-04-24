package com.byby.backend.domain.hospital.dto;

import jakarta.validation.constraints.NotBlank;

public class HospitalRequest {

    public record Create(
            @NotBlank String name,
            String address,
            String phone
    ) {}
}

package com.byby.backend.domain.hospital.dto;

import com.byby.backend.domain.hospital.entity.Hospital;

import java.util.UUID;

public class HospitalResponse {

    public record Summary(UUID id, String name, String address, String phone) {
        public static Summary from(Hospital h) {
            return new Summary(h.getId(), h.getName(), h.getAddress(), h.getPhone());
        }
    }
}

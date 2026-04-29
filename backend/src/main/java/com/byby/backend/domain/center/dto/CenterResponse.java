package com.byby.backend.domain.center.dto;

import com.byby.backend.domain.center.entity.Center;

import java.util.UUID;

public class CenterResponse {

    public record Summary(
            UUID id,
            String name,
            String address,
            String phone,
            boolean active
    ) {
        public static Summary from(Center center) {
            return new Summary(center.getId(), center.getName(), center.getAddress(),
                    center.getPhone(), center.isActive());
        }
    }
}

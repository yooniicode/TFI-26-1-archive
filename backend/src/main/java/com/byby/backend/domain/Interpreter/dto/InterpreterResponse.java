package com.byby.backend.domain.interpreter.dto;

import com.byby.backend.common.enums.InterpreterRole;
import com.byby.backend.domain.interpreter.entity.Interpreter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class InterpreterResponse {

    public record Summary(
            UUID id,
            String name,
            InterpreterRole role,
            UUID centerId,
            String centerName,
            List<String> languages,
            String availabilityNote,
            boolean active
    ) {
        public static Summary from(Interpreter i) {
            return new Summary(i.getId(), i.getName(), i.getRole(),
                    i.getCenter() != null ? i.getCenter().getId() : null,
                    i.getCenter() != null ? i.getCenter().getName() : null,
                    List.copyOf(i.getLanguages()), i.getAvailabilityNote(), i.isActive());
        }
    }

    public record Detail(
            UUID id,
            String name,
            String phone,
            InterpreterRole role,
            UUID centerId,
            String centerName,
            List<String> languages,
            String availabilityNote,
            boolean active,
            LocalDateTime createdAt
    ) {
        public static Detail from(Interpreter i) {
            return new Detail(i.getId(), i.getName(), i.getPhone(), i.getRole(),
                    i.getCenter() != null ? i.getCenter().getId() : null,
                    i.getCenter() != null ? i.getCenter().getName() : null,
                    List.copyOf(i.getLanguages()), i.getAvailabilityNote(), i.isActive(), i.getCreatedAt());
        }
    }
}

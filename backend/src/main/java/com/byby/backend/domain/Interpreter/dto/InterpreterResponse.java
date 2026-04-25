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
            List<String> languages,
            boolean active
    ) {
        public static Summary from(Interpreter i) {
            return new Summary(i.getId(), i.getName(), i.getRole(), i.getLanguages(), i.isActive());
        }
    }

    public record Detail(
            UUID id,
            String name,
            String phone,
            InterpreterRole role,
            List<String> languages,
            boolean active,
            LocalDateTime createdAt
    ) {
        public static Detail from(Interpreter i) {
            return new Detail(i.getId(), i.getName(), i.getPhone(), i.getRole(),
                    i.getLanguages(), i.isActive(), i.getCreatedAt());
        }
    }
}

package com.byby.backend.domain.medicalscript.dto;

import com.byby.backend.common.enums.ScriptType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ScriptRequest {

    public record Generate(
            @NotNull UUID patientId,
            UUID consultationId,    // null이면 최근 기록 자동 참조
            @NotNull ScriptType scriptType,
            String additionalContext // 추가 증상/상황 메모
    ) {}
}

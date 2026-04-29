package com.byby.backend.domain.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class AdminRequest {

    public record UpdateProfile(
            String centerName,
            String nickname
    ) {}

    public record WorkLogTask(
            @NotBlank String content,
            boolean checked
    ) {}

    public record UpsertWorkLog(
            @NotNull LocalDate workDate,
            String memo,
            @Valid List<WorkLogTask> tasks
    ) {}

    public record UpsertPatientMemo(
            String publicMemo,
            String privateMemo,
            boolean interpreterVisible
    ) {}
}

package com.byby.backend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class ChatRequest {

    public record SendMessage(
            @NotBlank @Size(max = 2000) String content
    ) {}

    public record CreateRoomWithInterpreter(
            UUID interpreterId
    ) {}

    public record CreateRoomWithPatient(
            UUID patientId
    ) {}
}

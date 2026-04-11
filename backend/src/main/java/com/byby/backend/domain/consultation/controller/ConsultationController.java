package com.byby.backend.domain.consultation.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping
    public ConsultationResponse create(@Valid @RequestBody ConsultationCreateRequest request) {
        return consultationService.create(request);
    }

    @GetMapping("/{id}")
    public ConsultationResponse getById(@PathVariable UUID id) {
        return consultationService.getById(id);
    }

    @GetMapping
    public Page<ConsultationResponse> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return consultationService.getAll(pageable);
    }

    @GetMapping("/patient/{patientId}")
    public Page<ConsultationResponse> getByPatient(
            @PathVariable UUID patientId,
            @PageableDefault(size = 20) Pageable pageable) {
        return consultationService.getByPatient(patientId, pageable);
    }

    @GetMapping("/interpreter/{interpreterId}")
    public Page<ConsultationResponse> getByInterpreter(
            @PathVariable UUID interpreterId,
            @PageableDefault(size = 20) Pageable pageable) {
        return consultationService.getByInterpreter(interpreterId, pageable);
    }

    @PatchMapping("/{id}/confirm")
    public ConsultationResponse confirm(
            @PathVariable UUID id,
            @RequestParam String confirmedBy,
            @RequestParam String confirmedByPhone) {
        return consultationService.confirm(id, confirmedBy, confirmedByPhone);
    }
}

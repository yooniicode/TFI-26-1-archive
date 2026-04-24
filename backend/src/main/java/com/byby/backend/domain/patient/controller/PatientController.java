package com.byby.backend.domain.patient.controller;

import com.byby.backend.common.response.Response;
import com.byby.backend.common.response.code.SuccessCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.consultation.dto.ConsultationResponse;
import com.byby.backend.domain.consultation.service.ConsultationService;
import com.byby.backend.domain.patient.dto.PatientRequest;
import com.byby.backend.domain.patient.dto.PatientResponse;
import com.byby.backend.domain.patient.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "이주민(Patient) API")
public class PatientController {

    private final PatientService patientService;
    private final ConsultationService consultationService;

    @PostMapping
    @Operation(summary = "이주민 생성")
    public ResponseEntity<Response<PatientResponse.Detail>> create(
            @Valid @RequestBody PatientRequest.Create req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(201)
                .body(Response.success(SuccessCode.CREATED, patientService.create(req, principal)));
    }

    @GetMapping
    @Operation(summary = "이주민 목록 조회")
    public ResponseEntity<Response<List<PatientResponse.Summary>>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Response.success(SuccessCode.OK, patientService.getAll(pageable, principal)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "이주민 상세 조회")
    public ResponseEntity<Response<PatientResponse.Detail>> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Response.success(SuccessCode.OK, patientService.getById(id, principal)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "이주민 정보 수정")
    public ResponseEntity<Response<PatientResponse.Detail>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PatientRequest.Update req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Response.success(SuccessCode.OK, patientService.update(id, req, principal)));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "이주민 상담 이력 조회")
    public ResponseEntity<Response<List<ConsultationResponse.Summary>>> getHistory(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Response.success(SuccessCode.OK, consultationService.getByPatient(id, pageable, principal)));
    }

    // 이주민 전용 간소화 뷰
    @GetMapping("/{id}/my-records")
    @Operation(summary = "이주민 본인용 기록 조회")
    public ResponseEntity<Response<List<ConsultationResponse.PatientView>>> getMyRecords(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Response.success(SuccessCode.OK,
                        consultationService.getPatientView(id, pageable, principal)));
    }
}

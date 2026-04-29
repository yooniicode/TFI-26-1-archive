package com.byby.backend.domain.auth.controller;

import com.byby.backend.common.response.Response;
import com.byby.backend.common.response.code.SuccessCode;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.auth.dto.AuthRequest;
import com.byby.backend.domain.auth.dto.AuthResponse;
import com.byby.backend.domain.auth.service.AuthService;
import com.byby.backend.domain.patient.repository.PatientRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증/내 정보 API")
public class AuthController {

    private final InterpreterRepository interpreterRepository;
    private final PatientRepository patientRepository;
    private final AuthService authService;

    @GetMapping("/me")
    @Operation(summary = "내 인증/역할 정보 조회")
    public ResponseEntity<Response<AuthResponse.Me>> me(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (principal.getRole() == com.byby.backend.common.enums.UserRole.admin) {
            return ResponseEntity.ok(Response.success(SuccessCode.OK,
                    new AuthResponse.Me(principal.getAuthUserId(), com.byby.backend.common.enums.UserRole.admin, "관리자", null)));
        }

        // JWT role에 맞는 테이블을 먼저 확인, 없으면 반대 테이블 fallback
        if (principal.getRole() == com.byby.backend.common.enums.UserRole.interpreter) {
            var interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId());
            if (interpreter.isPresent()) {
                var i = interpreter.get();
                return ResponseEntity.ok(Response.success(SuccessCode.OK,
                        new AuthResponse.Me(principal.getAuthUserId(), com.byby.backend.common.enums.UserRole.interpreter, i.getName(), i.getId())));
            }
            // Supabase 역할 동기화 지연 시 patient 테이블 확인
            var patient = patientRepository.findByAuthUserId(principal.getAuthUserId());
            if (patient.isPresent()) {
                var p = patient.get();
                return ResponseEntity.ok(Response.success(SuccessCode.OK,
                        new AuthResponse.Me(principal.getAuthUserId(), com.byby.backend.common.enums.UserRole.patient, p.getName(), p.getId())));
            }
        } else {
            var patient = patientRepository.findByAuthUserId(principal.getAuthUserId());
            if (patient.isPresent()) {
                var p = patient.get();
                return ResponseEntity.ok(Response.success(SuccessCode.OK,
                        new AuthResponse.Me(principal.getAuthUserId(), com.byby.backend.common.enums.UserRole.patient, p.getName(), p.getId())));
            }
            // Supabase 역할 동기화 지연 시 interpreter 테이블 확인
            var interpreter = interpreterRepository.findByAuthUserId(principal.getAuthUserId());
            if (interpreter.isPresent()) {
                var i = interpreter.get();
                return ResponseEntity.ok(Response.success(SuccessCode.OK,
                        new AuthResponse.Me(principal.getAuthUserId(), com.byby.backend.common.enums.UserRole.interpreter, i.getName(), i.getId())));
            }
        }

        // 프로필 미등록
        return ResponseEntity.ok(Response.success(SuccessCode.OK,
                new AuthResponse.Me(principal.getAuthUserId(), principal.getRole(), null, null)));
    }

    @PostMapping("/verify")
    @Operation(summary = "토큰 검증 (개발/디버깅)")
    public ResponseEntity<Response<AuthResponse.Me>> verify(
            @AuthenticationPrincipal UserPrincipal principal) {
        return me(principal);
    }

    @PostMapping("/register-profile")
    @Operation(summary = "내 role 기반 프로필 생성/보정", description = "PATIENT/INTERPRETER role에 맞춰 최초 프로필을 생성합니다. 이미 존재하면 무시됩니다.")
    public ResponseEntity<Response<Void>> registerProfile(
            @Valid @RequestBody AuthRequest.RegisterProfile req,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.registerProfile(req, principal);
        return ResponseEntity.status(201).body(Response.success(SuccessCode.CREATED));
    }

    @GetMapping("/members")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "비이주민 회원 목록 조회")
    public ResponseEntity<Response<List<AuthResponse.Member>>> getNonPatientMembers(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK, authService.getNonPatientMembers(principal)));
    }

    @PatchMapping("/members/{authUserId}/role")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "비이주민 회원 역할 변경")
    public ResponseEntity<Response<AuthResponse.Member>> updateMemberRole(
            @PathVariable UUID authUserId,
            @Valid @RequestBody AuthRequest.UpdateMemberRole req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK, authService.updateMemberRole(authUserId, req, principal)));
    }
}

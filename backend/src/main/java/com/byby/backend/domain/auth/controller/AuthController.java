package com.byby.backend.domain.auth.controller;

import com.byby.backend.common.response.Response;
import com.byby.backend.common.response.code.SuccessCode;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.Interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.auth.dto.AuthRequest;
import com.byby.backend.domain.auth.dto.AuthResponse;
import com.byby.backend.domain.auth.service.AuthService;
import com.byby.backend.domain.patient.repository.PatientRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
        String name = resolveName(principal);
        java.util.UUID entityId = resolveEntityId(principal);
        return ResponseEntity.ok(Response.success(SuccessCode.OK,
                new AuthResponse.Me(principal.getAuthUserId(), principal.getRole(), name, entityId)));
    }

    // Supabase JWT 검증 후 app_role 클레임 확인용 (개발/디버깅)
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

    private String resolveName(UserPrincipal principal) {
        return switch (principal.getRole()) {
            case INTERPRETER -> interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .map(i -> i.getName()).orElse(null);
            case PATIENT -> patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .map(p -> p.getName()).orElse(null);
            case ADMIN -> "관리자";
        };
    }

    private java.util.UUID resolveEntityId(UserPrincipal principal) {
        return switch (principal.getRole()) {
            case INTERPRETER -> interpreterRepository.findByAuthUserId(principal.getAuthUserId())
                    .map(i -> i.getId()).orElse(null);
            case PATIENT -> patientRepository.findByAuthUserId(principal.getAuthUserId())
                    .map(p -> p.getId()).orElse(null);
            case ADMIN -> null;
        };
    }
}

package com.byby.backend.domain.auth.service;

import com.byby.backend.common.enums.UserRole;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.auth.dto.AuthRequest;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${byby.supabase.url:}")
    private String supabaseUrl;

    @Value("${byby.supabase.service-key:}")
    private String supabaseServiceKey;

    @Transactional
    public void registerProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);

        UserRole effectiveRole = (req.role() != null
                && req.role() != UserRole.admin
                && principal.getRole() == UserRole.patient)
                ? req.role()
                : principal.getRole();

        if (effectiveRole == UserRole.patient) {
            registerPatientProfile(req, principal);
            updateSupabaseRole(principal, UserRole.patient);
            return;
        }
        if (effectiveRole == UserRole.interpreter) {
            registerInterpreterProfile(req, principal);
            updateSupabaseRole(principal, UserRole.interpreter);
            return;
        }
        throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    private void updateSupabaseRole(UserPrincipal principal, UserRole role) {
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) return;
        try {
            String body = objectMapper.writeValueAsString(
                    Map.of("app_metadata", Map.of("app_role", role.name())));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/auth/v1/admin/users/" + principal.getAuthUserId()))
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .header("Content-Type", "application/json")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.warn("Supabase role update failed [{}]: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("Failed to update Supabase user role: {}", e.getMessage());
        }
    }

    private void registerPatientProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (patientRepository.existsByAuthUserId(principal.getAuthUserId())) return;
        if (req.nationality() == null || req.gender() == null || req.visaType() == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "nationality, gender, visaType are required for patient");
        }

        Patient patient = Patient.builder()
                .authUserId(principal.getAuthUserId())
                .name(req.name())
                .nationality(req.nationality())
                .gender(req.gender())
                .visaType(req.visaType())
                .visaNote(req.visaNote())
                .phone(req.phone())
                .region(req.region())
                .workplaceName(req.workplaceName())
                .build();
        patientRepository.save(patient);
    }

    private void registerInterpreterProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (interpreterRepository.existsByAuthUserId(principal.getAuthUserId())) return;
        if (req.interpreterRole() == null) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "interpreterRole is required");
        }

        Interpreter interpreter = Interpreter.builder()
                .authUserId(principal.getAuthUserId())
                .name(req.name())
                .phone(req.phone())
                .role(req.interpreterRole())
                .build();
        interpreterRepository.save(interpreter);
    }
}

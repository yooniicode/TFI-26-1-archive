package com.byby.backend.domain.auth.service;

import com.byby.backend.common.enums.InterpreterRole;
import com.byby.backend.common.enums.UserRole;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.admin.entity.AdminProfile;
import com.byby.backend.domain.admin.service.AdminService;
import com.byby.backend.domain.auth.dto.AuthResponse;
import com.byby.backend.domain.interpreter.entity.Interpreter;
import com.byby.backend.domain.interpreter.repository.InterpreterRepository;
import com.byby.backend.domain.auth.dto.AuthRequest;
import com.byby.backend.domain.patient.entity.Patient;
import com.byby.backend.domain.patient.repository.PatientRepository;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final PatientRepository patientRepository;
    private final InterpreterRepository interpreterRepository;
    private final AdminService adminService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${byby.supabase.url:}")
    private String supabaseUrl;

    @Value("${byby.supabase.service-key:}")
    private String supabaseServiceKey;

    @Value("${byby.admin.bootstrap-code:}")
    private String adminBootstrapCode;

    @Transactional
    public void registerProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);

        UserRole effectiveRole = principal.getRole();

        if (effectiveRole == UserRole.patient) {
            if (req.role() != null && req.role() != UserRole.patient) {
                throw new GeneralException(GeneralErrorCode.FORBIDDEN, "센터 직원 승인 후 사용할 수 있는 계정입니다");
            }
            if (hasPendingMemberRequest(principal.getAuthUserId())) {
                throw new GeneralException(GeneralErrorCode.FORBIDDEN, "센터 직원 승인 후 사용할 수 있는 계정입니다");
            }
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
        updateSupabaseRole(principal.getAuthUserId(), role);
    }

    private void updateSupabaseRole(UUID authUserId, UserRole role) {
        tryUpdateSupabaseRole(authUserId, role);
    }

    private void updateSupabaseRoleOrThrow(UUID authUserId, UserRole role) {
        if (!tryUpdateSupabaseRole(authUserId, role)) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, "Supabase user role update failed");
        }
    }

    private boolean tryUpdateSupabaseRole(UUID authUserId, UserRole role) {
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) return false;
        try {
            String body = objectMapper.writeValueAsString(
                    Map.of("app_metadata", Map.of("app_role", role.name())));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/auth/v1/admin/users/" + authUserId))
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .header("Content-Type", "application/json")
                    .method("PUT", HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.warn("Supabase role update failed [{}]: {}", response.statusCode(), response.body());
                return false;
            }
            return true;
        } catch (Exception e) {
            log.warn("Failed to update Supabase user role: {}", e.getMessage());
            return false;
        }
    }

    public AuthResponse.Me bootstrapAdmin(AuthRequest.BootstrapAdmin req, UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (!StringUtils.hasText(adminBootstrapCode) || !constantTimeEquals(adminBootstrapCode, req.secretCode())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN, "관리자 초기 가입 코드가 올바르지 않습니다");
        }
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, "Supabase service key is required");
        }
        if (hasApprovedAdmin()) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN, "이미 센터 직원 계정이 있습니다");
        }

        updateSupabaseRoleOrThrow(principal.getAuthUserId(), UserRole.admin);
        AdminProfile profile = adminService.getOrCreateProfile(principal.getAuthUserId());
        String name = StringUtils.hasText(profile.getNickname()) ? profile.getNickname() : "관리자";
        return new AuthResponse.Me(principal.getAuthUserId(), UserRole.admin, name, null,
                profile.getCenterName(), profile.getNickname());
    }

    @Transactional
    public void syncApprovedInterpreterProfiles() {
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) return;

        try {
            Map<UUID, Interpreter> interpretersByAuthId = interpreterRepository.findAll().stream()
                    .collect(Collectors.toMap(Interpreter::getAuthUserId, Function.identity(), (a, b) -> a));

            for (JsonNode user : listSupabaseUsers()) {
                UUID authUserId = UUID.fromString(user.path("id").asText());
                Interpreter interpreter = interpretersByAuthId.get(authUserId);
                Optional<UserRole> approvedRole = parseUserRole(text(user.path("app_metadata"), "app_role"));
                if (approvedRole.filter(UserRole.interpreter::equals).isPresent()) {
                    ensureInterpreterProfile(authUserId, user, user.path("email").asText(null), interpreter);
                } else if (approvedRole.filter(UserRole.admin::equals).isPresent() && interpreter != null) {
                    interpreter.deactivate();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to sync approved interpreter profiles: {}", e.getMessage());
        }
    }

    @Transactional
    public List<AuthResponse.Member> getNonPatientMembers(UserPrincipal principal) {
        requireAdmin(principal);

        Map<UUID, Interpreter> interpretersByAuthId = interpreterRepository.findAll().stream()
                .collect(Collectors.toMap(Interpreter::getAuthUserId, Function.identity(), (a, b) -> a));

        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) {
            return interpretersByAuthId.values().stream()
                    .map(i -> toMember(null, null, i.getAuthUserId(), UserRole.interpreter, i))
                    .toList();
        }

        try {
            List<JsonNode> users = listSupabaseUsers();
            List<AuthResponse.Member> members = new ArrayList<>();
            Map<UUID, AuthResponse.Member> byId = new HashMap<>();
            for (JsonNode user : users) {
                UUID authUserId = UUID.fromString(user.path("id").asText());
                String email = user.path("email").asText(null);
                Interpreter interpreter = interpretersByAuthId.get(authUserId);
                UserRole role = resolveMemberRole(user, interpreter);
                Optional<UserRole> approvedRole = parseUserRole(text(user.path("app_metadata"), "app_role"));

                if (approvedRole.filter(UserRole.interpreter::equals).isPresent()) {
                    interpreter = ensureInterpreterProfile(authUserId, user, email, interpreter);
                    interpretersByAuthId.put(authUserId, interpreter);
                } else if (approvedRole.filter(UserRole.admin::equals).isPresent() && interpreter != null) {
                    interpreter.deactivate();
                }

                if (role == UserRole.patient) continue;
                AuthResponse.Member member = toMember(user, email, authUserId, role, interpreter);
                members.add(member);
                byId.put(authUserId, member);
            }
            interpretersByAuthId.values().stream()
                    .filter(i -> !byId.containsKey(i.getAuthUserId()))
                    .map(i -> toMember(null, null, i.getAuthUserId(), UserRole.interpreter, i))
                    .forEach(members::add);
            return members;
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @Transactional
    public AuthResponse.Member updateMemberRole(UUID authUserId, AuthRequest.UpdateMemberRole req, UserPrincipal principal) {
        requireAdmin(principal);
        if (req.role() == null || req.role() == UserRole.patient) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "Only non-patient roles can be managed here");
        }
        if (principal.getAuthUserId().equals(authUserId) && req.role() != UserRole.admin) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "You cannot remove your own center-staff role");
        }

        updateSupabaseRoleOrThrow(authUserId, req.role());

        Optional<Interpreter> interpreter = interpreterRepository.findByAuthUserId(authUserId);
        Interpreter saved = interpreter.orElse(null);
        if (req.role() == UserRole.interpreter) {
            InterpreterRole interpreterRole = req.interpreterRole() != null ? req.interpreterRole() : InterpreterRole.FREELANCER;
            saved = upsertInterpreterProfile(authUserId, trimToNull(req.name()), trimToNull(req.phone()), interpreterRole, saved);
        } else if (saved != null) {
            saved.updateAdminInfo(trimToNull(req.name()), trimToNull(req.phone()), InterpreterRole.STAFF);
            saved.deactivate();
        }

        return toMember(null, null, authUserId, req.role(), saved);
    }

    private void requireAdmin(UserPrincipal principal) {
        if (principal == null) throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
    }

    private boolean hasApprovedAdmin() {
        return listSupabaseUsers().stream()
                .map(user -> parseUserRole(text(user.path("app_metadata"), "app_role")))
                .anyMatch(role -> role.filter(UserRole.admin::equals).isPresent());
    }

    private List<JsonNode> listSupabaseUsers() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/auth/v1/admin/users?per_page=1000"))
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, "Supabase user list failed");
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode users = root.has("users") ? root.get("users") : root;
            List<JsonNode> result = new ArrayList<>();
            if (users.isArray()) users.forEach(result::add);
            return result;
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private Interpreter ensureInterpreterProfile(UUID authUserId, JsonNode user, String email, Interpreter interpreter) {
        JsonNode metadata = user.path("user_metadata");
        String name = text(metadata, "name");
        if (!StringUtils.hasText(name)) name = emailName(email);
        if (!StringUtils.hasText(name)) name = authUserId.toString();
        String phone = text(metadata, "phone");
        InterpreterRole role = resolveRequestedInterpreterRole(metadata).orElse(InterpreterRole.ACTIVIST);
        return upsertInterpreterProfile(authUserId, name, phone, role, interpreter);
    }

    private Interpreter upsertInterpreterProfile(UUID authUserId, String name, String phone,
                                                 InterpreterRole role, Interpreter existing) {
        if (existing == null) {
            if (!StringUtils.hasText(name)) {
                throw new GeneralException(GeneralErrorCode.BAD_REQUEST, "name is required when creating an interpreter profile");
            }
            return interpreterRepository.save(Interpreter.builder()
                    .authUserId(authUserId)
                    .name(name.trim())
                    .phone(trimToNull(phone))
                    .role(role)
                    .build());
        }
        existing.updateAdminInfo(trimToNull(name), trimToNull(phone), role);
        existing.activate();
        return existing;
    }

    private AuthResponse.Member toMember(JsonNode user, String email, UUID authUserId, UserRole role, Interpreter interpreter) {
        JsonNode metadata = user != null ? user.path("user_metadata") : objectMapper.createObjectNode();
        String name = interpreter != null ? interpreter.getName() : text(metadata, "name");
        String phone = interpreter != null ? interpreter.getPhone() : text(metadata, "phone");
        Optional<UserRole> approvedRole = user != null
                ? parseUserRole(text(user.path("app_metadata"), "app_role"))
                : Optional.empty();
        InterpreterRole interpreterRole = interpreter != null
                ? interpreter.getRole()
                : role == UserRole.interpreter
                    ? resolveRequestedInterpreterRole(metadata).orElse(null)
                    : null;
        boolean approved = approvedRole.map(r -> r == role).orElse(user == null || interpreter != null);
        boolean profileRegistered = role == UserRole.admin ? approved : interpreter != null;
        return new AuthResponse.Member(
                authUserId,
                email,
                name,
                phone,
                role,
                interpreterRole,
                interpreter != null ? interpreter.getId() : null,
                profileRegistered,
                approved
        );
    }

    private UserRole resolveMemberRole(JsonNode user, Interpreter interpreter) {
        Optional<UserRole> appRole = parseUserRole(text(user.path("app_metadata"), "app_role"));
        if (appRole.isPresent()) return appRole.get();

        Optional<UserRole> requestedRole = resolveRequestedMemberRole(user.path("user_metadata"));
        if (requestedRole.isPresent() && requestedRole.get() != UserRole.patient) {
            return requestedRole.get();
        }

        return interpreter != null ? UserRole.interpreter : UserRole.patient;
    }

    private boolean hasPendingMemberRequest(UUID authUserId) {
        return findSupabaseUser(authUserId)
                .flatMap(user -> {
                    Optional<UserRole> appRole = parseUserRole(text(user.path("app_metadata"), "app_role"));
                    if (appRole.isPresent()) return Optional.<UserRole>empty();
                    return resolveRequestedMemberRole(user.path("user_metadata"));
                })
                .filter(role -> role != UserRole.patient)
                .isPresent();
    }

    private Optional<JsonNode> findSupabaseUser(UUID authUserId) {
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseServiceKey)) {
            return Optional.empty();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/auth/v1/admin/users/" + authUserId))
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) return Optional.empty();
            if (response.statusCode() >= 300) {
                throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, "Supabase user lookup failed");
            }
            return Optional.of(objectMapper.readTree(response.body()));
        } catch (GeneralException e) {
            throw e;
        } catch (Exception e) {
            throw new GeneralException(GeneralErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private Optional<UserRole> resolveRequestedMemberRole(JsonNode metadata) {
        Optional<UserRole> requestedRole = parseUserRole(text(metadata, "requested_role"));
        if (requestedRole.isEmpty()) requestedRole = parseUserRole(text(metadata, "app_role"));
        if (requestedRole.isEmpty()) requestedRole = parseUserRole(text(metadata, "role"));
        if (requestedRole.isPresent()) return requestedRole;
        return resolveRequestedInterpreterRole(metadata).isPresent()
                ? Optional.of(UserRole.interpreter)
                : Optional.empty();
    }

    private Optional<InterpreterRole> resolveRequestedInterpreterRole(JsonNode metadata) {
        Optional<InterpreterRole> requestedRole = parseInterpreterRole(text(metadata, "requested_interpreter_role"));
        if (requestedRole.isEmpty()) requestedRole = parseInterpreterRole(text(metadata, "interpreter_role"));
        return requestedRole;
    }

    private Optional<UserRole> parseUserRole(String value) {
        if (!StringUtils.hasText(value)) return Optional.empty();
        try {
            return Optional.of(UserRole.valueOf(value.trim().toLowerCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Optional<InterpreterRole> parseInterpreterRole(String value) {
        if (!StringUtils.hasText(value)) return Optional.empty();
        try {
            return Optional.of(InterpreterRole.valueOf(value.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String emailName(String email) {
        if (!StringUtils.hasText(email)) return null;
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) return false;
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) return false;
        int result = 0;
        for (int i = 0; i < expectedBytes.length; i++) {
            result |= expectedBytes[i] ^ actualBytes[i];
        }
        return result == 0;
    }

    private void registerPatientProfile(AuthRequest.RegisterProfile req, UserPrincipal principal) {
        if (patientRepository.existsByAuthUserId(principal.getAuthUserId())) return;
        Optional<Patient> existingPatient = findClaimablePatient(req);
        if (existingPatient.isPresent()) {
            existingPatient.get().linkAuthUser(principal.getAuthUserId());
            return;
        }
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

    private Optional<Patient> findClaimablePatient(AuthRequest.RegisterProfile req) {
        if (!StringUtils.hasText(req.name()) || !StringUtils.hasText(req.phone())) {
            return Optional.empty();
        }
        return patientRepository.findFirstByAuthUserIdIsNullAndNameIgnoreCaseAndPhone(
                req.name().trim(), req.phone().trim());
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

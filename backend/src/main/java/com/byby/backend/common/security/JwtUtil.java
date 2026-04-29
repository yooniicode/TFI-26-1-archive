package com.byby.backend.common.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.byby.backend.common.enums.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.security.WeakKeyException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Component
public class JwtUtil {

    private static final Duration SUPABASE_AUTH_TIMEOUT = Duration.ofSeconds(5);

    private final SecretKey signingKey;
    private final List<SecretKey> verificationKeys;
    private final long expirationMs;
    private final String supabaseUrl;
    private final String supabaseApiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Autowired
    public JwtUtil(
            @Value("${byby.security.jwt.secret}") String secret,
            @Value("${byby.security.jwt.expiration-ms}") long expirationMs,
            @Value("${byby.supabase.url:}") String supabaseUrl,
            @Value("${byby.supabase.service-key:}") String supabaseServiceKey,
            @Value("${byby.supabase.anon-key:}") String supabaseAnonKey) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.verificationKeys = buildVerificationKeys(secret, signingKey);
        this.expirationMs = expirationMs;
        this.supabaseUrl = trimTrailingSlash(supabaseUrl);
        this.supabaseApiKey = StringUtils.hasText(supabaseAnonKey) ? supabaseAnonKey : supabaseServiceKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(SUPABASE_AUTH_TIMEOUT)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    JwtUtil(String secret, long expirationMs) {
        this(secret, expirationMs, "", "", "");
    }

    public String generate(UUID authUserId, UserRole role) {
        return Jwts.builder()
                .subject(authUserId.toString())
                .claim("app_role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Claims parse(String token) {
        SignatureException lastSignatureException = null;
        for (SecretKey verificationKey : verificationKeys) {
            try {
                return parse(token, verificationKey);
            } catch (SignatureException e) {
                lastSignatureException = e;
            }
        }
        throw lastSignatureException != null
                ? lastSignatureException
                : new JwtException("JWT verification failed");
    }

    private Claims parse(String token, SecretKey verificationKey) {
        return Jwts.parser()
                .verifyWith(verificationKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UserPrincipal toPrincipal(String token) {
        try {
            return toPrincipal(parse(token));
        } catch (JwtException | IllegalArgumentException e) {
            return toSupabasePrincipal(token, e);
        }
    }

    private UserPrincipal toPrincipal(Claims claims) {
        UUID authUserId = UUID.fromString(claims.getSubject());

        UserRole role = resolveRole(resolveRoleFromClaims(claims));
        return new UserPrincipal(authUserId, role);
    }

    public boolean isValid(String token) {
        try {
            toPrincipal(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private List<SecretKey> buildVerificationKeys(String secret, SecretKey primaryKey) {
        List<SecretKey> keys = new ArrayList<>();
        keys.add(primaryKey);

        try {
            keys.add(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret)));
        } catch (IllegalArgumentException | WeakKeyException | io.jsonwebtoken.io.DecodingException e) {
            log.debug("JWT secret is not usable as a Base64-decoded fallback key: {}", e.getMessage());
        }

        return List.copyOf(keys);
    }

    private UserPrincipal toSupabasePrincipal(String token, RuntimeException localVerificationFailure) {
        if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(supabaseApiKey)) {
            throw localVerificationFailure;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/auth/v1/user"))
                    .timeout(SUPABASE_AUTH_TIMEOUT)
                    .header("Authorization", "Bearer " + token)
                    .header("apikey", supabaseApiKey)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new JwtException("Supabase JWT verification failed with status " + response.statusCode(),
                        localVerificationFailure);
            }

            JsonNode user = objectMapper.readTree(response.body());
            String id = user.path("id").asText(null);
            if (!StringUtils.hasText(id)) {
                throw new JwtException("Supabase JWT verification response did not include a user id",
                        localVerificationFailure);
            }

            return new UserPrincipal(UUID.fromString(id), resolveRole(resolveRoleFromSupabaseUser(user)));
        } catch (IOException e) {
            throw new JwtException("Supabase JWT verification request failed", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new JwtException("Supabase JWT verification request interrupted", e);
        }
    }

    private String resolveRoleFromClaims(Claims claims) {
        String roleStr = claims.get("app_role", String.class);
        if (roleStr != null) return roleStr;

        // Supabase JWT: check app_metadata object
        Object appMeta = claims.get("app_metadata");
        if (appMeta instanceof java.util.Map<?, ?> map) {
            Object r = map.get("app_role");
            if (r != null) return r.toString();
        }

        return null;
    }

    private String resolveRoleFromSupabaseUser(JsonNode user) {
        String roleStr = text(user.path("app_metadata"), "app_role");
        if (roleStr != null) return roleStr;

        return null;
    }

    private UserRole resolveRole(String roleStr) {
        if (!StringUtils.hasText(roleStr)) return UserRole.patient;
        return UserRole.valueOf(roleStr.trim().toLowerCase(Locale.ROOT));
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}

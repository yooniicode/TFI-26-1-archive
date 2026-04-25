package com.byby.backend.common.security;

import com.byby.backend.common.enums.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${byby.security.jwt.secret}") String secret,
            @Value("${byby.security.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generate(UUID authUserId, UserRole role) {
        return Jwts.builder()
                .subject(authUserId.toString())
                .claim("app_role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UserPrincipal toPrincipal(String token) {
        Claims claims = parse(token);
        UUID authUserId = UUID.fromString(claims.getSubject());

        String roleStr = claims.get("app_role", String.class);
        if (roleStr == null) {
            // Supabase JWT: check app_metadata object
            Object appMeta = claims.get("app_metadata");
            if (appMeta instanceof java.util.Map<?, ?> map) {
                Object r = map.get("app_role");
                roleStr = r != null ? r.toString() : null;
            }
        }
        if (roleStr == null) {
            // Supabase signUp options.data -> user_metadata
            Object userMeta = claims.get("user_metadata");
            if (userMeta instanceof java.util.Map<?, ?> map) {
                Object appRole = map.get("app_role");
                Object role = map.get("role");
                if (appRole != null) roleStr = appRole.toString();
                else if (role != null) roleStr = role.toString();
            }
        }
        UserRole role = roleStr != null ? UserRole.valueOf(roleStr) : UserRole.patient;
        return new UserPrincipal(authUserId, role);
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }
}

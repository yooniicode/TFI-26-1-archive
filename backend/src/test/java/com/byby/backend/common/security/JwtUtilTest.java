package com.byby.backend.common.security;

import com.byby.backend.common.enums.UserRole;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private static final UUID AUTH_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String DECODED_SECRET = "12345678901234567890123456789012";
    private static final String BASE64_LOOKING_SECRET =
            Base64.getEncoder().encodeToString(DECODED_SECRET.getBytes(StandardCharsets.UTF_8));

    @Test
    void parsesTokenSignedWithRawSecretEvenWhenSecretLooksLikeBase64() {
        String token = Jwts.builder()
                .subject(AUTH_USER_ID.toString())
                .claim("user_metadata", Map.of("app_role", "interpreter"))
                .signWith(Keys.hmacShaKeyFor(BASE64_LOOKING_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        JwtUtil jwtUtil = new JwtUtil(BASE64_LOOKING_SECRET, 86_400_000);

        UserPrincipal principal = jwtUtil.toPrincipal(token);

        assertThat(principal.getAuthUserId()).isEqualTo(AUTH_USER_ID);
        assertThat(principal.getRole()).isEqualTo(UserRole.patient);
    }

    @Test
    void stillParsesTokenSignedWithBase64DecodedSecret() {
        String token = Jwts.builder()
                .subject(AUTH_USER_ID.toString())
                .claim("app_role", "patient")
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(BASE64_LOOKING_SECRET)))
                .compact();

        JwtUtil jwtUtil = new JwtUtil(BASE64_LOOKING_SECRET, 86_400_000);

        UserPrincipal principal = jwtUtil.toPrincipal(token);

        assertThat(principal.getAuthUserId()).isEqualTo(AUTH_USER_ID);
        assertThat(principal.getRole()).isEqualTo(UserRole.patient);
    }
}

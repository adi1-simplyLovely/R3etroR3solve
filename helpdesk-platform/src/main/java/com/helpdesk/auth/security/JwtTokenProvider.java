package com.helpdesk.auth.security;

import com.helpdesk.user.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for generating and validating JSON Web Tokens (JWT).
 */
@Component
public class JwtTokenProvider {

    @Value("${helpdesk.jwt.secret}")
    private String jwtSecret;

    @Value("${helpdesk.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Generates a JWT token for the authenticated user.
     * Embeds the user ID and role directly into the token claims.
     *
     * @param user The authenticated user
     * @return A signed JWT string
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("name", user.getFirstName() + " " + user.getLastName())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Helper method to generate the HMAC-SHA signing key from the secret string.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        io.jsonwebtoken.Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    /**
     * Returns the configured token expiration time in milliseconds.
     */
    public long getExpirationMs() {
        return jwtExpirationMs;
    }
}

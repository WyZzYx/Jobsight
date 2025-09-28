// src/main/java/ai/jobsight/auth/JwtUtil.java
package ai.jobsight.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {
    private final Key key;
    private final long ttlMillis;

    public JwtUtil(
            @Value("${auth.jwt.secret}") String secret,
            @Value("${auth.jwt.ttlMillis:1209600000}") long ttlMillis // 14 days
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.ttlMillis = ttlMillis;
    }

    public String create(Long userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(Date.from(now))
                .setExpiration(new Date(now.toEpochMilli() + ttlMillis))
                .addClaims(Map.of("email", email))
                .signWith(key).compact();
    }

    public Jws<Claims> parse(String jwt) {
        return Jwts.parser().verifyWith((SecretKey) key).build().parseSignedClaims(jwt);
    }
}

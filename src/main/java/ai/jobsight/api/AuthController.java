// src/main/java/ai/jobsight/auth/AuthController.java
package ai.jobsight.api;

import ai.jobsight.auth.JwtUtil;
import ai.jobsight.auth.User;
import ai.jobsight.auth.UserRepo;
import ai.jobsight.security.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepo users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public record Creds(String email, String password) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Creds c) {
        if (c.email()==null || c.password()==null || c.password().length()<6)
            return ResponseEntity.badRequest().body(Map.of("message","Invalid email or password too short"));
        if (users.findByEmail(c.email().trim().toLowerCase()).isPresent())
            return ResponseEntity.status(409).body(Map.of("message","Email already registered"));

        var u = users.save(User.builder()
                .email(c.email().trim().toLowerCase())
                .passwordHash(encoder.encode(c.password()))
                .createdAt(Instant.now()).build());

        var token = jwt.issue(u.getId(), u.getEmail());

        ResponseCookie cookie = ResponseCookie.from("jid", token)
                .httpOnly(true)
                .secure(false)           // true only behind HTTPS
                .sameSite("Lax")         // works through the proxy
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("ok", true));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Creds c) {
        var u = users.findByEmail(c.email().trim().toLowerCase()).orElse(null);
        if (u==null || !encoder.matches(c.password(), u.getPasswordHash()))
            return ResponseEntity.status(401).body(Map.of("message","Invalid credentials"));

        String token = jwt.issue(u.getId(), u.getEmail()); // <- your existing utility

        // set HttpOnly cookie (unchanged)
        ResponseCookie cookie = ResponseCookie.from("jid", token)
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                        "user", Map.of("id", u.getId(), "email", u.getEmail()),
                        "token", token // <---- IMPORTANT (extra for dev)
                ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth==null) return ResponseEntity.status(401).build();
        Long uid = (Long) auth.getPrincipal();
        var u = users.findById(uid).orElse(null);
        if (u==null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("id", u.getId(), "email", u.getEmail()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // if cookie-based JWT, set-expired cookie; if stateless, just 200
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
package org.projet.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.projet.user.entity.PasswordResetToken;
import org.projet.user.entity.User;
import org.projet.user.enums.UserRole;
import org.projet.user.repository.PasswordResetTokenRepository;
import org.projet.user.repository.UserRepository;
import org.projet.user.dto.AuthResponse;
import org.projet.user.dto.LoginRequest;
import org.projet.user.dto.RegisterRequest;
import org.projet.user.dto.UpdateProfileRequest;
import org.projet.user.security.JwtUtil;
import org.projet.user.service.RecaptchaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final int RESET_TOKEN_VALIDITY_MINUTES = 60;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final SecureRandom random = new SecureRandom();
    private final RecaptchaService recaptchaService;
    private static final String RESPONSE_ERROR = "error";

    @PostMapping("/register")
    public ResponseEntity<Object> register(@Valid @RequestBody RegisterRequest req) {
        recaptchaService.validateToken(req.getRecaptchaToken(), "register");
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of(RESPONSE_ERROR, "Email already in use"));
        }
        User user = new User();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(UserRole.CLIENT);
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request) {
        recaptchaService.validateToken(request.getRecaptchaToken(), "login");
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail());
        AuthResponse resp = new AuthResponse(token, user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Object> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(RESPONSE_ERROR, "Email is required"));
        }
        userRepository.findByEmail(email).ifPresent(u -> {
            resetTokenRepository.deleteByEmail(email);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random.generateSeed(32));
            resetTokenRepository.save(new PasswordResetToken(token, email, Instant.now().plusSeconds(RESET_TOKEN_VALIDITY_MINUTES * 60L)));
            // TODO: send email with link containing token (e.g. https://yourapp/auth/reset-password?token=...)
        });
        return ResponseEntity.ok(Map.of("message", "If an account exists for this email, you will receive a reset link."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Object> resetPassword(@RequestBody Map<String, String> body) {
        String token = body != null ? body.get("token") : null;
        String newPassword = body != null ? body.get("newPassword") : null;
        if (token == null || token.isBlank() || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(RESPONSE_ERROR, "Valid token and password (min 8 characters) are required"));
        }
        var reset = resetTokenRepository.findByToken(token);
        if (reset.isEmpty() || reset.get().isExpired()) {
            return ResponseEntity.badRequest().body(Map.of(RESPONSE_ERROR, "Invalid or expired reset link"));
        }
        PasswordResetToken r = reset.get();
        User user = userRepository.findByEmail(r.getEmail()).orElseThrow();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokenRepository.delete(r);
        return ResponseEntity.ok(Map.of("message", "Password updated. You can sign in now."));
    }

    @GetMapping("/me")
    public ResponseEntity<Object> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(u -> {
                    u.setPassword(null);
                    return ResponseEntity.ok((Object) u);
                })
                .orElse(ResponseEntity.status(404).build());
    }

    @PutMapping("/profile")
    public ResponseEntity<Object> updateProfile(@RequestBody UpdateProfileRequest req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (req.getFirstName() != null && !req.getFirstName().isBlank()) user.setFirstName(req.getFirstName().trim());
        if (req.getLastName() != null && !req.getLastName().isBlank()) user.setLastName(req.getLastName().trim());
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            if (!req.getEmail().equals(email) && userRepository.findByEmail(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(RESPONSE_ERROR, "Email already in use"));
            }
            user.setEmail(req.getEmail().trim());
        }
        if (req.getNewPassword() != null && req.getNewPassword().length() >= 8) {
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }
        user = userRepository.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}

package org.projet.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.projet.user.config.RecaptchaProperties;
import org.projet.user.dto.RecaptchaResponse;
import org.projet.user.exception.RecaptchaValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class RecaptchaServiceTest {

    @Mock
    private RestTemplate recaptchaRestTemplate;

    @Mock
    private RecaptchaProperties properties;

    private RecaptchaService recaptchaService;

    @BeforeEach
    void setUp() {
        recaptchaService = new RecaptchaService(recaptchaRestTemplate, properties);
    }

    @Test
    void testValidateToken_Disabled() {
        when(properties.isEnabled()).thenReturn(false);
        assertDoesNotThrow(() -> recaptchaService.validateToken("any-token", "login"));
    }

    @Test
    void testValidateToken_MissingToken() {
        when(properties.isEnabled()).thenReturn(true);
        assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken(null, "login"));
        assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken("", "login"));
    }

    @Test
    void testValidateToken_DevBypass() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");

        assertDoesNotThrow(() -> recaptchaService.validateToken("DEV_ONLY_BYPASS", "login"));
    }

    @Test
    void testValidateToken_SuccessfulValidation() {
        RecaptchaResponse googleResponse = new RecaptchaResponse();
        googleResponse.setSuccess(true);
        googleResponse.setScore(0.9);
        googleResponse.setAction("login");

        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");
        when(properties.getSecret()).thenReturn("test-secret");
        when(properties.getVerifyUrl()).thenReturn("https://www.google.com/recaptcha/api/siteverify");
        when(properties.getMinScore()).thenReturn(0.5);

        when(recaptchaRestTemplate.postForEntity(anyString(), any(), eq(RecaptchaResponse.class)))
                .thenReturn(ResponseEntity.ok(googleResponse));

        assertDoesNotThrow(() -> recaptchaService.validateToken("real-token", "login"));
    }

    @Test
    void testValidateToken_LowScore() {
        RecaptchaResponse googleResponse = new RecaptchaResponse();
        googleResponse.setSuccess(true);
        googleResponse.setScore(0.2);
        googleResponse.setAction("login");

        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");
        when(properties.getSecret()).thenReturn("test-secret");
        when(properties.getVerifyUrl()).thenReturn("https://www.google.com/recaptcha/api/siteverify");
        when(properties.getMinScore()).thenReturn(0.5);

        when(recaptchaRestTemplate.postForEntity(anyString(), any(), eq(RecaptchaResponse.class)))
                .thenReturn(ResponseEntity.ok(googleResponse));

        RecaptchaValidationException ex = assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken("low-score-token", "login"));
        assertTrue(ex.getMessage().contains("low score"));
    }

    @Test
    void testValidateToken_ActionMismatch() {
        RecaptchaResponse googleResponse = new RecaptchaResponse();
        googleResponse.setSuccess(true);
        googleResponse.setScore(0.9);
        googleResponse.setAction("register");

        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");
        when(properties.getSecret()).thenReturn("test-secret");
        when(properties.getVerifyUrl()).thenReturn("https://www.google.com/recaptcha/api/siteverify");
        when(properties.getMinScore()).thenReturn(0.5);

        when(recaptchaRestTemplate.postForEntity(anyString(), any(), eq(RecaptchaResponse.class)))
                .thenReturn(ResponseEntity.ok(googleResponse));

        RecaptchaValidationException ex = assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken("wrong-action-token", "login"));
        assertTrue(ex.getMessage().contains("action mismatch") || ex.getMessage().contains("Invalid reCAPTCHA action"));
    }

    @Test
    void testValidateToken_VerificationFailed() {
        RecaptchaResponse googleResponse = new RecaptchaResponse();
        googleResponse.setSuccess(false);

        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");
        when(properties.getSecret()).thenReturn("test-secret");
        when(properties.getVerifyUrl()).thenReturn("https://www.google.com/recaptcha/api/siteverify");

        when(recaptchaRestTemplate.postForEntity(anyString(), any(), eq(RecaptchaResponse.class)))
                .thenReturn(ResponseEntity.ok(googleResponse));

        RecaptchaValidationException ex = assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken("invalid-token", "login"));
        assertTrue(ex.getMessage().contains("verification failed"));
    }

    @Test
    void testValidateToken_NoSecretConfigured() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.getDevModeToken()).thenReturn("DEV_ONLY_BYPASS");
        when(properties.getSecret()).thenReturn(null);

        RecaptchaValidationException ex = assertThrows(RecaptchaValidationException.class,
                () -> recaptchaService.validateToken("any-token", "login"));
        assertTrue(ex.getMessage().contains("secret key is not configured"));
    }
}

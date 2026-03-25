package org.projet.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.projet.user.config.RecaptchaProperties;
import org.projet.user.dto.RecaptchaResponse;
import org.projet.user.exception.RecaptchaValidationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecaptchaService {

    private final RestTemplate recaptchaRestTemplate;
    private final RecaptchaProperties properties;

    public void validateToken(String token, String expectedAction) {
        if (!properties.isEnabled()) {
            log.info("reCAPTCHA validation disabled");
            return;
        }
        if (token == null || token.isBlank()) {
            throw new RecaptchaValidationException("Missing reCAPTCHA token");
        }
        if (isDevBypass(token)) {
            log.info("reCAPTCHA dev mode bypass activated for action: {}", expectedAction);
            return;
        }
        RecaptchaResponse response = executeVerification(token);
        if (!response.isSuccess()) {
            log.warn("reCAPTCHA verification failed: {}", response.getErrorCodes());
            throw new RecaptchaValidationException("reCAPTCHA verification failed");
        }
        log.info("reCAPTCHA success=true, score={}, action={}, expected={}",
                response.getScore(), response.getAction(), expectedAction);

        if (response.getScore() < properties.getMinScore()) {
            log.warn("reCAPTCHA score {} below threshold {}", response.getScore(), properties.getMinScore());
            throw new RecaptchaValidationException("Suspicious activity detected (low score: " + response.getScore() + ")");
        }

        if (expectedAction != null && !expectedAction.isBlank()) {
            String responseAction = response.getAction() == null ? "" : response.getAction().trim();
            String expected = expectedAction.trim();
            if (responseAction.isEmpty() || !responseAction.equalsIgnoreCase(expected)) {
                log.warn("reCAPTCHA action mismatch: got '{}', expected '{}'", responseAction, expected);
                throw new RecaptchaValidationException("Invalid reCAPTCHA action: got '" + responseAction + "', expected '" + expected + "'");
            }
        }
        log.info("reCAPTCHA validation passed for action: {}", expectedAction);
    }

    private RecaptchaResponse executeVerification(String token) {
        if (properties.getSecret() == null || properties.getSecret().isBlank()) {
            throw new RecaptchaValidationException("reCAPTCHA secret key is not configured");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", properties.getSecret());
        form.add("response", token);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            log.debug("Calling reCAPTCHA verify endpoint: {}", properties.getVerifyUrl());
            HttpEntity<MultiValueMap<String, String>> httpEntity = new HttpEntity<>(form, headers);
            ResponseEntity<RecaptchaResponse> response = recaptchaRestTemplate.postForEntity(
                    properties.getVerifyUrl(),
                    httpEntity,
                    RecaptchaResponse.class
            );
            RecaptchaResponse body = response.getBody();
            if (body == null) {
                log.error("Empty response body from reCAPTCHA service. Status: {}", response.getStatusCode());
                throw new RecaptchaValidationException("Empty response from reCAPTCHA service");
            }
            log.debug("reCAPTCHA response: success={}, score={}, action={}, errors={}",
                    body.isSuccess(), body.getScore(), body.getAction(), body.getErrorCodes());
            return body;
        } catch (RestClientException ex) {
            log.error("Failed to call reCAPTCHA verify endpoint: {}", ex.getMessage(), ex);
            throw new RecaptchaValidationException("Unable to verify reCAPTCHA token: " + ex.getMessage());
        }
    }

    private boolean isDevBypass(String token) {
        boolean isDevBypass = properties.getDevModeToken() != null && properties.getDevModeToken().equals(token);
        if (isDevBypass) {
            log.debug("Dev mode bypass token detected");
        }
        return isDevBypass;
    }
}

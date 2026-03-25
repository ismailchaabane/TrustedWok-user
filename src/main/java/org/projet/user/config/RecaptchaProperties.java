package org.projet.user.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "recaptcha")
public class RecaptchaProperties {

    private boolean enabled = true;
    private String secret;
    private String siteKey;
    private String verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    private double minScore = 0.8;
    private String devModeToken;
}

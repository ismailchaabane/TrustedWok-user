package org.projet.user.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(RecaptchaProperties.class)
public class RecaptchaConfig {

    @Bean
    public RestTemplate recaptchaRestTemplate() {
        return new RestTemplate();
    }
}
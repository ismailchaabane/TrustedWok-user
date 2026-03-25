package org.projet.user.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RecaptchaValidationException extends RuntimeException {

    public RecaptchaValidationException(String message) {
        super(message);
    }
}

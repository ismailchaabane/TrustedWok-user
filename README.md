# TrustedWok-user

## Google reCAPTCHA v3
- Configure the following properties (or environment variables) before starting the service:
  - `recaptcha.secret` / `RECAPTCHA_SECRET`
  - `recaptcha.site-key` / `RECAPTCHA_SITE_KEY`
  - Optional tuning: `recaptcha.min-score` and `recaptcha.dev-mode-token` (default `DEV_ONLY_BYPASS`).
- Frontend must execute reCAPTCHA v3 for actions `login` and `register` and send the token as `recaptchaToken`.
- During local development you can use the configured dev token instead of calling Google to bypass validation.
- Backend rejects authentication requests when verification fails or the score is below the configured threshold.

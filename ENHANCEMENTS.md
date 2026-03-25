# Security, UX & Feature Enhancements

Summary of what was implemented and how to use it.

---

## 1. Security

### reCAPTCHA (v2)
- **Login**: Optional reCAPTCHA shown after 3 failed attempts (or always if you set a site key). Token sent as `recaptchaToken` in login payload.
- **Register**: reCAPTCHA widget shown when a site key is configured. Token sent as `recaptchaToken` in register payload.
- **Setup**: Get keys from [Google reCAPTCHA](https://www.google.com/recaptcha/admin). In `src/environments/environment.ts` set `recaptchaSiteKey: 'your-site-key'`. Backend can optionally verify the token (add secret key and server-side call to `siteverify`).

### Password policy (register & reset)
- Minimum 8 characters, at least one lowercase, one uppercase, one number, one special character.
- Real-time strength bar (weak → strong) and requirement checklist on register and reset-password.

### Rate limiting (UX)
- Failed login attempts stored in `sessionStorage` (reset after ~15 min).
- After 3 failures, reCAPTCHA is required on login (when site key is set).
- Message shown: "Multiple failed attempts. Complete the captcha to continue."

---

## 2. UX

### Remember me
- Login form has a "Remember me" checkbox.
- **Checked**: JWT stored in `localStorage` (persists across tabs and browser restarts).
- **Unchecked**: JWT stored in `sessionStorage` (cleared when tab closes).
- Auto-login on reload works in both cases while the token is valid.

### Forgot / reset password
- **Forgot**: `/auth/forgot-password` – user enters email; backend creates a reset token (valid 60 min). Response: "If an account exists for this email, you will receive a reset link." (Email sending is TODO in backend – you can plug in your mailer and send a link like `https://yourapp/auth/reset-password?token=...`.)
- **Reset**: `/auth/reset-password?token=...` – user sets new password (same strength rules). On success, redirect to login.

### Notifications
- **NotificationService** (`shared/notification.service.ts`): `success()`, `error()`, `info()`, `warning()`.
- **Toast component**: Global toasts (top-right). Used after login, register, profile update, forgot-password, errors.

---

## 3. Features

### Role-based dashboard
- JWT decoded for `role` (USER / ADMIN). Dashboard shows:
  - **Profile** link and **Admin** badge when role is ADMIN.
  - Optional "Admin" section for ADMIN users.
- **Role guard**: `roleGuard(['ADMIN'])` – use in routes that must be admin-only, e.g. `canActivate: [authGuard, roleGuard(['ADMIN'])]`.

### Profile
- **Route**: `/dashboard/profile` (protected by AuthGuard).
- **Backend**: `GET /auth/me`, `PUT /auth/profile` (name, email, optional newPassword). Requires JWT.
- **Frontend**: Load profile, edit name/email/password (password optional). If email is changed, user is logged out and must sign in again with the new email.

### Auth routes
- `/auth/login` – Login (remember me, forgot link, optional reCAPTCHA).
- `/auth/register` – Register (password strength, optional reCAPTCHA).
- `/auth/forgot-password` – Request reset.
- `/auth/reset-password?token=...` – Set new password.

---

## 4. Backend changes (summary)

- **LoginRequest**: added optional `recaptchaToken`.
- **RegisterRequest**: new DTO (name, email, password, optional `recaptchaToken`); register uses it instead of `User` in body.
- **Forgot password**: `POST /auth/forgot-password` body `{ "email": "..." }`. Creates `PasswordResetToken` (entity + repo). Email sending is TODO.
- **Reset password**: `POST /auth/reset-password` body `{ "token": "...", "newPassword": "..." }`. Validates token, updates user password, deletes token.
- **Profile**: `GET /auth/me` (current user from JWT), `PUT /auth/profile` (UpdateProfileRequest: name, email, newPassword). Both require authentication.
- **Security**: Only `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` are public; `/auth/me` and `/auth/profile` require a valid JWT.

---

## 5. Suggested next steps

1. **reCAPTCHA**: Set `recaptchaSiteKey` in environment and (optionally) add server-side verification in Spring using the reCAPTCHA secret.
2. **Forgot password email**: In `AuthController.forgotPassword()`, after creating the token, send an email with link `https://your-frontend-url/auth/reset-password?token=...`.
3. **2FA**: Add optional 2FA step after login (e.g. TOTP or SMS via Twilio); backend issues a short-lived token or flag after password check, frontend shows 2FA form and then completes login.
4. **Activity logging**: Backend table for login/failed attempts/password changes; frontend "Recent activity" page calling a new endpoint.
5. **Admin routes**: Create admin-only routes and protect them with `roleGuard(['ADMIN'])`.

All new backend endpoints that require the user are protected by JWT; the existing **TokenInterceptor** and **AuthGuard** apply to dashboard and profile.

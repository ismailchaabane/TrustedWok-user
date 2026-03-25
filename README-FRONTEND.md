# Angular Frontend – Auth & Dashboard

Modular Angular app with JWT auth, lazy-loaded feature modules, and protected routes.

## Structure

```
src/app/
├── auth/
│   ├── login/           # LoginComponent
│   ├── register/        # RegisterComponent
│   ├── auth.service.ts   # Login, register, JWT storage, logout
│   ├── auth.guard.ts     # Protects /dashboard
│   ├── token.interceptor.ts  # Adds Bearer token, 401 → logout
│   ├── auth-routing.module.ts
│   └── auth.module.ts
├── dashboard/
│   ├── dashboard.component.*
│   ├── dashboard-routing.module.ts
│   └── dashboard.module.ts
├── app-routing.module.ts  # Lazy loads auth & dashboard, canActivate: authGuard
├── app.module.ts
└── app.component.*
```

## Run

1. **Backend** (from project root):  
   `cd backend && mvn spring-boot:run`  
   (runs on http://localhost:8080)

2. **Frontend**:  
   `cd frontend && npm install && npm start`  
   (runs on http://localhost:4200, proxies `/auth` to backend)

## Test flow

1. **Register**: Open http://localhost:4200/auth/register → name, email, password → Register → redirect to login.
2. **Login**: http://localhost:4200/auth/login → email + password → Sign in → redirect to dashboard.
3. **Dashboard**: Protected; shows email/role and Logout. Without login, visiting /dashboard redirects to /auth/login.
4. **Logout**: Click Logout → token cleared, redirect to /auth/login.
5. **JWT**: After login, check DevTools → Application → Local Storage for `jwt_token`. Requests to the backend should include `Authorization: Bearer <token>`.
6. **401**: If the backend returns 401, the interceptor clears auth and redirects to login.

## Optional improvements

- **Role-based guard**: Add `roleGuard` and use `canActivate: [authGuard, roleGuard]` for admin-only routes.
- **Token expiry**: Already handled in `AuthService.isLoggedIn()` (decode JWT and check `exp`).
- **User in UI**: Dashboard already shows `getDecodedUser()` (email + role).
- **Angular Material**: Run `ng add @angular/material` and import needed modules in Auth/Dashboard/Shared.

## API (backend)

- `POST /auth/register` – body: `{ name, email, password }`
- `POST /auth/login` – body: `{ email, password }` → `{ token, email, role }`

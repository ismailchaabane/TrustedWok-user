import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface RegisterUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  kycStatus?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_email';
const ROLE_KEY = 'user_role';
const REMEMBER_KEY = 'auth_remember';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private storage(): Storage {
    return this.isRememberMe() ? localStorage : sessionStorage;
  }

  private isRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_KEY) === 'true';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => this.storeAuth(res, !!credentials.rememberMe))
    );
  }

  register(user: RegisterUser): Observable<UserProfile | { error: string }> {
    return this.http.post<UserProfile | { error: string }>(`${this.apiUrl}/register`, user);
  }

  forgotPassword(email: string): Observable<{ message?: string; error?: string }> {
    return this.http.post<{ message?: string; error?: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message?: string; error?: string }> {
    return this.http.post<{ message?: string; error?: string }>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(data: { firstName?: string; lastName?: string; email?: string; newPassword?: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, data);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    if (this.isRememberMe()) return localStorage.getItem(TOKEN_KEY);
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp ? payload.exp * 1000 : 0;
      return exp > Date.now();
    } catch {
      return false;
    }
  }

  getStoredEmail(): string | null {
    return this.storage().getItem(USER_KEY);
  }

  getStoredRole(): string | null {
    return this.storage().getItem(ROLE_KEY);
  }

  getDecodedUser(): { email: string; role: string } | null {
    const email = this.getStoredEmail();
    const role = this.getStoredRole();
    if (!email) return null;
    return { email, role: role || 'USER' };
  }

  private storeAuth(res: AuthResponse, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, res.email);
      localStorage.setItem(ROLE_KEY, res.role);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(TOKEN_KEY, res.token);
      sessionStorage.setItem(USER_KEY, res.email);
      sessionStorage.setItem(ROLE_KEY, res.role);
    }
  }
}

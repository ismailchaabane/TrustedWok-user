import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotificationService } from '../../shared/notification.service';
import { RecaptchaV3Service } from '../recaptcha-v3.service';

const FAILED_ATTEMPTS_KEY = 'login_failed_attempts';
const FAILED_ATTEMPTS_RESET_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS_BEFORE_CAPTCHA = 3;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  loading = false;
  rememberMe = false;
  failedAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private recaptchaV3: RecaptchaV3Service
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.rememberMe = this.form.get('rememberMe')?.value ?? false;
    this.loadFailedAttempts();
  }

  private loadFailedAttempts(): void {
    try {
      const raw = sessionStorage.getItem(FAILED_ATTEMPTS_KEY);
      if (!raw) { this.failedAttempts = 0; return; }
      const { count, at } = JSON.parse(raw);
      if (Date.now() - at > FAILED_ATTEMPTS_RESET_MS) {
        sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
        this.failedAttempts = 0;
        return;
      }
      this.failedAttempts = count ?? 0;
    } catch {
      this.failedAttempts = 0;
    }
  }

  private recordFailedAttempt(): void {
    this.failedAttempts++;
    sessionStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count: this.failedAttempts, at: Date.now() }));
  }

  private clearFailedAttempts(): void {
    sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
    this.failedAttempts = 0;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    let recaptchaToken = '';
    try {
      recaptchaToken = await this.recaptchaV3.execute('login');
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'reCAPTCHA validation failed.';
      this.notification.error(this.errorMessage);
      return;
    }

    this.loading = true;
    const rememberMe = !!this.form.get('rememberMe')?.value;
    const payload = {
      email: this.form.value.email,
      password: this.form.value.password,
      rememberMe,
      recaptchaToken
    };
    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        this.clearFailedAttempts();
        this.notification.success('Signed in successfully.');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.recordFailedAttempt();
        const msg = err.error?.message || err.error?.error || 'Invalid email or password.';
        this.errorMessage = msg;
        this.notification.error(msg);
      }
    });
  }
}

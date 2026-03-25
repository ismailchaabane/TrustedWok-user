import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterUser } from '../auth.service';
import { NotificationService } from '../../shared/notification.service';
import { passwordStrength, strongPasswordValidator, PASSWORD_MIN_LENGTH } from '../../shared/validators/password.validators';
import { RecaptchaV3Service } from '../recaptcha-v3.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  phase: 1 | 2 = 1;
  errorMessage = '';
  loading = false;
  get strength(): 0 | 1 | 2 | 3 | 4 {
    const p = this.form?.get('password')?.value;
    return passwordStrength(p ?? '');
  }

  get hasLower(): boolean {
    const p = this.form?.get('password')?.value;
    return !!(p && /[a-z]/.test(p));
  }

  get hasUpper(): boolean {
    const p = this.form?.get('password')?.value;
    return !!(p && /[A-Z]/.test(p));
  }

  get hasDigit(): boolean {
    const p = this.form?.get('password')?.value;
    return !!(p && /\d/.test(p));
  }

  get hasSpecial(): boolean {
    const p = this.form?.get('password')?.value;
    return !!(p && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p));
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService,
    private recaptchaV3: RecaptchaV3Service
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\s()\-]{8,20}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), strongPasswordValidator()]]
    });
  }

  ngOnInit(): void {}

  goToPhase2(): void {
    this.errorMessage = '';
    const firstName = this.form.get('firstName');
    const lastName = this.form.get('lastName');
    const phoneNumber = this.form.get('phoneNumber');
    firstName?.markAsTouched();
    lastName?.markAsTouched();
    phoneNumber?.markAsTouched();
    if (firstName?.invalid || lastName?.invalid || phoneNumber?.invalid) return;
    this.phase = 2;
  }

  backToPhase1(): void {
    this.errorMessage = '';
    this.phase = 1;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    if (this.phase === 1) {
      this.goToPhase2();
      return;
    }

    this.form.get('email')?.markAsTouched();
    this.form.get('password')?.markAsTouched();
    if (this.form.get('email')?.invalid || this.form.get('password')?.invalid) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let recaptchaToken = '';
    try {
      recaptchaToken = await this.recaptchaV3.execute('register');
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'reCAPTCHA validation failed.';
      this.notification.error(this.errorMessage);
      return;
    }

    this.loading = true;
    const user: RegisterUser = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      password: this.form.value.password,
      recaptchaToken
    };
    this.auth.register(user).subscribe({
      next: (res) => {
        if ('error' in res) {
          this.errorMessage = res.error;
          this.loading = false;
          this.notification.error(res.error);
          return;
        }
        this.notification.success('Account created. Please sign in.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Registration failed.';
        this.notification.error(this.errorMessage);
      }
    });
  }
}

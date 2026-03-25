import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotificationService } from '../../shared/notification.service';
import { strongPasswordValidator, PASSWORD_MIN_LENGTH } from '../../shared/validators/password.validators';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = '';
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? '';
    if (!this.token) {
      this.errorMessage = 'Missing reset token. Use the link from your email.';
    }
    this.form.get('newPassword')?.valueChanges?.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
    this.form.get('confirmPassword')?.setValidators([
      Validators.required,
      (c) => (c.value && c.value !== this.form?.get('newPassword')?.value) ? { mismatch: true } : null
    ]);
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.token) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success(res.message ?? 'Password updated. You can sign in now.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error ?? 'Reset failed. Link may be invalid or expired.';
        this.notification.error(this.errorMessage);
      }
    });
  }
}

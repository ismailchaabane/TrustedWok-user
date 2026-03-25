import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../shared/notification.service';
import { strongPasswordValidator, PASSWORD_MIN_LENGTH } from '../../shared/validators/password.validators';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      newPassword: [''] // optional; if set, validated in onSubmit
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.loading = false;
        this.form.patchValue({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email
        });
      },
      error: () => {
        this.loading = false;
        this.notification.error('Failed to load profile.');
      }
    });
  }

  onSubmit(): void {
    const v = this.form.value;
    if (v.newPassword && v.newPassword.length > 0 && v.newPassword.length < PASSWORD_MIN_LENGTH) {
      this.form.get('newPassword')?.setErrors({ minlength: { requiredLength: PASSWORD_MIN_LENGTH } });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: { firstName?: string; lastName?: string; email?: string; newPassword?: string } = {
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email
    };
    if (v.newPassword && v.newPassword.length >= PASSWORD_MIN_LENGTH) {
      const strongErr = strongPasswordValidator()(this.form.get('newPassword')!);
      if (strongErr) {
        this.form.get('newPassword')?.setErrors(strongErr);
        this.form.markAllAsTouched();
        return;
      }
      payload.newPassword = v.newPassword;
    }
    this.saving = true;
    this.auth.updateProfile(payload).subscribe({
      next: (user) => {
        this.saving = false;
        if (this.auth.getStoredEmail() !== user.email) {
          this.auth.logout();
          return;
        }
        this.notification.success('Profile updated.');
        this.form.patchValue({ newPassword: '' });
      },
      error: (err) => {
        this.saving = false;
        this.notification.error(err.error?.error ?? 'Update failed.');
      }
    });
  }
}

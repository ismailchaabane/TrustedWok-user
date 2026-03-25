import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MIN_LENGTH = 8;
const PATTERNS = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  digit: /\d/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

export function passwordStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value || value.length < MIN_LENGTH) return 0;
  let score = 0;
  if (PATTERNS.lower.test(value)) score++;
  if (PATTERNS.upper.test(value)) score++;
  if (PATTERNS.digit.test(value)) score++;
  if (PATTERNS.special.test(value)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (!v) return null;
    if (typeof v !== 'string') return null;
    if (v.length < MIN_LENGTH) {
      return { minlength: { requiredLength: MIN_LENGTH, actualLength: v.length } };
    }
    if (!PATTERNS.lower.test(v)) return { passwordLower: true };
    if (!PATTERNS.upper.test(v)) return { passwordUpper: true };
    if (!PATTERNS.digit.test(v)) return { passwordDigit: true };
    if (!PATTERNS.special.test(v)) return { passwordSpecial: true };
    return null;
  };
}

export const PASSWORD_MIN_LENGTH = MIN_LENGTH;
export const PASSWORD_REQUIREMENTS = {
  minLength: MIN_LENGTH,
  lower: true,
  upper: true,
  digit: true,
  special: true
};

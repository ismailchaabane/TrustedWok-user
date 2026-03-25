import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class RecaptchaV3Service {
  private scriptLoadingPromise: Promise<void> | null = null;

  async execute(action: 'login' | 'register'): Promise<string> {
    const siteKey = environment.recaptchaSiteKey?.trim();
    if (!siteKey) {
      if (!environment.production && environment.recaptchaDevToken) {
        return environment.recaptchaDevToken;
      }
      throw new Error('reCAPTCHA is not configured.');
    }

    await this.ensureScriptLoaded(siteKey);
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) {
      throw new Error('reCAPTCHA failed to initialize.');
    }

    return await new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve).catch(() => {
          reject(new Error('Failed to execute reCAPTCHA.'));
        });
      });
    });
  }

  private ensureScriptLoaded(siteKey: string): Promise<void> {
    if (window.grecaptcha) {
      return Promise.resolve();
    }
    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById('recaptcha-v3-script') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'recaptcha-v3-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script.'));
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }
}
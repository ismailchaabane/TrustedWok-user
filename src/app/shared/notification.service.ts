import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private nextId = 1;
  private defaultDuration = 4000;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  getToastsSnapshot(): Toast[] {
    return this.toasts$.value;
  }

  success(message: string, duration?: number): void {
    this.push('success', message, duration);
  }

  error(message: string, duration?: number): void {
    this.push('error', message, duration ?? 6000);
  }

  info(message: string, duration?: number): void {
    this.push('info', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.push('warning', message, duration);
  }

  remove(id: number): void {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string, duration?: number): void {
    const id = this.nextId++;
    const d = duration ?? this.defaultDuration;
    const toast: Toast = { id, type, message, duration: d, createdAt: Date.now() };
    this.toasts$.next([...this.toasts$.value, toast]);
    if (d > 0) {
      setTimeout(() => this.remove(id), d);
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub?: Subscription;

  constructor(private notification: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notification.getToasts().subscribe((t) => (this.toasts = t));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  remove(id: number): void {
    this.notification.remove(id);
  }
}

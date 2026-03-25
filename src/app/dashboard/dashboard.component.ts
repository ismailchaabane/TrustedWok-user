import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  user$: { email: string; role: string } | null = null;

  constructor(public auth: AuthService) {
    this.user$ = this.auth.getDecodedUser();
  }

  logout(): void {
    this.auth.logout();
  }
}

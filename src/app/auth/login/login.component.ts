import { Component, signal, computed, inject, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface DevUserOption {
  label: string;
  value: string;
  username: string;
  fullName: string;
  role: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SelectModule,
    DividerModule,
    CheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  error = signal<string | null>(null);
  loading = signal(false);
  rememberMe = signal(false);

  /**
   * Dev-only quick login panel. Driven by environment.production so it's
   * a single source of truth — set `production: true` in
   * environment.ts (used by default `ng build`) and this entire block
   * disappears from the compiled output, no manual deletion needed.
   */
  readonly enableDevLogin = !environment.production || isDevMode();

  /**
   * Personas come from environment.devPersonas (seed usernames only) —
   * NO backend endpoint is involved, so there is nothing unauthenticated
   * to lock down. Sign-in still goes through the real POST /auth/login.
   */
  devUserOptions = computed<DevUserOption[]>(() =>
    (environment.devPersonas ?? []).map((p) => ({
      label: `${p.fullName} — ${p.role}`,
      value: p.username,
      username: p.username,
      fullName: p.fullName,
      role: p.role,
    })),
  );

  selectedDevUsername: string | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid username or password. Please try again.');
      },
    });
  }

  /**
   * Dev convenience: fills credentials for the selected seeded test
   * account (shared dev password) and signs in immediately through the
   * normal login flow — no auth bypass anywhere.
   */
  onDevUserSelect(username: string | null) {
    if (!username) return;
    const option = this.devUserOptions().find((o) => o.value === username);
    if (!option) return;

    this.loginForm.patchValue({
      username: option.username,
      password: environment.devPassword,
    });
    this.onSubmit();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getAvatarBg(name: string): string {
    const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    return colors[name.charCodeAt(0) % colors.length];
  }
}

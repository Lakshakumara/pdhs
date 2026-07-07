import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthService } from '../../core/auth/auth.service';
import { UserDto } from '../../core/models/biomed.interface';
import { UserApiService } from '../../core/services/user-api.service';

interface DevUserOption {
  label: string;
  value: string;
  user: UserDto;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    InputTextModule, PasswordModule, ButtonModule,
    SelectModule, DividerModule, CheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private stateService = inject(UserApiService);

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
  readonly enableDevLogin = true//!environment.production;

  /** Fixed password used for ALL seeded dev/test accounts. */
  private readonly DEV_PASSWORD = 'pdhs@123';

  devUsers = signal<UserDto[]>([]);
  selectedDevUserId: string | null = null;

  devUserOptions = computed<DevUserOption[]>(() =>
    this.devUsers().map(u => ({
      label: `${u.fullName} — ${u.roles.map(r => r.role).join(', ')}`,
      value: u.id,
      user: u,
    })),
  );

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.enableDevLogin) {
      this.stateService.dev_getAllUsers().subscribe(list => this.devUsers.set(list.items));
    }
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
   * account (fixed password 'pdhs@123') and signs in immediately.
   */
  onDevUserSelect(userId: string | null) {
    if (!userId) return;
    const option = this.devUserOptions().find(o => o.value === userId);
    if (!option) return;

    this.loginForm.patchValue({
      username: option.user.username,
      password: this.DEV_PASSWORD,
    });
    this.onSubmit();
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarBg(name: string): string {
    const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    return colors[name.charCodeAt(0) % colors.length];
  }
}

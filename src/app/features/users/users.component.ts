import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';

// ──────────────────────────────────────────────
// Types mirroring Prisma schema
// ──────────────────────────────────────────────

export enum RoleType {
  SUPER_ADMIN_PDHS = 'SUPER_ADMIN_PDHS',
  ADMIN_PDHS = 'ADMIN_PDHS',
  SUPER_ADMIN_RDHS = 'SUPER_ADMIN_RDHS',
  ADMIN_RDHS = 'ADMIN_RDHS',
  SUPER_ADMIN_INSTITUTE = 'SUPER_ADMIN_INSTITUTE',
  ADMIN_INSTITUTE = 'ADMIN_INSTITUTE',
  VIEWER_PDHS = 'VIEWER_PDHS',
  VIEWER_RDHS = 'VIEWER_RDHS',
  VIEWER_INSTITUTE = 'VIEWER_INSTITUTE',
  STORE_KEEPER = 'STORE_KEEPER',
  BIOMEDICAL_TECHNICIAN = 'BIOMEDICAL_TECHNICIAN',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  INSTITUTION_USER = 'INSTITUTION_USER',
}

export enum ScopeType {
  PDHS = 'PDHS',
  RDHS = 'RDHS',
  INSTITUTE = 'INSTITUTE',
}

export interface UserRole {
  id: string;
  role: RoleType;
  scopeType: ScopeType;
  scopeId: string | null;
  assignedAt: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  active: boolean;
  mustChangePassword: boolean;
  institutionId: string | null;
  institutionName?: string;
  districtId?: string | null;
  districtName?: string;
  createdAt: string;
  roles: UserRole[];
}

export interface District {
  id: string;
  name: string;
}

export interface Institution {
  id: string;
  name: string;
  districtId: string | null;
  type: string;
}

export interface CreateUserDto {
  username: string;
  fullName: string;
  email?: string;
  password: string;
  institutionId?: string;
  roles: { role: RoleType; scopeType: ScopeType; scopeId?: string }[];
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  active?: boolean;
  institutionId?: string;
  roles?: { role: RoleType; scopeType: ScopeType; scopeId?: string }[];
}

// ──────────────────────────────────────────────
// Role metadata helpers
// ──────────────────────────────────────────────

export const ROLE_SCOPE_MAP: Record<RoleType, ScopeType> = {
  [RoleType.SUPER_ADMIN_PDHS]: ScopeType.PDHS,
  [RoleType.ADMIN_PDHS]: ScopeType.PDHS,
  [RoleType.VIEWER_PDHS]: ScopeType.PDHS,
  [RoleType.SUPER_ADMIN_RDHS]: ScopeType.RDHS,
  [RoleType.ADMIN_RDHS]: ScopeType.RDHS,
  [RoleType.VIEWER_RDHS]: ScopeType.RDHS,
  [RoleType.SUPER_ADMIN_INSTITUTE]: ScopeType.INSTITUTE,
  [RoleType.ADMIN_INSTITUTE]: ScopeType.INSTITUTE,
  [RoleType.VIEWER_INSTITUTE]: ScopeType.INSTITUTE,
  [RoleType.STORE_KEEPER]: ScopeType.INSTITUTE,
  [RoleType.BIOMEDICAL_TECHNICIAN]: ScopeType.INSTITUTE,
  [RoleType.PROCUREMENT_OFFICER]: ScopeType.INSTITUTE,
  [RoleType.INSTITUTION_USER]: ScopeType.INSTITUTE,
};

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN_PDHS: 'danger',
  ADMIN_PDHS: 'warn',
  VIEWER_PDHS: 'info',
  SUPER_ADMIN_RDHS: 'danger',
  ADMIN_RDHS: 'warn',
  VIEWER_RDHS: 'info',
  SUPER_ADMIN_INSTITUTE: 'danger',
  ADMIN_INSTITUTE: 'warn',
  VIEWER_INSTITUTE: 'info',
  STORE_KEEPER: 'secondary',
  BIOMEDICAL_TECHNICIAN: 'secondary',
  PROCUREMENT_OFFICER: 'secondary',
  INSTITUTION_USER: 'secondary',
};

export const ROLE_OPTIONS = Object.values(RoleType).map(r => ({
  label: r.replace(/_/g, ' '),
  value: r,
  scope: ROLE_SCOPE_MAP[r],
}));

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    DividerModule,
    CheckboxModule,
    ToggleSwitchModule,
    MultiSelectModule,
    AvatarModule,
    BadgeModule,
    CardModule,
    ChipModule,
    SkeletonModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // ── State ──────────────────────────────────
  users = signal<User[]>([]);
  districts = signal<District[]>([]);
  institutions = signal<Institution[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  selectedUser = signal<User | null>(null);
  submitting = signal(false);

  // Role assignment panel
  roleRows = signal<{ role: RoleType | null; scopeType: ScopeType | null; scopeId: string | null }[]>([]);

  // ── Computed ───────────────────────────────
  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        u.roles.some(r => r.role.toLowerCase().includes(q))
    );
  });

  filteredInstitutions = computed(() => {
    const rows = this.roleRows();
    // For the user's main institution we just return all
    return this.institutions();
  });

  // ── Form ───────────────────────────────────
  form!: FormGroup;

  readonly roleOptions = ROLE_OPTIONS;
  readonly scopeOptions = [
    { label: 'PDHS (System-wide)', value: ScopeType.PDHS },
    { label: 'RDHS (District)', value: ScopeType.RDHS },
    { label: 'Institute', value: ScopeType.INSTITUTE },
  ];

  ngOnInit() {
    this.buildForm();
    this.loadData();
  }

  private buildForm() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9._-]+$/)]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.minLength(8)]],
      institutionId: [null],
      mustChangePassword: [true],
    });
  }

  private loadData() {
    this.loading.set(true);
    // Parallel load
    Promise.all([
      this.http.get<User[]>('/api/users').toPromise(),
      this.http.get<District[]>('/api/districts').toPromise(),
      this.http.get<Institution[]>('/api/institutions').toPromise(),
    ])
      .then(([users, districts, institutions]) => {
        this.users.set(users ?? []);
        this.districts.set(districts ?? []);
        this.institutions.set(institutions ?? []);
      })
      .catch(() => this.showError('Failed to load data'))
      .finally(() => this.loading.set(false));
  }

  // ── Stat getters (replaces pipes) ─────────
  get activeCount()      { return this.users().filter(u => u.active).length; }
  get inactiveCount()    { return this.users().filter(u => !u.active).length; }
  get pendingResetCount(){ return this.users().filter(u => u.mustChangePassword).length; }

  // ── CRUD ───────────────────────────────────

  openCreate() {
    this.dialogMode.set('create');
    this.selectedUser.set(null);
    this.form.reset({ mustChangePassword: true });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
    this.roleRows.set([{ role: null, scopeType: null, scopeId: null }]);
    this.dialogVisible.set(true);
  }

  openEdit(user: User) {
    this.dialogMode.set('edit');
    this.selectedUser.set(user);
    this.form.patchValue({
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? '',
      institutionId: user.institutionId,
      mustChangePassword: user.mustChangePassword,
      password: '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.roleRows.set(
      user.roles.map(r => ({ role: r.role, scopeType: r.scopeType, scopeId: r.scopeId }))
    );
    this.dialogVisible.set(true);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const validRoles = this.roleRows().filter(r => r.role !== null);
    if (validRoles.length === 0) {
      this.showError('At least one role must be assigned');
      return;
    }

    this.submitting.set(true);
    const v = this.form.value;

    if (this.dialogMode() === 'create') {
      const dto: CreateUserDto = {
        username: v.username,
        fullName: v.fullName,
        email: v.email || undefined,
        password: v.password,
        institutionId: v.institutionId || undefined,
        roles: validRoles.map(r => ({
          role: r.role!,
          scopeType: r.scopeType!,
          scopeId: r.scopeId || undefined,
        })),
      };
      this.http.post<User>('/api/users', dto).subscribe({
        next: user => {
          this.users.update(list => [user, ...list]);
          this.dialogVisible.set(false);
          this.showSuccess('User created successfully');
        },
        error: e => this.showError(e?.error?.message ?? 'Failed to create user'),
        complete: () => this.submitting.set(false),
      });
    } else {
      const dto: UpdateUserDto = {
        fullName: v.fullName,
        email: v.email || undefined,
        institutionId: v.institutionId || undefined,
        roles: validRoles.map(r => ({
          role: r.role!,
          scopeType: r.scopeType!,
          scopeId: r.scopeId || undefined,
        })),
      };
      if (v.password) (dto as any).password = v.password;
      const id = this.selectedUser()!.id;
      this.http.patch<User>(`/api/users/${id}`, dto).subscribe({
        next: updated => {
          this.users.update(list => list.map(u => (u.id === id ? updated : u)));
          this.dialogVisible.set(false);
          this.showSuccess('User updated successfully');
        },
        error: e => this.showError(e?.error?.message ?? 'Failed to update user'),
        complete: () => this.submitting.set(false),
      });
    }
  }

  toggleActive(user: User) {
    const newStatus = !user.active;
    this.http.patch<User>(`/api/users/${user.id}`, { active: newStatus }).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => (u.id === user.id ? updated : u)));
        this.showSuccess(`User ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: () => this.showError('Failed to update status'),
    });
  }

  confirmDelete(user: User) {
    this.confirmationService.confirm({
      message: `Delete user <strong>${user.fullName}</strong>? This cannot be undone.`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`/api/users/${user.id}`).subscribe({
          next: () => {
            this.users.update(list => list.filter(u => u.id !== user.id));
            this.showSuccess('User deleted');
          },
          error: () => this.showError('Failed to delete user'),
        });
      },
    });
  }

  resetPassword(user: User) {
    this.confirmationService.confirm({
      message: `Send password reset to <strong>${user.fullName}</strong>?`,
      header: 'Reset Password',
      icon: 'pi pi-key',
      accept: () => {
        this.http.post(`/api/users/${user.id}/reset-password`, {}).subscribe({
          next: () => this.showSuccess('Password reset email sent'),
          error: () => this.showError('Failed to send reset email'),
        });
      },
    });
  }

  // ── Role Row Helpers ───────────────────────

  addRoleRow() {
    this.roleRows.update(rows => [...rows, { role: null, scopeType: null, scopeId: null }]);
  }

  removeRoleRow(i: number) {
    this.roleRows.update(rows => rows.filter((_, idx) => idx !== i));
  }

  onRoleChange(i: number, role: RoleType) {
    this.roleRows.update(rows => {
      const copy = [...rows];
      const scope = ROLE_SCOPE_MAP[role];
      copy[i] = { role, scopeType: scope, scopeId: scope === ScopeType.PDHS ? null : copy[i].scopeId };
      return copy;
    });
  }

  getScopeOptions(row: { scopeType: ScopeType | null }) {
    if (!row.scopeType) return [];
    if (row.scopeType === ScopeType.RDHS)
      return this.districts().map(d => ({ label: d.name, value: d.id }));
    if (row.scopeType === ScopeType.INSTITUTE)
      return this.institutions().map(i => ({ label: i.name, value: i.id }));
    return [];
  }

  scopeLabel(row: { scopeType: ScopeType | null; scopeId: string | null }): string {
    if (!row.scopeType || row.scopeType === ScopeType.PDHS) return 'System-wide';
    if (row.scopeType === ScopeType.RDHS) {
      const d = this.districts().find(x => x.id === row.scopeId);
      return d ? d.name : row.scopeId ?? '—';
    }
    const inst = this.institutions().find(x => x.id === row.scopeId);
    return inst ? inst.name : row.scopeId ?? '—';
  }

  // ── Display Helpers ────────────────────────

  getRoleColor(role: string): string {
    return ROLE_COLORS[role] ?? 'secondary';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getAvatarBg(name: string): string {
    const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    const i = name.charCodeAt(0) % colors.length;
    return colors[i];
  }

  trackByIndex(index: number) { return index; }

  // ── Notifications ──────────────────────────

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: msg, life: 3000 });
  }
  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
  }

  // users.component.ts

updateRoleScopeId(i: number, scopeId: string) {
  this.roleRows.update(rows => {
    const copy = [...rows];
    copy[i] = { ...copy[i], scopeId };
    return copy;
  });
}

updateRoleScopeIdForInstitute(i: number, scopeId: string) {
  this.updateRoleScopeId(i, scopeId);
}

updateRoleScopeIdForDistrict(i: number, scopeId: string) {
  this.updateRoleScopeId(i, scopeId);
}
}

import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { StepperModule } from 'primeng/stepper';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserApiService } from '../../core/services/user-api.service';
import {
  District,
  Institution,
  UserDto,
  UserPermissionRecord,
  UserRoleDto,
} from '../../core/models/biomed.interface';
import { RoleType, SCOPE_ROLES, ROLE_META, SCOPE_META } from '../../core/models/permission.types';
import { QueryService } from '../../core/services/query.service';
import { TablePageEvent } from 'primeng/table';
import { forkJoin, finalize } from 'rxjs';
import { ScopeType } from '../../core/models/permission.types';
import { PermissionService, PermissionMeta } from '../../core/auth/permission.service';
import { Permission } from '../../core/constants/permissions';
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { AuthService } from '../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    DividerModule,
    CheckboxModule,
    ToggleSwitchModule,
    SkeletonModule,
    ChipModule,
    DatePickerModule,
    TabsModule,
    StepperModule,
    TextareaModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
})
export class UsersComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /** Exposed for *appHasPermission in the template. */
  readonly permission = Permission;

  // Permission/role metadata from the backend — single source, fetched once
  readonly meta = toSignal<PermissionMeta | null>(this.permissionService.getMeta(), {
    initialValue: null,
  });
  // ── State ─────────────────────────────────────────────────────────
  users = signal<UserDto[]>([]);
  districts = signal<District[]>([]);
  institutions = signal<Institution[]>([]);
  loading = signal(false);
  search = signal('');
  filterRole = signal('');
  filterActive = signal<'true' | 'false' | null>(null);
  filterDistrict = signal<string | null>(null);

  // Create/Edit dialog
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  selectedUser = signal<UserDto | null>(null);
  submitting = signal(false);
  createStep = signal(0);

  minDate = new Date();

  // User detail drawer
  drawerVisible = signal(false);
  drawerUser = signal<UserDto | null>(null);
  drawerTab = signal(0);

  // Role dialog (add role to existing user)
  roleDialogVisible = signal(false);
  roleSubmitting = signal(false);
  roleForm!: FormGroup;

  // Permission grant dialog
  permDialogVisible = signal(false);
  permSubmitting = signal(false);
  permForm!: FormGroup;

  // Permission matrix pending changes (sync)
  permMatrix = signal<Set<string>>(new Set());
  permMatrixDirty = signal(false);
  permSyncing = signal(false);

  // ── Pagination (server-side) ──────────────────────────────────────
  // Signals so OnPush picks up changes
  first = signal(0);
  rows = signal(10);
  totalRecords = signal(0);

  // Debounce handle for search/filter changes
  private _filterDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private userService: UserApiService,
    private service: QueryService,
  ) {
    // Re-fetch users whenever any filter changes.
    // Reset to page 0 first so the backend page is always correct.
    effect(() => {
      // Track filter signals
      const _s = this.search();
      const _r = this.filterRole();
      const _a = this.filterActive();
      const _d = this.filterDistrict();

      // Debounce so rapid keystrokes don't spam the backend
      if (this._filterDebounce) clearTimeout(this._filterDebounce);
      this._filterDebounce = setTimeout(() => {
        this.first.set(0); // reset to first page
        this.loadUsers();
      }, 300);
    });
  }
  // ── Pagination event (from p-table's (onPage)) ───────────────────
  onPage(event: TablePageEvent) {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.loadUsers();
  }

  get activeCount() {
    return this.users().filter((u) => u.active).length;
  }
  get pendingPwCount() {
    return this.users().filter((u) => u.mustChangePassword).length;
  }

  // ── Form ─────────────────────────────────────────────────────────
  createForm!: FormGroup;

  // Options (labels/colors single-sourced from backend policy files)
  readonly roleOptions = Object.values(RoleType).map((r) => ({
    label: ROLE_META[r].label,
    value: r,
  }));
  readonly scopeOptions = Object.values(ScopeType).map((s) => ({
    label: SCOPE_META[s].label,
    value: s,
  }));
  readonly activeOptions = [
    { label: 'All Users', value: null },
    { label: 'Active Only', value: 'true' },
    { label: 'Inactive Only', value: 'false' },
  ];

  // Default permissions for a role (from backend role-permissions.ts)
  roleDefaults(role: string): string[] {
    return this.meta()?.roleDefaults?.[role] ?? [];
  }

  // Role options filtered to scope
  filteredRoleOptions = computed(() => {
    const scope = this.createForm?.get('scopeType')?.value as ScopeType;
    if (!scope) return this.roleOptions;
    const allowed = SCOPE_ROLES[scope] ?? [];
    return this.roleOptions.filter((o) => allowed.includes(o.value as RoleType));
  });

  roleDialogRoleOptions = computed(() => {
    const scope = this.roleForm?.get('scopeType')?.value as ScopeType;
    if (!scope) return this.roleOptions;
    const allowed = SCOPE_ROLES[scope] ?? [];
    return this.roleOptions.filter((o) => allowed.includes(o.value as RoleType));
  });

  // Institutions filtered by district (for create form)
  ngOnInit() {
    this.buildForms();
    this.loadRefData();

    // Keep the INSTITUTE scope's scopeId in sync with the institution
    // chosen on step 0 (auto-prefill + stays correct if edited later).
    this.createForm
      .get('institutionId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (this.createForm.get('scopeType')?.value === ScopeType.INSTITUTE) {
          this.createForm.patchValue({ scopeId: id ?? null }, { emitEvent: false });
        }
      });
  }

  private buildForms() {
    this.createForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9._-]+$/)],
      ],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      // Optional — empty applies the default password (pdhs@123) server-side
      password: ['', [Validators.minLength(8)]],
      institutionId: [null, Validators.required],
      mustChangePassword: [true],
      active: [true],
      scopeType: [null, Validators.required],
      role: [null, Validators.required],
      scopeId: [null],
    });

    this.roleForm = this.fb.group({
      scopeType: [null, Validators.required],
      role: [null, Validators.required],
      scopeId: [null],
    });

    this.permForm = this.fb.group({
      permission: [null, Validators.required],
      expiresAt: [null],
      note: [''],
      temporary: [false],
    });
  }

  /** Load static reference data once on init. */
  private loadRefData() {
    forkJoin({
      districtsRes: this.service.getDistricts(),
      institutionsRes: this.service.getInstitute(1, 100),
    }).subscribe({
      next: ({ districtsRes, institutionsRes }) => {
        this.districts.set(districtsRes ?? []);
        this.institutions.set(institutionsRes.items ?? []);
      },
      error: () => {},
    });
  }

  /** Load one page of users from the backend, applying current filters. */
  private loadUsers() {
    this.loading.set(true);
    const page = Math.floor(this.first() / this.rows()) + 1;

    this.userService
      .getAllUsers(
        page,
        this.rows(),
        this.search() || undefined,
        this.filterRole() || undefined,
        this.filterActive() ?? undefined, // 'true' | 'false' | undefined
        this.filterDistrict() || undefined,
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.users.set(res.items);
          this.totalRecords.set(res.total);
        },
        error: () => {},
      });
  }

  reloadUser(userId: string) {
    this.userService.getUserById(userId).subscribe({
      next: (u) => {
        this.users.update((list) => list.map((x) => (x.id === userId ? u : x)));
        if (this.drawerUser()?.id === userId) this.drawerUser.set(u);
      },
    });
  }

  // ── Create dialog ─────────────────────────────────────────────────

  openCreate() {
    this.dialogMode.set('create');
    this.createForm.reset({ mustChangePassword: true, active: true, password: '' });
    this.setEditMode(false);
    this.createStep.set(0);
    this.dialogVisible.set(true);
  }

  openEdit(user: UserDto) {
    this.dialogMode.set('edit');
    this.selectedUser.set(user);
    this.createForm.reset({ mustChangePassword: true, active: true, password: '' });
    this.setEditMode(true);
    this.createForm.patchValue({
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? '',
      institutionId: user.institutionId ?? null,
      mustChangePassword: user.mustChangePassword,
    });
    this.createStep.set(0);
    this.dialogVisible.set(true);
  }

  /** Edit mode: username/role/scope are not editable here (roles use the
   *  drawer's Add/Remove Role; password uses Reset Password). Disabling them
   *  keeps the form's validity scoped to the fields this dialog can save. */
  private setEditMode(edit: boolean) {
    for (const name of ['username', 'scopeType', 'role', 'scopeId']) {
      const control = this.createForm.get(name)!;
      if (edit) control.disable();
      else control.enable();
    }
  }

  saveCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.createForm.value };
    if (!payload.password) delete payload.password; // → backend default pdhs@123
    this.submitting.set(true);
    this.userService.createUser(payload).subscribe({
      next: (u) => {
        this.users.update((list) => [u, ...list]);
        this.dialogVisible.set(false);
        this.toast('success', `User ${u.fullName} created`);
      },
      error: () => {},
      complete: () => this.submitting.set(false),
    });
  }

  saveEdit() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const user = this.selectedUser();
    if (!user) return;
    const v = this.createForm.value;
    this.submitting.set(true);
    this.userService
      .updateUser(user.id, {
        fullName: v.fullName,
        email: v.email || undefined,
        institutionId: v.institutionId,
        mustChangePassword: v.mustChangePassword,
      })
      .subscribe({
        next: (u) => {
          this.users.update((list) => list.map((x) => (x.id === u.id ? u : x)));
          if (this.drawerUser()?.id === u.id) this.drawerUser.set(u);
          this.dialogVisible.set(false);
          this.toast('success', `User ${u.fullName} updated`);
        },
        error: () => {},
        complete: () => this.submitting.set(false),
      });
  }

  // ── Drawer (user detail) ──────────────────────────────────────────
  openDrawer(user: UserDto) {
    this.drawerUser.set(user);
    this.drawerTab.set(0);
    // Init permission matrix from the user's active permissions
    const active = new Set<Permission>(
      user.permissions.filter((p) => p.active).map((p) => p.permission),
    );
    this.permMatrix.set(active);
    this.permMatrixDirty.set(false);
    this.drawerVisible.set(true);
  }

  // ── Toggle active ─────────────────────────────────────────────────
  toggleActive(user: UserDto) {
    this.userService.updateUserStatus(user.id, !user.active).subscribe({
      next: (u) => this.users.update((list) => list.map((x) => (x.id === user.id ? u : x))),
      error: () => {},
    });
  }

  // ── "View As" (impersonation) ──────────────────────────────────────
  /**
   * Starts an audited 15-minute session as the selected user so we can
   * see exactly what they see (their scope + permissions) while
   * troubleshooting. Backend requires AUTH_IMPERSONATE (SUPER_ADMIN_PDHS);
   * the directive only hides the button — the API re-verifies.
   */
  viewAs(user: UserDto) {
    this.confirm.confirm({
      message: `Start a <strong>15-minute "View As"</strong> session as <strong>${user.fullName}</strong>?<br/><br/>Every action is audit-logged to your account, and you can exit at any time from the banner.`,
      header: 'View As ' + user.fullName,
      icon: 'pi pi-eye',
      acceptButtonProps: { label: 'Start View As', severity: 'success' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: () => {
        this.authService.impersonate(user.id).subscribe({
          next: () => {
            this.msg.add({
              severity: 'success',
              summary: 'Viewing as ' + user.fullName,
              detail: 'Use the amber banner to exit.',
            });
          },
          error: () => {},
        });
      },
    });
  }

  // ── Reset password ────────────────────────────────────────────────
  confirmReset(user: UserDto) {
    this.confirm.confirm({
      message: `Reset password for <strong>${user.fullName}</strong>? They will need to change it on next login.`,
      header: 'Reset Password',
      icon: 'pi pi-key',
      accept: () => {
        this.userService.passwordReset(user.id).subscribe({
          next: () => {
            this.toast('success', 'Password reset to default');
            this.reloadUser(user.id);
          },
          error: () => {},
        });
      },
    });
  }

  // ── Delete user ───────────────────────────────────────────────────
  confirmDelete(user: UserDto) {
    this.confirm.confirm({
      message: `Permanently delete <strong>${user.fullName}</strong>? This cannot be undone.`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update((list) => list.filter((u) => u.id !== user.id));
            if (this.drawerUser()?.id === user.id) this.drawerVisible.set(false);
            this.toast('success', 'User deleted');
            this.loadUsers();
          },
          error: () => {},
        });
      },
    });
  }

  // ── Role management ───────────────────────────────────────────────
  openAddRole() {
    this.roleForm.reset();
    this.roleDialogVisible.set(true);
  }

  saveRole() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    const userId = this.drawerUser()!.id;
    this.roleSubmitting.set(true);
    this.userService.assignRole(userId, this.roleForm.value).subscribe({
      next: () => {
        this.roleDialogVisible.set(false);
        this.reloadUser(userId);
        this.toast('success', 'Role assigned');
      },
      error: () => {},
      complete: () => this.roleSubmitting.set(false),
    });
  }

  removeRole(roleId: string) {
    const userId = this.drawerUser()!.id;
    this.confirm.confirm({
      message: 'Remove this role from the user?',
      header: 'Remove Role',
      icon: 'pi pi-minus-circle',
      accept: () => {
        this.userService.removeRole(userId, roleId).subscribe({
          next: () => {
            this.reloadUser(userId);
            this.toast('success', 'Role removed');
          },
          error: () => {},
        });
      },
    });
  }

  // ── Permission matrix ─────────────────────────────────────────────
  togglePermission(perm: string) {
    this.permMatrix.update((s) => {
      const next = new Set(s);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
    this.permMatrixDirty.set(true);
  }

  syncPermissions() {
    const userId = this.drawerUser()!.id;
    this.permSyncing.set(true);
    this.userService.addPermission(userId, Array.from(this.permMatrix())).subscribe({
      next: () => {
        this.reloadUser(userId);
        this.permMatrixDirty.set(false);
        this.toast('success', 'Permissions saved');
      },
      error: () => {},
      complete: () => this.permSyncing.set(false),
    });
  }

  resetPermMatrix() {
    const user = this.drawerUser();
    if (!user) return;
    const active = new Set<Permission>(
      user.permissions.filter((p) => p.active).map((p) => p.permission),
    );
    this.permMatrix.set(active);
    this.permMatrixDirty.set(false);
  }

  // ── Grant temporary permission dialog ─────────────────────────────
  openGrantPerm() {
    this.permForm.reset({ temporary: false });
    this.permDialogVisible.set(true);
  }

  saveGrantPerm() {
    if (this.permForm.invalid) {
      this.permForm.markAllAsTouched();
      return;
    }
    const userId = this.drawerUser()!.id;
    const v = this.permForm.value;
    this.permSubmitting.set(true);
    this.userService
      .grantPermission(userId, {
        permission: v.permission,
        expiresAt: v.temporary && v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
        note: v.note || null,
      })
      .subscribe({
        next: () => {
          this.permDialogVisible.set(false);
          this.reloadUser(userId);
          this.toast('success', 'Permission granted');
        },
        error: () => {},
        complete: () => this.permSubmitting.set(false),
      });
  }

  // ── Revoke individual permission ──────────────────────────────────
  revokePermission(perm: UserPermissionRecord) {
    const userId = this.drawerUser()!.id;
    this.confirm.confirm({
      message: `Revoke <strong>${perm.permission}</strong>?${perm.note ? ` (Note: ${perm.note})` : ''}`,
      header: 'Revoke Permission',
      icon: 'pi pi-times-circle',
      accept: () => {
        this.userService.revokePermission(userId, perm.id).subscribe({
          next: () => {
            this.reloadUser(userId);
            this.toast('success', 'Permission revoked');
          },
          error: () => {},
        });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getAvatarBg(name: string) {
    const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  getRoleColor(role: string) {
    return ROLE_META[role as RoleType]?.color ?? '#6b7280';
  }

  districtName(id: string | null) {
    if (!id) return null;
    return this.districts().find((d) => d.id === id)?.name ?? id;
  }

  institutionName(id: string | null) {
    if (!id) return null;
    return this.institutions().find((i) => i.id === id)?.name ?? id;
  }

  scopeLabel(r: UserRoleDto) {
    if (r.scopeType === ScopeType.PDHS) return 'System-wide';
    if (r.scopeType === ScopeType.RDHS) return this.districtName(r.scopeId) ?? r.scopeId ?? '—';
    return this.institutionName(r.scopeId) ?? r.scopeId ?? '—';
  }

  isExpired(p: UserPermissionRecord) {
    return !!p.expiresAt && new Date(p.expiresAt) < new Date();
  }

  districtOptions = computed(() => this.districts().map((d) => ({ label: d.name, value: d.id })));
  institutionOptions = computed(() =>
    this.institutions().map((i) => ({ label: i.name, value: i.id })),
  );

  onCreateScopeChange() {
    const scope = this.createForm.get('scopeType')?.value;
    const institutionId = this.createForm.get('institutionId')?.value;
    // INSTITUTE scope: prefill scopeId with the institution chosen on step 0
    this.createForm.patchValue({
      role: null,
      scopeId: scope === ScopeType.INSTITUTE ? (institutionId ?? null) : null,
    });
  }
  onRoleScopeChange() {
    this.roleForm.patchValue({ role: null, scopeId: null });
  }

  deniedPermissions = computed(() => {
    const enabledPermissions = this.permMatrix();

    return (
      Object.values(Permission)
        // Filter out permissions that are currently enabled in the set
        .filter((p) => !enabledPermissions.has(p))
        // Map the remaining "denied" permissions to the label/value structure
        .map((p) => ({
          label: p.replace(/_/g, ' '),
          value: p,
        }))
    );
  });
  private toast(severity: string, detail: string) {
    this.msg.add({
      severity,
      summary: severity === 'success' ? 'Success' : 'Error',
      detail,
      life: 3500,
    });
  }
}

import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
import { District, Institution, UserDto, UserPermissionRecord, UserRoleDto } from '../../core/models/biomed.interface';
import { RoleType, SCOPE_ROLES } from "../../core/models/permission.types";
import { QueryService } from '../../core/services/query.service';
import { TablePageEvent } from 'primeng/table';
import { forkJoin, finalize } from 'rxjs';
import { Permission, ScopeType } from '../../core/models/permission.types';


export const PERMISSION_GROUPS: { group: string; icon: string; permissions: Permission[] }[] = [
  {
    group: 'Institutions', icon: 'pi-building',
    permissions: [
      Permission.INSTITUTE_VIEW,
      Permission.INSTITUTE_CREATE,
      Permission.INSTITUTE_UPDATE,
      Permission.INSTITUTE_DELETE],
  },
  {
    group: 'Inventory', icon: 'pi-warehouse',
    permissions: [Permission.INVENTORY_VIEW, Permission.INVENTORY_CREATE, Permission.INVENTORY_UPDATE, Permission.INVENTORY_DELETE],
  },
  {
    group: 'Equipment', icon: 'pi-box',
    permissions: [Permission.EQUIPMENT_VIEW, Permission.EQUIPMENT_CREATE, Permission.EQUIPMENT_UPDATE, Permission.EQUIPMENT_ASSIGN, Permission.EQUIPMENT_DISPOSE, Permission.EQUIPMENT_DELETE],
  },
  {
    group: 'Repairs', icon: 'pi-wrench',
    permissions: [Permission.REPAIR_REQUEST_VIEW, Permission.REPAIR_REQUEST_CREATE, Permission.REPAIR_REQUEST_UPDATE],
  },
  {
    group: 'Work Orders', icon: 'pi-clipboard',
    permissions: [Permission.WORK_ORDER_VIEW, Permission.WORK_ORDER_ASSIGN, Permission.WORK_ORDER_COMPLETE],
  },
  {
    group: 'Procurement', icon: 'pi-shopping-cart',
    permissions: [Permission.PROCUREMENT_VIEW, Permission.PROCUREMENT_CREATE, Permission.PROCUREMENT_APPROVE],
  },
  {
    group: 'Users', icon: 'pi-users',
    permissions: [Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE],
  },
  {
    group: 'Permission', icon: 'pi-key',
    permissions: [Permission.PERMISSION_VIEW, Permission.PERMISSION_CREATE, Permission.PERMISSION_CREATE_TEMPORARY, Permission.PERMISSION_REMOVE],
  },
  {
    group: 'Audit', icon: 'pi-history',
    permissions: [Permission.AUDIT_VIEW],
  },
];


// Role colors for badges
export const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN_PDHS: '#dc2626', SUPER_ADMIN_RDHS: '#ea580c', SUPER_ADMIN_INSTITUTE: '#d97706',
  ADMIN_PDHS: '#7c3aed', ADMIN_RDHS: '#6d28d9', ADMIN_INSTITUTE: '#5b21b6',
  VIEWER_PDHS: '#0284c7', VIEWER_RDHS: '#0369a1', VIEWER_INSTITUTE: '#075985',
  BIOMEDICAL_TECHNICIAN: '#059669', STORE_KEEPER: '#16a34a',
  PROCUREMENT_OFFICER: '#0d9488', INSTITUTION_USER: '#6b7280',
};

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, PasswordModule, SelectModule, TagModule,
    ToastModule, ConfirmDialogModule, IconFieldModule, InputIconModule,
    TooltipModule, DividerModule, CheckboxModule, ToggleSwitchModule,
    SkeletonModule, ChipModule, DatePickerModule, TabsModule,
    StepperModule, TextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // ── State ─────────────────────────────────────────────────────────
  users = signal<UserDto[]>([]);
  districts = signal<District[]>([]);
  institutions = signal<Institution[]>([]);
  loading = signal(false);
  search = signal('');
  filterRole = signal('');
  filterActive = signal<'true' | 'false' | null>(null);

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
  permMatrix = signal<Set<Permission>>(new Set());
  permMatrixDirty = signal(false);
  permSyncing = signal(false);

  // ── Pagination (server-side) ──────────────────────────────────────
  // Signals so OnPush picks up changes
  first = signal(0);
  rows = signal(10);
  totalRecords = signal(0);

  // Debounce handle for search/filter changes
  private _filterDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(private userService: UserApiService,
    private service: QueryService,
  ) {
    // Re-fetch users whenever any filter changes.
    // Reset to page 0 first so the backend page is always correct.
    effect(() => {
      // Track filter signals
      const _s = this.search();
      const _r = this.filterRole();
      const _a = this.filterActive();

      // Debounce so rapid keystrokes don't spam the backend
      if (this._filterDebounce) clearTimeout(this._filterDebounce);
      this._filterDebounce = setTimeout(() => {
        this.first.set(0);   // reset to first page
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

  get activeCount() { return this.users().filter(u => u.active).length; }
  get inactiveCount() { return this.users().filter(u => !u.active).length; }
  get pendingPwCount() { return this.users().filter(u => u.mustChangePassword).length; }


  // ── Form ─────────────────────────────────────────────────────────
  createForm!: FormGroup;

  // Options
  readonly roleOptions = Object.values(RoleType).map(r => ({
    label: r.replace(/_/g, ' '), value: r,
  }));
  readonly scopeOptions = [
    { label: 'PDHS (System-wide)', value: ScopeType.PDHS },
    { label: 'RDHS (District)', value: ScopeType.RDHS },
    { label: 'Institute', value: ScopeType.INSTITUTE },
  ];
  readonly activeOptions = [
    { label: 'All Users', value: null },
    { label: 'Active Only', value: 'true' },
    { label: 'Inactive Only', value: 'false' },
  ];
  readonly permGroups = PERMISSION_GROUPS;
  readonly allPermissions = Object.values(Permission);

  // Role options filtered to scope
  filteredRoleOptions = computed(() => {
    const scope = this.createForm?.get('scopeType')?.value as ScopeType;
    if (!scope) return this.roleOptions;
    const allowed = SCOPE_ROLES[scope] ?? [];
    return this.roleOptions.filter(o => allowed.includes(o.value as RoleType));
  });

  roleDialogRoleOptions = computed(() => {
    const scope = this.roleForm?.get('scopeType')?.value as ScopeType;
    if (!scope) return this.roleOptions;
    const allowed = SCOPE_ROLES[scope] ?? [];
    return this.roleOptions.filter(o => allowed.includes(o.value as RoleType));
  });

  // Institutions filtered by district (for create form)
  filteredInstitutions = computed(() => {
    const scopeId = this.createForm?.get('scopeId')?.value;
    if (!scopeId) return this.institutions();
    return this.institutions().filter(i => i.districtId === scopeId);
  });

  ngOnInit() {
    this.buildForms();
    this.loadRefData();
    // Initial user load is triggered by the filter effect in the constructor
  }

  private buildForms() {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9._-]+$/)]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      institutionId: [null],
      mustChangePassword: [true],
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
      error: () => this.toast('error', 'Failed to load reference data'),
    });
  }

  /** Load one page of users from the backend, applying current filters. */
  private loadUsers() {
    this.loading.set(true);
    const page = Math.floor(this.first() / this.rows()) + 1;

    this.userService.getAllUsers(
      page,
      this.rows(),
      this.search() || undefined,
      this.filterRole() || undefined,
      this.filterActive() ?? undefined,  // 'true' | 'false' | undefined
    )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.users.set(res.items);
          this.totalRecords.set(res.total);
        },
        error: () => this.toast('error', 'Failed to load users'),
      });
  }

  reloadUser(userId: string) {
    this.userService.getUserById(userId)
      .subscribe({
        next: u => {
          this.users.update(list => list.map(x => x.id === userId ? u : x));
          if (this.drawerUser()?.id === userId) this.drawerUser.set(u);
        },
      });
  }


  // ── Create dialog ─────────────────────────────────────────────────


  openCreate() {
    this.dialogMode.set('create');
    this.createForm.reset({ mustChangePassword: true });
    this.createStep.set(0);
    this.dialogVisible.set(true);
  }

  saveCreate() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.userService.createUser(this.createForm.value)
      .subscribe({
        next: u => {
          this.users.update(list => [u, ...list]);
          this.dialogVisible.set(false);
          this.toast('success', `UserDto ${u.fullName} created`);
        },
        error: e => this.toast('error', e?.error?.message ?? 'Failed to create user'),
        complete: () => this.submitting.set(false),
      });
  }

  // ── Drawer (user detail) ──────────────────────────────────────────
  openDrawer(user: UserDto) {
    this.drawerUser.set(user);
    this.drawerTab.set(0);
    //console.log('selected permissions', user.permissions)
    // Init permission matrix from user's active permissions
    /*const active = new Set<Permission>(
      user.permissions.filter(p => p.active).map(p => p.permission) ?? [],);*/
    const now = new Date();
    const active = new Set<Permission>(
      user.permissions.filter(p => {
        return !p.expiresAt || new Date(p.expiresAt) > now
      }).map(p => p.permission) ?? [],);
    console.log('active permission', active)
    this.permMatrix.set(active);

    console.log('matrix', this.permMatrix())
    this.permMatrixDirty.set(false);
    this.drawerVisible.set(true);
  }

  // ── Toggle active ─────────────────────────────────────────────────
  toggleActive(user: UserDto) {
    this.userService.updateUserStatus(user.id, !user.active).subscribe({
      next: u => this.users.update(list => list.map(x => x.id === user.id ? u : x)),
      error: () => this.toast('error', 'Failed to update status'),
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
          error: () => this.toast('error', 'Failed to reset password'),
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
            this.users.update(list => list.filter(u => u.id !== user.id));
            if (this.drawerUser()?.id === user.id) this.drawerVisible.set(false);
            this.toast('success', 'User deleted');
            this.loadUsers();
          },
          error: e => this.toast('error', e?.error?.message ?? 'Delete failed'),
        });
      },
    });
  }

  // ── Role management ───────────────────────────────────────────────
  openAddRole() { this.roleForm.reset(); this.roleDialogVisible.set(true); }

  saveRole() {
    if (this.roleForm.invalid) { this.roleForm.markAllAsTouched(); return; }
    const userId = this.drawerUser()!.id;
    this.roleSubmitting.set(true);
    this.userService.assignRole(userId, this.roleForm.value)
      .subscribe({
        next: () => {
          this.roleDialogVisible.set(false);
          this.reloadUser(userId);
          this.toast('success', 'Role assigned');
        },
        error: e => this.toast('error', e?.error?.message ?? 'Failed to assign role'),
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
        this.userService.removeRole(userId, roleId)
          //this.http.delete(`/api/users/${userId}/roles/${roleId}`)
          .subscribe({
            next: () => { this.reloadUser(userId); this.toast('success', 'Role removed'); },
            error: e => this.toast('error', e?.error?.message ?? 'Failed to remove role'),
          });
      },
    });
  }

  // ── Permission matrix ─────────────────────────────────────────────
  togglePermission(perm: Permission) {
    this.permMatrix.update(s => {
      const next = new Set(s);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return next;
    });
    this.permMatrixDirty.set(true);
  }

  syncPermissions() {
    const userId = this.drawerUser()!.id;
    this.permSyncing.set(true);
    this.userService.addPermission(userId, Array.from(this.permMatrix()),
    )
      /* this.http.put(`/api/users/${userId}/permissions`, {
         permissions: Array.from(this.permMatrix()),
       })*/
      .subscribe({
        next: () => { this.reloadUser(userId); this.permMatrixDirty.set(false); this.toast('success', 'Permissions saved'); },
        error: e => this.toast('error', e?.error?.message ?? 'Failed to save permissions'),
        complete: () => this.permSyncing.set(false),
      });
  }

  resetPermMatrix() {
    const user = this.drawerUser();
    if (!user) return;
    const active = new Set<Permission>(
      user.permissions.filter(p => p.active).map(p => p.permission),
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
    if (this.permForm.invalid) { this.permForm.markAllAsTouched(); return; }
    const userId = this.drawerUser()!.id;
    const v = this.permForm.value;
    this.permSubmitting.set(true);
    this.http.post(`/api/users/${userId}/permissions`, {
      permission: v.permission,
      expiresAt: v.temporary && v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
      note: v.note || null,
    }).subscribe({
      next: () => {
        this.permDialogVisible.set(false);
        this.reloadUser(userId);
        this.toast('success', 'Permission granted');
      },
      error: e => this.toast('error', e?.error?.message ?? 'Failed to grant permission'),
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
        this.http.delete(`/api/users/${userId}/permissions/${perm.id}`).subscribe({
          next: () => { this.reloadUser(userId); this.toast('success', 'Permission revoked'); },
          error: () => this.toast('error', 'Failed to revoke permission'),
        });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarBg(name: string) {
    const colors = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#16a34a'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  getRoleColor(role: string) { return ROLE_COLOR[role] ?? '#6b7280'; }

  districtName(id: string | null) {
    if (!id) return null;
    return this.districts().find(d => d.id === id)?.name ?? id;
  }

  institutionName(id: string | null) {
    if (!id) return null;
    return this.institutions().find(i => i.id === id)?.name ?? id;
  }

  scopeLabel(r: UserRoleDto) {
    if (r.scopeType === ScopeType.PDHS) return 'System-wide';
    if (r.scopeType === ScopeType.RDHS) return this.districtName(r.scopeId) ?? r.scopeId ?? '—';
    return this.institutionName(r.scopeId) ?? r.scopeId ?? '—';
  }

  isExpired(p: UserPermissionRecord) {
    return !!p.expiresAt && new Date(p.expiresAt) < new Date();
  }

  isTemporary(p: UserPermissionRecord) { return !!p.expiresAt; }

  districtOptions = computed(() => this.districts().map(d => ({ label: d.name, value: d.id })));
  institutionOptions = computed(() => this.institutions().map(i => ({ label: i.name, value: i.id })));

  onCreateScopeChange() {
    this.createForm.patchValue({ role: null, scopeId: null });
  }
  onRoleScopeChange() { this.roleForm.patchValue({ role: null, scopeId: null }); }

  deniedPermissions = computed(() => {
    const enabledPermissions = this.permMatrix();

    return Object.values(Permission)
      // Filter out permissions that are currently enabled in the set
      .filter(p => !enabledPermissions.has(p))
      // Map the remaining "denied" permissions to the label/value structure
      .map(p => ({
        label: p.replace(/_/g, ' '),
        value: p,
      }));
  });
  private toast(severity: string, detail: string) {
    this.msg.add({ severity, summary: severity === 'success' ? 'Success' : 'Error', detail, life: 3500 });
  }
}
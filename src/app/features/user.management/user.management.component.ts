import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RoleType, UserDto } from '../../core/models/biomed.interface';
import { ScopeType } from '../../core/auth/permission.types';
import { UserApiService } from '../../core/services/user-api.service';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, ToggleButtonModule, TagModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user.management.component.html'
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserApiService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Core State (Signals)
  users = signal<UserDto[]>([]);
  loading = signal<boolean>(false);
  displayDialog = signal<boolean>(false);
  selectedUser = signal<UserDto | null>(null);

  userForm!: FormGroup;

  // Options
  rolesOptions: RoleType[] = ['SUPER_ADMIN_PDHS', 'ADMIN_RDHS', 'ADMIN_INSTITUTE', 'BIOMEDICAL_TECHNICIAN'];
  scopeOptions: ScopeType[] = ['PDHS', 'RDHS', 'INSTITUTE'];

  ngOnInit() {
    //this.initForm();
    //this.loadUsers();
  }

  private initForm() {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.email]],
      institutionId: [null],
      roles: this.fb.array([])
    });
  }

  get rolesFormArray() {
    return this.userForm.get('roles') as FormArray;
  }

  addRoleField(role?: RoleType, scopeType?: ScopeType, scopeId?: string | null) {
    const roleGroup = this.fb.group({
      role: [role || null, Validators.required],
      scopeType: [scopeType || null, Validators.required],
      scopeId: [scopeId || null]
    });

    // Handle conditional scope requirements dynamically
   /* roleGroup.get('scopeType')?.valueChanges.subscribe((type: ScopeType) => {
      const scopeIdCtrl = roleGroup.get('scopeId');
      if (type === 'PDHS') {
        scopeIdCtrl?.setValue(null);
        scopeIdCtrl?.clearValidators();
      } else {
        scopeIdCtrl?.setValidators([Validators.required]);
      }
      scopeIdCtrl?.updateValueAndValidity();
    });*/

    this.rolesFormArray.push(roleGroup);
  }

  removeRoleField(index: number) {
    this.rolesFormArray.removeAt(index);
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users' }),
      complete: () => this.loading.set(false)
    });
  }

  openNew() {
    this.selectedUser.set(null);
    this.userForm.reset();
    this.rolesFormArray.clear();
    this.addRoleField(); 
    this.displayDialog.set(true);
  }

  openEdit(user: UserDto) {
    this.selectedUser.set(user);
    this.userForm.reset({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      institutionId: user.institutionId
    });
    this.rolesFormArray.clear();
    user.roles.forEach(r => this.addRoleField(r.role, r.scopeType, r.scopeId));
    this.displayDialog.set(true);
  }

 /* toggleStatus(user: UserDto) {
    this.userService.toggleUserStatus(user.id, !user.active).subscribe(() => {
      this.users.update(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User status changed' });
    });
  }*/

  saveUser() {
    if (this.userForm.invalid) return;
    const payload = this.userForm.value;
    const currentUser = this.selectedUser();

    if (currentUser) {
      this.userService.updateUser(currentUser.id, payload).subscribe(() => {
        this.loadUsers();
        this.displayDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated' });
      });
    } else {
      this.userService.createUser(payload).subscribe(() => {
        this.loadUsers();
        this.displayDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User created' });
      });
    }
  }

  deleteUser(user: UserDto) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.fullName}?`,
      accept: () => {
        this.userService.deleteUser(user.id).subscribe(() => {
          this.users.update(prev => prev.filter(u => u.id !== user.id));
          this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'User deleted' });
        });
      }
    });
  }

  getSeverity(scope: ScopeType): 'success' | 'info' | 'warn' | 'danger' | undefined {
    switch (scope) {
      case 'PDHS': return 'success';
      case 'RDHS': return 'warn';
      case 'INSTITUTE': return 'info';
      default: return undefined;
    }
  }
}
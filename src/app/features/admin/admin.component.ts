import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { UsersComponent } from '../users/users.component';
import { AuditComponent } from '../audit/audit.component';
// Assume others are placeholders for now to meet the requirement or simple inline templates
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, TabsModule, UsersComponent, AuditComponent, TableModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  institutions = [{ id: '1', name: 'General Hospital', type: 'Hospital', districtId: 'D1' }];
  districts = [{ id: 'D1', name: 'Colombo' }];
  suppliers = [{ id: 'S1', name: 'BioMed Supplies Co.' }];
}

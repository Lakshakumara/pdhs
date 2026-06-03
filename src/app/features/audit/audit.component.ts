import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';
import { AuditLog } from '../../core/models/biomed.interface';
import { UserFacadeService } from '../../core/services/user-facade.service';

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit {
  public logs: AuditLog[] = [];
  public filteredLogs: AuditLog[] = [];

  // Filter properties
  public searchTerm = '';
  public selectedAction = '';

  constructor(public userFacade: UserFacadeService, private stateService: BiomedStateService) {}

  ngOnInit() {

    this.stateService.auditLogs$.subscribe(list => {
      this.logs = list;
      this.applyFilters();
    });
  }

  public applyFilters() {
    let list = [...this.logs];

    // Search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(l => 
        l.userName.toLowerCase().includes(term) ||
        l.description.toLowerCase().includes(term) ||
        l.entityName.toLowerCase().includes(term) ||
        l.recordId.toLowerCase().includes(term)
      );
    }

    // Action filter
    if (this.selectedAction) {
      list = list.filter(l => l.action === this.selectedAction);
    }

    this.filteredLogs = list;
  }

  public getActionClass(action: 'CREATE' | 'UPDATE' | 'DELETE'): string {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
      case 'DELETE': return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/50';
      default: return 'bg-zinc-50 text-zinc-600';
    }
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLog } from '../../core/models/biomed.interface';
import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToolbarModule } from 'primeng/toolbar';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

type DateRangePreset = 'today' | '7d' | '30d' | 'thisMonth' | 'custom' | '';

@Component({
  selector: 'app-audit',
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, InputTextModule, SelectModule,
    IconFieldModule, InputIconModule, ToolbarModule, SkeletonModule,
    DatePickerModule, ButtonModule, TooltipModule
  ],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit {

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(true);

  // Pagination / lazy-load state
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);

  // Filters
  public searchTerm = '';
  public selectedAction = '';
  public datePreset: DateRangePreset = '7d';
  public customFromDate: Date | null = null;
  public customToDate: Date | null = null;

  public readonly actionOptions = [
    { label: 'CREATE (Insert)', value: 'CREATE' },
    { label: 'UPDATE (Modify)', value: 'UPDATE' },
    { label: 'DELETE (Remove)', value: 'DELETE' },
    { label: 'ASSIGN', value: 'ASSIGN' },
    { label: 'STATUS_CHANGE', value: 'STATUS_CHANGE' },
  ];

  public readonly datePresetOptions: { label: string; value: DateRangePreset }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Custom Range', value: 'custom' },
    { label: 'All Time', value: '' },
  ];

  constructor(
    public userFacade: UserFacadeService,
    private queryService: QueryService) { }

  ngOnInit() {
    // Initial load happens via the table's first onLazyLoad emission.
  }

  // ---------------------------------------------------------------------
  // p-table lazy load: ONE handler drives pagination + filtering.
  // Scoping (institution/district) is applied server-side using the
  // viewer's activeRole — same pattern as Equipment/Repairs — so this
  // component never needs to know the scoping rules itself.
  // ---------------------------------------------------------------------
  public onLazyLoad(event: TableLazyLoadEvent) {
    if (this.userFacade.currentSession() == null) return;

    this.loading.set(true);

    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;

    this.currentPage.set(page);
    this.pageSize.set(rows);

    const { from, to } = this.resolveDateRange();

    this.queryService.getAuditLogs(
      page,
      rows,
      this.searchTerm,
      this.selectedAction,
      from,
      to,
    ).subscribe({
      next: result => {
        this.logs.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  public onFilterChange() {
    this.currentPage.set(1);
    this.onLazyLoad({ first: 0, rows: this.pageSize() });
  }

  public onDatePresetChange() {
    if (this.datePreset !== 'custom') {
      this.customFromDate = null;
      this.customToDate = null;
    }
    this.onFilterChange();
  }

  public onCustomDateChange() {
    if (this.customFromDate && this.customToDate) {
      this.onFilterChange();
    }
  }

  private resolveDateRange(): { from?: string; to?: string } {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (this.datePreset) {
      case 'today':
        return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
      case '7d': {
        const from = new Date(now);
        from.setDate(from.getDate() - 7);
        return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
      }
      case '30d': {
        const from = new Date(now);
        from.setDate(from.getDate() - 30);
        return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
      }
      case 'thisMonth': {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() };
      }
      case 'custom':
        if (this.customFromDate && this.customToDate) {
          return {
            from: startOfDay(this.customFromDate).toISOString(),
            to: endOfDay(this.customToDate).toISOString(),
          };
        }
        return {};
      default:
        return {}; // 'All Time' — no date constraint
    }
  }

  // Severity mapping for p-tag — visually distinguishes action types
  // and works automatically with PrimeNG's light/dark theme tokens
  // since severity colors are theme-aware, unlike hardcoded Tailwind classes.
  public getActionSeverity(action: string): 'success' | 'info' | 'danger' | 'warn' | 'secondary' {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'ASSIGN': return 'warn';
      case 'STATUS_CHANGE': return 'secondary';
      default: return 'secondary';
    }
  }
}
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { QueryService } from '../../../core/services/query.service';
import {
  RepairRequest,
  WorkOrder,
  RepairPriority,
  WorkOrderStatus,
  RepairHistoryEntry,
} from '../../../core/models/biomed.interface';

@Component({
  selector: 'app-repair-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repair-history.component.html',
  styleUrl: './repair-history.component.css',
})
export class RepairHistoryComponent implements OnInit, OnChanges {
  /** The equipment whose history to display */
  @Input({ required: true }) equipmentId!: string;
  @Input() equipmentName: string = '';
  @Input() equipmentSerial: string = '';

  /** Emits when the panel should be closed */
  @Output() closed = new EventEmitter<void>();

  readonly entries = signal<RepairHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly pageSize = signal(8);
  readonly total = signal(0);
  readonly totalPages = signal(1);

  /** Tracks which entry cards are expanded to show parts detail */
  expandedIds = new Set<string>();

  constructor(private queryService: QueryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipmentId'] && !changes['equipmentId'].firstChange) {
      this.currentPage.set(1);
      this.expandedIds.clear();
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.loading.set(true);
    this.entries.set([]);

    this.queryService
      .getEquipmentRepairHistory(
        this.equipmentId,
        this.currentPage(),
        this.pageSize()
      )
      .subscribe({
        next: (result) => {
          this.total.set(result.total);
          this.totalPages.set(result.totalPages || 1);

          if (result.items.length === 0) {
            this.loading.set(false);
            return;
          }

          // For each repair request, fetch its linked work order in parallel
          const woRequests = result.items.map((req) =>
            this.queryService.getWorkOrder(req.id).pipe(
              map((woResult) => woResult ?? undefined),
              catchError(() => of(undefined))
            )
          );

          forkJoin(woRequests).subscribe((workOrders) => {
            const combined: RepairHistoryEntry[] = result.items.map(
              (req, i) => ({
                repairRequest: req,
                workOrder: workOrders[i],
              })
            );
            this.entries.set(combined);
            this.loading.set(false);
          });
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  toggleExpand(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.expandedIds.clear();
    this.loadHistory();
  }

  close(): void {
    this.closed.emit();
  }

  // ─── Display Helpers ─────────────────────────────────────────────────────────

  getPriorityClass(p: RepairPriority | string): string {
    switch (p) {
      case 'Emergency':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40';
      case 'Urgent':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40';
      case 'Routine':
      default:
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
    }
  }

  getStatusClass(status: WorkOrderStatus | string): string {
    switch (status) {
      case 'Submitted':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
      case 'Acknowledged':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
      case 'Diagnosed':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400';
      case 'In Repair':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Verified & Closed':
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
      default:
        return 'bg-zinc-100 text-zinc-500';
    }
  }

  getStatusIcon(status: WorkOrderStatus | string): string {
    switch (status) {
      case 'Submitted': return 'pi-inbox';
      case 'Acknowledged': return 'pi-eye';
      case 'Diagnosed': return 'pi-search';
      case 'In Repair': return 'pi-wrench';
      case 'Completed': return 'pi-check-circle';
      case 'Verified & Closed': return 'pi-lock';
      default: return 'pi-circle';
    }
  }

  getPriorityIcon(p: RepairPriority | string): string {
    switch (p) {
      case 'Emergency': return 'pi-exclamation-circle';
      case 'Urgent': return 'pi-exclamation-triangle';
      default: return 'pi-info-circle';
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    // Show at most 5 page numbers around current page
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiomedStateService } from '../../core/services/biomed-state.service';

import { UserFacadeService } from '../../core/services/user-facade.service';
import { QueryService } from '../../core/services/query.service';
import { UpsertService } from '../../core/services/upsert.service';
import { NotificationService } from '../../core/services/notification.service';
import { RepairRequest, WorkOrder, Institution, Equipment, InventoryItem, RepairPriority, WorkOrderStatus, PartUsedDetail, InspectedSparePart } from '../../core/models/biomed.interface';
import { RoleType } from "../../core/models/permission.types";
import { HasPermissionDirective } from '../../core/directives/permission-directive';
import { Permission } from '../../core/models/permission.types';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToolbarModule } from 'primeng/toolbar';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-repairs',
  imports: [
    CommonModule, FormsModule,
    TableModule, DialogModule, TagModule, ButtonModule, InputTextModule,
    SelectModule, IconFieldModule, InputIconModule, TextareaModule,
    InputNumberModule, CheckboxModule, ToolbarModule, SkeletonModule
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'

  /**
   * <div class="space-y-6">

  <!-- Header / Action bar -->
  <p-toolbar styleClass="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
    <ng-template pTemplate="start">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-50">Equipment Repairs & Work Orders</h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">Track biomedical hardware repair requests and technical
          queues</p>
      </div>
    </ng-template>
    <ng-template pTemplate="end">
      <p-button *appHasPermission="permission.REPAIR_REQUEST_CREATE" label="Submit Repair Request" icon="pi pi-plus"
        (onClick)="openRequestModal()" />
    </ng-template>
  </p-toolbar>

  <!-- Repairs Table -->
  <div class="bg-white dark:bg-zinc-900 border border-zinc-200 
    dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
    <p-table [value]="repairRequests()" [lazy]="true" (onLazyLoad)="onLazyLoad($event)" [loading]="loading()"
      [paginator]="true" [rows]="pageSize()" [totalRecords]="total()" [rowsPerPageOptions]="[10, 25, 50]"
      [showCurrentPageReport]="true" currentPageReportTemplate="{first} to {last} of {totalRecords} requests"
      dataKey="id" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '60rem' }">

      <!-- Header filter row -->
      <ng-template pTemplate="caption">
        <div class="flex flex-col md:flex-row gap-3">
          <p-iconField iconPosition="left" class="flex-1">
            <p-inputIcon styleClass="pi pi-search" />
            <input pInputText type="text" [(ngModel)]="searchTerm" (keyup.enter)="onFilterChange()"
              placeholder="Search by ID, equipment, location, fault description..." class="w-full" />
          </p-iconField>

          <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority" (onChange)="onFilterChange()"
            placeholder="All Priorities" [showClear]="true" styleClass="w-full md:w-48" />

          <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" (onChange)="onFilterChange()"
            placeholder="All Statuses" [showClear]="true" styleClass="w-full md:w-56" />
        </div>
      </ng-template>

      <!-- Column headers — pSortableColumn gives free sort arrows + lazy sort events -->
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="id" class="text-xs">Request ID <p-sortIcon field="id" /></th>
          <th class="text-xs">Equipment Details</th>
          <th class="text-xs">Peripheral Unit</th>
          <th pSortableColumn="priority" class="text-xs">Priority <p-sortIcon field="priority" /></th>
          <th pSortableColumn="submissionDate" class="text-xs">Submission Date <p-sortIcon field="submissionDate" />
          </th>
          <th class="text-xs">Lifecycle Status</th>
          <th class="text-xs text-right">Actions</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-req>
        <tr class="text-xs">
          <td class="font-mono font-bold text-zinc-500">{{ req.id }}</td>

          <td>
            <div class="font-bold text-zinc-900 dark:text-zinc-50">{{ req.equipmentName }}</div>
            <div class="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5" *ngIf="req.sparePartName">
              Part Fault: <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ req.sparePartName
                }}</span>
            </div>
            <div class="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5" *ngIf="!req.sparePartName">
              Main Body / Assembly Fault
            </div>
          </td>

          <td class="font-medium text-zinc-700 dark:text-zinc-300">{{ req.institutionName }}</td>

          <td>
            <p-tag [value]="req.priority" [severity]="getPrioritySeverity(req.priority)"
              styleClass="text-[10px] uppercase" />
          </td>

          <td class="text-zinc-500">{{ req.submissionDate | date:'mediumDate' }}</td>

          <td *ngIf="req.workOrder as wo">
            <p-tag [value]="wo.status" [severity]="getStatusSeverity(wo.status)" styleClass="text-[10px]" />
          </td>

          <td class="text-right space-x-2">
            <p-button label="View Timeline" size="small" severity="secondary" [outlined]="true"
              (onClick)="openDetails(req)" />
            <p-button *appHasPermission="permission.WORK_ORDER_ASSIGN" label="Manage Job" size="small"
              (onClick)="openTechnicianModal(req)" />
          </td>
        </tr>
      </ng-template>

      <!-- Loading skeleton instead of a blank table while data streams in -->
      <ng-template pTemplate="loadingbody">
        <tr *ngFor="let i of [1,2,3,4,5]">
          <td colspan="7" class="p-3"><p-skeleton height="1.25rem" /></td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7" class="p-8 text-center text-zinc-500">
            <i class="pi pi-wrench text-3xl mb-2 text-zinc-300 block"></i>
            No active repair work orders matching the filters.
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>

  <!-- DIALOG: WORK ORDER TIMELINE & DETAILS -->
  <p-dialog header="Work Order Timeline Log" [(visible)]="showDetailModal" [modal]="true" [style]="{ width: '50rem' }"
    [breakpoints]="{ '960px': '90vw' }" (onHide)="closeDetails()">

    <ng-container *ngIf="selectedReq() as selectedReq">
      <ng-container *ngIf="selectedReq.workOrder as selectedWO">

        <h3 class="font-bold text-lg text-zinc-900 dark:text-zinc-50 -mt-2 mb-4">
          {{ selectedReq.equipmentName }} (Ticket: {{ selectedReq.id }})
        </h3>

        <!-- Workflow Timeline Tracker -->
        <div class="bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 mb-6">
          <p class="text-[10px] uppercase font-bold text-zinc-400 mb-4 tracking-wider text-center">Lifecycle Milestone
            Progression</p>

          <div class="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <div
              class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700 md:left-4 md:right-4 md:top-4 md:h-0.5 md:w-auto -z-10 hidden md:block">
            </div>

            <div *ngFor="let s of lifecycleSteps; let i = index"
              class="flex md:flex-col items-center gap-2 z-10 w-full md:w-auto">
              <div [class.bg-emerald-500]="isStepComplete(s, selectedWO.status)"
                [class.text-white]="isStepComplete(s, selectedWO.status)"
                [class.bg-zinc-200]="!isStepComplete(s, selectedWO.status)"
                [class.dark:bg-zinc-800]="!isStepComplete(s, selectedWO.status)"
                [class.text-zinc-500]="!isStepComplete(s, selectedWO.status)"
                class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300">
                <i class="pi pi-check text-[10px]" *ngIf="isStepComplete(s, selectedWO.status)"></i>
                <span *ngIf="!isStepComplete(s, selectedWO.status)">{{ i + 1 }}</span>
              </div>
              <div class="text-left md:text-center min-w-0">
                <p class="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{{ s }}</p>
                <p class="text-[9px] text-zinc-400" *ngIf="selectedWO.status === s">Active Status</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Request Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="space-y-4">
            <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1">Request Information</h4>
            <div>
              <p class="text-[10px] uppercase font-bold text-zinc-400">Peripheral Hospital</p>
              <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ selectedReq.institutionName }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-bold text-zinc-400">Target Device Serial</p>
              <p class="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-300">{{
                selectedReq.equipmentSerialNumber }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-bold text-zinc-400">Fault Description Reported</p>
              <p
                class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-red-50/30 dark:bg-zinc-800/40 p-3 rounded-lg border border-red-100/30 dark:border-zinc-700">
                {{ selectedReq.faultDescription }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1">PDHS Technical Resolution
            </h4>
            <div>
              <p class="text-[10px] uppercase font-bold text-zinc-400">Assigned Technician</p>
              <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ selectedWO.assignedTechnicianName ||
                'Awaiting assignment' }}</p>
            </div>
            <div *ngIf="selectedWO.diagnosisNotes">
              <p class="text-[10px] uppercase font-bold text-zinc-400">Technical Diagnostic Notes</p>
              <p
                class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-150 dark:border-zinc-800">
                {{ selectedWO.diagnosisNotes }}</p>
            </div>
            <div *ngIf="!selectedWO.diagnosisNotes">
              <p class="text-xs text-zinc-400 italic"><i class="pi pi-info-circle mr-1 text-sm"></i> No diagnostics
                logged yet by the technician.</p>
            </div>
          </div>
        </div>

        <!-- Inspection Checklists -->
        <div *ngIf="selectedWO.inspectedSpareParts && selectedWO.inspectedSpareParts.length > 0" class="mb-6">
          <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1.5 mb-2">Tracked Parts
            Inspection Logs</h4>
          <p-table [value]="selectedWO.inspectedSpareParts" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th class="text-xs">Spare Part Name</th>
                <th class="text-xs">Inspected</th>
                <th class="text-xs">Condition / Diagnosis notes</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr class="text-xs">
                <td class="font-semibold text-zinc-900 dark:text-zinc-300">{{ item.sparePartName }}</td>
                <td><p-tag [value]="item.inspected ? 'Yes' : 'No'" [severity]="item.inspected ? 'success' : 'danger'"
                    styleClass="text-[9px]" /></td>
                <td class="text-zinc-700 dark:text-zinc-400">{{ item.conditionNotes || 'No notes' }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Spare Parts Consumed -->
        <div *ngIf="selectedWO.partsUsed && selectedWO.partsUsed.length > 0" class="mb-2">
          <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1.5 mb-2">Spare Parts Consumed
            (Store Issue)</h4>
          <p-table [value]="selectedWO.partsUsed" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th class="text-xs">Part Description</th>
                <th class="text-xs text-center">Quantity Used</th>
                <th class="text-xs text-right">Unit Cost</th>
                <th class="text-xs text-right">Total Cost</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-part>
              <tr class="text-xs">
                <td class="font-medium text-zinc-900 dark:text-zinc-300">{{ part.inventoryItemName }}</td>
                <td class="text-center font-bold">{{ part.quantityUsed }}</td>
                <td class="text-right font-mono text-zinc-500">LKR {{ part.unitCost | number }}</td>
                <td class="text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  LKR {{ (part.quantityUsed * (part.unitCost ?? 0)) | number }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      </ng-container>
    </ng-container>

    <ng-template pTemplate="footer">
      <p-button *ngIf="isSupervisor() && selectedReq()?.workOrder?.status === 'Completed'"
        label="Verify & Close Work Order" icon="pi pi-verified"
        (onClick)="verifyAndCloseWorkOrder(selectedReq()?.workOrder!.id)" />
      <p-button label="Close Details" severity="secondary" [outlined]="true" (onClick)="closeDetails()" />
    </ng-template>
  </p-dialog>

  <!-- DIALOG: PERIPHERAL UNIT SUBMIT REQUEST -->
  <p-dialog header="Create Repair Request Ticket" [(visible)]="showRequestModal" [modal]="true"
    [style]="{ width: '32rem' }" [breakpoints]="{ '640px': '95vw' }" (onHide)="closeRequestModal()">

    <div class="space-y-4">
      <div>
        <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Target Biomedical
          Equipment *</label>
        <p-select [(ngModel)]="reqEqId" (onChange)="onEqChange()" [options]="equipments()" optionLabel="name"
          optionValue="id" placeholder="-- Select Equipment --" styleClass="w-full">
          <ng-template let-eq pTemplate="item">{{ eq.name }} (Serial: {{ eq.serialNumber }})</ng-template>
        </p-select>
      </div>

      <div *ngIf="selectedEqSparePartList.length > 0">
        <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Faulty Spare Part
          (Optional)</label>
        <p-select [(ngModel)]="reqCompId" [options]="selectedEqSparePartList" optionLabel="name" optionValue="id"
          placeholder="-- Entire Equipment Body / Unknown --" styleClass="w-full">
          <ng-template let-comp pTemplate="item">{{ comp.name }} (Part No: {{ comp.partNumber }})</ng-template>
        </p-select>
      </div>

      <div>
        <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Repair Priority *</label>
        <p-select [(ngModel)]="reqPriority" styleClass="w-full" [options]="[
            { label: 'Routine (Regular Service / Calibration / Minor)', value: 'Routine' },
            { label: 'Urgent (Restricted operation / Ward clinical delay)', value: 'Urgent' },
            { label: 'Emergency (Life support offline / ICU clinical collapse)', value: 'Emergency' }
          ]" />
      </div>

      <div>
        <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Fault Symptoms /
          Description *</label>
        <textarea pTextarea [(ngModel)]="reqFaultDesc" rows="4" class="w-full"
          placeholder="Please detail symptoms, error codes displayed, or physical damage observed..."></textarea>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="closeRequestModal()" />
      <p-button label="Submit Ticket" (onClick)="submitRequest()" />
    </ng-template>
  </p-dialog>

  <!-- DIALOG: TECHNICIAN WORKBENCH -->
  <p-dialog header="PDHS Technician Queue Workbench" [(visible)]="showTechnicianModal" [modal]="true"
    [style]="{ width: '48rem' }" [breakpoints]="{ '960px': '90vw' }" (onHide)="closeTechnicianModal()">

    <ng-container *ngIf="selectedReq() as selectedReq">
      <ng-container *ngIf="workOrder() as selectedWO">

        <h3 class="font-bold text-lg text-zinc-900 dark:text-zinc-50 -mt-2 mb-4">Manage Work Order: {{ selectedWO.id }}
        </h3>

        <div class="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 rounded-xl mb-6">
          <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reported Problem Symptom</p>
          <p class="text-xs text-zinc-700 dark:text-zinc-300 mt-1 italic">"{{ selectedReq.faultDescription }}"</p>
        </div>

        <div class="mb-6">
          <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Diagnostic Log Findings
            *</label>
          <textarea pTextarea [(ngModel)]="diagnosisNotes" rows="4" class="w-full"
            placeholder="Type your diagnostic tests results, spare part checks, and source failure causes..."></textarea>
        </div>

        <div *ngIf="techInspectedSpareParts.length > 0" class="mb-6">
          <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1.5 mb-2">Detailed Spare Parts
            Verification Checklist</h4>
          <div class="space-y-3">
            <div *ngFor="let item of techInspectedSpareParts"
              class="flex flex-col md:flex-row gap-3 items-start md:items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800">
              <div class="flex items-center gap-2">
                <p-checkbox [(ngModel)]="item.inspected" [binary]="true" />
                <span class="text-xs font-bold text-zinc-900 dark:text-zinc-300 truncate max-w-[200px]">{{
                  item.sparePartName }}</span>
              </div>
              <input pInputText type="text" [(ngModel)]="item.conditionNotes"
                placeholder="Logged condition note (e.g. checked fine / replaced cables)" class="flex-1 w-full" />
            </div>
          </div>
        </div>

        <div class="mb-2">
          <h4 class="font-bold text-xs text-zinc-500 uppercase tracking-wider border-b pb-1.5 mb-3">Material Store Parts
            Consumption</h4>

          <div
            class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
            <div class="md:col-span-7">
              <p-autocomplete [(ngModel)]="tempItem" [forceSelection]="true" [suggestions]="inventoryItems()"
                (completeMethod)="filterItems($event)" inputId="advanced-chips" [fluid]="true" [dropdown]="true"
                optionLabel="name" placeholder="Add Items">
                <ng-template let-item pTemplate="item">
                  <div
                    class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                    <div class="flex flex-col min-w-0">
                      <span class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{{ item.name }}</span>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span
                          class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">{{
                          item.category }}</span>
                        <span class="text-[10px]" [class.text-red-500]="item.currentStock <= item.minStockThreshold"
                          [class.text-zinc-500]="item.currentStock > item.minStockThreshold">Stock: {{ item.currentStock
                          }}</span>
                      </div>
                    </div>
                    <div class="text-right ml-4">
                      <div class="font-semibold text-sm text-emerald-600">{{ item.costPerUnit | number:'1.2-2' }}</div>
                      <div class="text-[10px] text-zinc-400">per unit</div>
                    </div>
                  </div>
                </ng-template>
                <ng-template let-value pTemplate="selectedItem">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex flex-col">
                      <span class="font-medium text-sm">{{ value.name }}</span>
                      <span class="text-[11px] text-zinc-500">{{ value.category }} • Stock {{ value.currentStock
                        }}</span>
                    </div>
                    <span class="font-semibold text-emerald-600">{{ value.costPerUnit | number:'1.2-2' }}</span>
                  </div>
                </ng-template>
              </p-autocomplete>
            </div>
            <div class="md:col-span-3">
              <label class="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Quantity Required</label>
              <p-inputNumber [(ngModel)]="tempPartQty" [min]="1" [fluid]="true" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-[9px] font-bold text-transparent uppercase mb-1 select-none">+</label>
              <p-button label="Add" icon="pi pi-plus" (onClick)="addPartToBuffer()" styleClass="w-full" />
            </div>
          </div>

          <p-table *ngIf="techPartsUsed.length > 0" [value]="techPartsUsed" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th class="text-xs">Part Description</th>
                <th class="text-xs text-center">Qty</th>
                <th class="text-xs text-right">Cost</th>
                <th class="text-xs text-right">Remove</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-part let-i="rowIndex">
              <tr class="text-xs">
                <td class="font-medium text-zinc-800 dark:text-zinc-200">{{ part.inventoryItemName }}</td>
                <td class="text-center font-bold">{{ part.quantityUsed }}</td>
                <td class="text-right font-mono text-zinc-500">LKR {{ (part.quantityUsed * (part.unitCost ?? 0)) |
                  number }}</td>
                <td class="text-right">
                  <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                    (onClick)="removePartFromBuffer(i)" />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      </ng-container>
    </ng-container>

    <ng-template pTemplate="footer">
      <div class="flex flex-wrap gap-2 w-full justify-between">
        <div class="flex flex-wrap gap-2">
          <p-button *ngIf="selectedReq()?.workOrder?.status === 'Submitted'" label="Acknowledge & Accept Job"
            (onClick)="runWorkOrderStep('Acknowledge')" />
          <p-button *ngIf="selectedReq()?.workOrder?.status === 'Acknowledged'" label="Confirm Diagnostics Log"
            severity="help" (onClick)="runWorkOrderStep('Diagnose')" />
          <p-button *ngIf="selectedReq()?.workOrder?.status === 'Diagnosed'" label="Move to &quot;In Repair&quot; Queue"
            severity="contrast" (onClick)="runWorkOrderStep('StartRepair')" />
          <p-button
            *ngIf="selectedReq()?.workOrder?.status === 'In Repair' || selectedReq()?.workOrder?.status === 'Diagnosed'"
            label="Complete & Dispatch to Institute" (onClick)="runWorkOrderStep('Complete')" />
        </div>
        <p-button label="Cancel Changes" severity="secondary" [outlined]="true" (onClick)="closeTechnicianModal()" />
      </div>
    </ng-template>
  </p-dialog>

</div>
   */
})
export class Test  {

  /*readonly permission = Permission;

  readonly workOrder = signal<WorkOrder | null>(null);
  readonly repairRequests = signal<RepairRequest[]>([]);
  readonly loading = signal(true);

  public institutions: Institution[] = [];
  readonly equipments = signal<Equipment[]>([]);
  readonly inventoryItems = signal<InventoryItem[]>([]);

  // Pagination / lazy-load state (driven entirely by p-table now)
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  public sortField = '';
  public sortOrder = 1;

  // Filter properties bound to the table's header filter row
  public searchTerm = '';
  public selectedPriority = '';
  public selectedStatus = '';
  public selectedCategory = '';
  public selectedInstitutionId = '';

  public readonly priorityOptions = [
    { label: 'Emergency', value: 'Emergency' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'Routine', value: 'Routine' }
  ];

  public readonly statusOptions = [
    { label: 'Submitted (Pending)', value: 'Submitted' },
    { label: 'Acknowledged', value: 'Acknowledged' },
    { label: 'Diagnosed', value: 'Diagnosed' },
    { label: 'In Repair', value: 'In Repair' },
    { label: 'Completed (Ready)', value: 'Completed' },
    { label: 'Verified & Closed', value: 'Verified & Closed' }
  ];

  // Modals
  public showDetailModal = false;
  public showRequestModal = false;
  public showTechnicianModal = false;

  // Selected state
  readonly selectedReq = signal<RepairRequest | null>(null);
  //readonly selectedWO = signal<WorkOrder | null>(null);

  // Submit Request Form State
  public reqEqId = '';
  public reqCompId = '';
  public reqFaultDesc = '';
  public reqPriority: RepairPriority = 'Routine';
  public selectedEqSparePartList: any[] = [];

  // Technician Form Action State
  public diagnosisNotes = '';
  public techInspectedSpareParts: InspectedSparePart[] = [];
  public techPartsUsed: PartUsedDetail[] = [];
  public tempItem!: InventoryItem | null;
  public tempPartQty = 1;

  public readonly lifecycleSteps: WorkOrderStatus[] =
    ['Submitted', 'Acknowledged', 'Diagnosed', 'In Repair', 'Completed', 'Verified & Closed'];

  constructor(
    private queryService: QueryService,
    private upsertService: UpsertService,
    private notify: NotificationService,
    private userFacade: UserFacadeService,) { }

  ngOnInit() {
    this.getEquipment();
    this.getInventoryItem();
    // Initial repair-request load happens via the table's first onLazyLoad emission.
  }

  // ---------------------------------------------------------------------
  // p-table lazy load: ONE handler drives pagination + sorting + filtering
  // ---------------------------------------------------------------------
  public onLazyLoad(event: TableLazyLoadEvent) {
    this.loading.set(true);

    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;

    this.currentPage.set(page);
    this.pageSize.set(rows);
    this.sortField = (event.sortField as string) || '';
    this.sortOrder = event.sortOrder ?? 1;

    this.queryService.getRepairRequest(
      page,
      rows,
      this.searchTerm,
      this.selectedCategory,
      this.selectedStatus,
    ).subscribe({
      next: result => {
        this.repairRequests.set(result.items);
        this.total.set(result.total);
        // this.getWorkOrders(); // keep work-order join in sync with current page
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Called from the header filter inputs (search box, priority/status dropdowns)
  public onFilterChange() {
    this.currentPage.set(1);
    this.onLazyLoad({ first: 0, rows: this.pageSize(), sortField: this.sortField, sortOrder: this.sortOrder });
  }

  public filterItems(event: AutoCompleteCompleteEvent) {
    this.queryService.getInventorytem(
      this.currentPage(), this.pageSize(), event.query, this.selectedCategory, this.selectedStatus,
    ).subscribe(result => {
      this.inventoryItems.set(result.items);
      this.total.set(result.total);
    });
  }

  getInventoryItem() {
    if (this.userFacade.currentSession() == null) return;
    this.queryService.getInventorytem(
      this.currentPage(), this.pageSize(), this.searchTerm, this.selectedCategory, this.selectedStatus,
    ).subscribe(result => this.inventoryItems.set(result.items));
  }

  getEquipment() {
    if (this.userFacade.currentSession() == null) return;
    this.queryService.getEquipment(
      this.currentPage(), this.pageSize(), this.searchTerm, this.selectedCategory,
      this.selectedStatus, this.selectedInstitutionId
    ).subscribe(result => this.equipments.set(result.items));
  }

  // Lifecycle helper for the p-dialog timeline — replaces the long chained
  // *ngClass boolean expressions with one lookup
  public isStepComplete(step: WorkOrderStatus, current: WorkOrderStatus): boolean {
    return this.lifecycleSteps.indexOf(step) <= this.lifecycleSteps.indexOf(current);
  }

  public onEqChange() {
    this.reqCompId = '';
    const eq = this.equipments().find(e => e.id === this.reqEqId);
    this.selectedEqSparePartList = eq ? eq.spareParts : [];
  }

  // Details Dialog
  public openDetails(req: RepairRequest) {
    this.selectedReq.set(req);
    //this.selectedWO.set(this.getWO(req.id) ?? null);
    this.showDetailModal = true;
  }

  public closeDetails() {
    this.showDetailModal = false;
    this.selectedReq.set(null);
    //this.selectedWO.set(null);
  }

  // New Request Submission
  public openRequestModal() {
    this.showRequestModal = true;
    this.reqEqId = '';
    this.reqCompId = '';
    this.reqFaultDesc = '';
    this.reqPriority = 'Routine';
    this.selectedEqSparePartList = [];
  }

  public closeRequestModal() {
    this.showRequestModal = false;
  }

  public submitRequest() {
    if (!this.reqEqId || !this.reqFaultDesc.trim()) {
      this.notify.error('Please select an equipment and describe the fault.', '');
      return;
    }

    const eq = this.equipments().find(e => e.id === this.reqEqId);
    if (eq?.assignedInstitutionId == null) {
      this.notify.error('Equipment not assigned to any institution', 'Please select an equipment that is assigned to an institution.');
      return;
    }
    const submittedByUserId = this.userFacade.currentUser()?.id;
    if (!submittedByUserId) {
      this.notify.error('User Session Expired', 'Try Logging again');
      return;
    }

    this.upsertService.submitRepairRequest(this.reqEqId, this.reqCompId || undefined,
      this.reqFaultDesc, this.reqPriority, submittedByUserId)
      .subscribe({
        next: result => {
          this.getEquipment();
          this.onFilterChange(); // refresh table from page 1
          this.showRequestModal = false;
          this.notify.success('Repair request submitted successfully!', `Your repair request for ${result.repairRequest.equipmentName} has been submitted.`);
        },
        error: err => {
          this.notify.error('Failed to submit repair request', err.message || 'An error occurred while submitting your request. Please try again.');
        }
      });
  }

  // Technician Actions Dialog
  public openTechnicianModal(req: any) {
    this.selectedReq.set(req);
    console.log('req', this.selectedReq())

    this.queryService.getWorkOrder(req.workOrder.id)
      .subscribe(wo => {
        this.workOrder.set(wo);
        if (!wo) return;
        console.log('full work order', wo)
        this.diagnosisNotes = wo.diagnosisNotes || '';

        if (wo.inspectedSpareParts && wo.inspectedSpareParts.length > 0) {
          this.techInspectedSpareParts = [...wo.inspectedSpareParts];
        } else {
          this.techInspectedSpareParts = (req.equipment?.spareParts ?? []).map((c: any) =>
            ({ sparePartId: c.id, sparePartName: c.name, inspected: false, conditionNotes: '' }));
        }

        this.techPartsUsed = [...(wo.partsUsed || [])];
        this.tempItem = null;
        this.tempPartQty = 1;
        this.showTechnicianModal = true;

      });
  }

  public closeTechnicianModal() {
    this.showTechnicianModal = false;
    this.selectedReq.set(null);
    //this.selectedWO.set(null);
  }

  public addPartToBuffer() {
    if (this.tempItem === null) return;

    if (this.tempItem.currentStock < this.tempPartQty) {
      this.notify.error(`Insufficient stock!`, `Available in PDHS store: ${this.tempItem.currentStock} units`);
      return;
    }

    const existing = this.techPartsUsed.find(p => p.inventoryItemId === this.tempItem?.id);
    if (existing) {
      existing.quantityUsed += this.tempPartQty;
    } else {
      this.techPartsUsed.push({
        inventoryItemId: this.tempItem.id,
        inventoryItemName: this.tempItem.name,
        quantityUsed: this.tempPartQty,
        unitCost: this.tempItem.costPerUnit
      });
    }

    this.tempItem = null;
    this.tempPartQty = 1;
  }

  public removePartFromBuffer(idx: number) {
    this.techPartsUsed.splice(idx, 1);
  }

  // Technician Workflow transitions
  public runWorkOrderStep(step: 'Acknowledge' | 'Diagnose' | 'StartRepair' | 'Complete') {
    const wo = this.selectedReq()?.workOrder;
    if (!wo) return;

    let nextStatus: WorkOrderStatus = wo.status;
    const payload: Partial<WorkOrder> = {};

    payload.assignedTechnicianId = this.userFacade.currentUser()?.id;
    payload.assignedTechnicianName = this.userFacade.currentUser()?.fullName;

    switch (step) {
      case 'Acknowledge':
        nextStatus = 'Acknowledged';
        break;
      case 'Diagnose':
        if (!this.diagnosisNotes.trim()) {
          this.notify.error('Please input your diagnostic findings first.', '');
          return;
        }
        nextStatus = 'Diagnosed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        break;
      case 'StartRepair':
        nextStatus = 'In Repair';
        break;
      case 'Complete':
        nextStatus = 'Completed';
        payload.diagnosisNotes = this.diagnosisNotes;
        payload.inspectedSpareParts = this.techInspectedSpareParts;
        payload.partsUsed = this.techPartsUsed;
        break;
    }
    console.log('collected data', payload)
    this.upsertService.updateWorkOrderStatus(wo.id, nextStatus, payload)
      .subscribe(result => {
        this.onFilterChange();
        this.notify.success('Status Updated', result.status);
        this.closeTechnicianModal();
      });
  }

  // Supervisor Verify and Close
  public verifyAndCloseWorkOrder(woId: string) {
    if (confirm('Are you sure you have verified this repair work and want to close the work order? This will permanently archive the ticket.')) {
      this.upsertService.updateWorkOrderStatus(woId, 'Verified & Closed', {})
        .subscribe(() => {
          this.onFilterChange();
          this.closeDetails();
        });
    }
  }

  // Role permission helpers
  public isTechnician(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.BIOMEDICAL_TECHNICIAN, RoleType.SUPER_ADMIN_PDHS]);
  }

  public isSupervisor(): boolean {
    if (!this.userFacade.currentUser()) return false;
    return this.userFacade.hasAnyRole([RoleType.ADMIN_PDHS, RoleType.SUPER_ADMIN_PDHS]);
  }

  // PrimeNG p-tag severity mapping — replaces hand-written class strings
  public getStatusSeverity(status: WorkOrderStatus): 'warn' | 'info' | 'secondary' | 'contrast' | 'success' {
    switch (status) {
      case 'Submitted': return 'warn';
      case 'Acknowledged': return 'info';
      case 'Diagnosed': return 'contrast';
      case 'In Repair': return 'info';
      case 'Completed': return 'success';
      case 'Verified & Closed': return 'secondary';
      default: return 'secondary';
    }
  }

  public getPrioritySeverity(p: RepairPriority): 'danger' | 'warn' | 'secondary' {
    switch (p) {
      case 'Emergency': return 'danger';
      case 'Urgent': return 'warn';
      case 'Routine': return 'secondary';
      default: return 'secondary';
    }
  }

  public getInstitutionName(id: string): string {
    return this.institutions.find(i => i.id === id)?.name || id;
  }*/
}
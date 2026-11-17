import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import {
  Equipment,
  EquipmentAssignment,
  EscalateToVendorDto,
  Institution,
  RepairPriority,
  RepairRequest,
  Supplier,
  VendorCompletedDto,
  WorkOrder,
  WorkOrderChainResult,
  WorkOrderStatus,
} from '../models/biomed.interface';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UpsertService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
  ) {}

  escalateToVendor(workOrderId: string, dto: EscalateToVendorDto) {
    return this.updateWorkOrderStatus(
      workOrderId,
      'ESCALATED_TO_VENDOR' as WorkOrderStatus,
      dto as any,
    );
  }

  markVendorCompleted(workOrderId: string, dto: VendorCompletedDto) {
    return this.updateWorkOrderStatus(
      workOrderId,
      'VENDOR_COMPLETED' as WorkOrderStatus,
      dto as any,
    );
  }

  public upsertEquipment(eq: Omit<Equipment, 'id'>): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/equipment/add`, eq).pipe(
      tap((newEquipment) => {
        // Optimistically update the list? We'll refetch for simpli
        this.logAudit(
          'CREATE',
          'Equipment',
          newEquipment.id,
          `Registered new equipment: ${newEquipment.name} (${newEquipment.serialNumber})`,
        );
      }),
    );
  }

  public updateEquipment(eq: Equipment): Observable<Equipment> {
    console.log('update equipment ', eq);
    return this.http.put<Equipment>(`${this.baseUrl}/equipment/update/${eq.id}`, eq).pipe(
      tap((updatedEquipment) => {
        this.logAudit(
          'UPDATE',
          'Equipment',
          updatedEquipment.id,
          `Updated equipment specs/status for: ${updatedEquipment.name}`,
        );
      }),
    );
  }

  // Equipment Assign Workflow
  public assignEquipment(
    eqId: string,
    toInstitutionId: string,
    toEntity: 'RDHS' | 'Institution',
    quantity: number,
    destName: string,
  ): Observable<EquipmentAssignment> {
    const body = { toInstitutionId, toEntity, quantity };
    return this.http
      .post<EquipmentAssignment>(`${this.baseUrl}/equipment/${eqId}/assign`, body)
      .pipe(
        tap((assignment) => {
          this.logAudit(
            'CREATE',
            'EquipmentAssignment',
            assignment.id,
            `Assigned equipment to ${destName}`,
          );
        }),
      );
  }

  // Repair Request Operations
  public submitRepairRequest(
    eqId: string,
    componentId: string | undefined,
    faultDescription: string,
    priority: RepairPriority,
    submittedByUserId: string,
  ): Observable<{ repairRequest: RepairRequest; workOrder: WorkOrder }> {
    const body = { equipmentId: eqId, componentId, faultDescription, priority, submittedByUserId };
    console.log('sent body', body);
    return this.http
      .post<{
        repairRequest: RepairRequest;
        workOrder: WorkOrder;
      }>(`${this.baseUrl}/repair-requests`, body)
      .pipe(
        tap((result) => {
          this.logAudit(
            'CREATE',
            'RepairRequest',
            result.repairRequest.id,
            `Submitted repair request for ${result.repairRequest.equipmentName}. Status: Submitted.`,
          );
        }),
      );
  }

  public updateWorkOrderStatus(
    woId: string,
    nextStatus: WorkOrderStatus,
    payload?: Partial<WorkOrder>,
  ): Observable<WorkOrder> {
    const body = { status: nextStatus, payload };
    return this.http.put<WorkOrder>(`${this.baseUrl}/work-orders/${woId}/status`, body).pipe(
      tap((updatedWorkOrder) => {
        this.logAudit('UPDATE', 'WorkOrder', woId, `Changed work order status to ${nextStatus}.`);
      }),
    );
  }

  // ── Post-repair chain: feedback → payment → MS → RDHS → PDHD ──────
  // Backend responds with { workOrderId, status, updated } (same shape
  // as the verify/close endpoint).

  submitRepairFeedback(
    workOrderId: string,
    approved: boolean,
    comment?: string,
  ): Observable<WorkOrderChainResult> {
    return this.http
      .put<WorkOrderChainResult>(`${this.baseUrl}/work-orders/${workOrderId}/feedback`, {
        approved,
        comment,
      })
      .pipe(
        tap(() => {
          this.logAudit(
            'UPDATE',
            'WorkOrder',
            workOrderId,
            approved
              ? 'Repair review approved — moving to payment.'
              : 'Repair review rejected — returned for rework.',
          );
        }),
      );
  }

  recordRepairPayment(workOrderId: string, comment?: string): Observable<WorkOrderChainResult> {
    return this.http
      .put<WorkOrderChainResult>(`${this.baseUrl}/work-orders/${workOrderId}/payment`, { comment })
      .pipe(
        tap(() => {
          this.logAudit(
            'UPDATE',
            'WorkOrder',
            workOrderId,
            'Payment recorded — awaiting MS approval.',
          );
        }),
      );
  }

  approveRepairStage(
    workOrderId: string,
    stage: 'MS' | 'RDHS' | 'PDHS',
    comment?: string,
  ): Observable<WorkOrderChainResult> {
    return this.http
      .put<WorkOrderChainResult>(`${this.baseUrl}/work-orders/${workOrderId}/approve`, {
        stage,
        comment,
      })
      .pipe(
        tap(() => {
          this.logAudit('UPDATE', 'WorkOrder', workOrderId, `${stage} approval recorded.`);
        }),
      );
  }

  createSupplier(payload: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/supplier`, payload).pipe(
      tap((newSupplier) => {
        this.logAudit(
          'CREATE',
          'Supplier',
          newSupplier.id,
          `Created supplier: ${newSupplier.name}`,
        );
      }),
    );
  }

  updateSupplier(supplierId: string, payload: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/supplier/${supplierId}`, payload).pipe(
      tap((updatedSupplier) => {
        this.logAudit(
          'UPDATE',
          'Supplier',
          supplierId,
          `Updated supplier: ${updatedSupplier.name}`,
        );
      }),
    );
  }

  deleteSupplier(supplierId: string): Observable<Supplier> {
    return this.http.delete<Supplier>(`${this.baseUrl}/supplier/${supplierId}`).pipe(
      tap(() => {
        this.logAudit('DELETE', 'Supplier', supplierId, `Deleted supplier: ${supplierId}`);
      }),
    );
  }

  createInstitution(payload: Partial<Institution>): Observable<Institution> {
    return this.http.post<Institution>(`${this.baseUrl}/institutions`, payload).pipe(
      tap((newInst) => {
        this.notify.success(
          'Institution created',
          `Institution "${newInst.name}" created successfully`,
        );
      }),
    );
  }

  updateInstitution(id: string, payload: Partial<Institution>): Observable<Institution> {
    return this.http.put<Institution>(`${this.baseUrl}/institutions/${id}`, payload).pipe(
      tap((updated) => {
        this.notify.success(
          'Institution updated',
          `Institution "${updated.name}" updated successfully`,
        );
      }),
    );
  }

  deleteInstitution(id: string): Observable<Institution> {
    return this.http.delete<Institution>(`${this.baseUrl}/institutions/${id}`).pipe(
      tap(() => {
        this.notify.success('Institution removed', 'Institution removed/deactivated successfully');
      }),
    );
  }

  public logAudit(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityName: string,
    recordId: string,
    description: string,
  ): void {
    // In a real app, you might send this to the backend via an endpoint.
    // For now, we'll just log to console and not update the auditLogsSubject directly.
    console.log('Audit Log:', { action, entityName, recordId, description });
    // Optionally, you could refetch audit logs after a delay to get the latest from backend.
    // setTimeout(() => this.fetchAuditLogs(), 1000);
  }
}

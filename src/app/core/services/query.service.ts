import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { District, Equipment, Institution, InventoryItem, PagedResult, RepairRequest, WorkOrder, AuditLog } from '../models/biomed.interface';
import { UserFacadeService } from './user-facade.service';
import { OrganizationTreeNode } from '../../layout/organization-chart/organization-tree-node';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class QueryService {

  private baseUrl = environment.apiUrl

  constructor(
    public userApi: UserFacadeService,
    private http: HttpClient) { }

  getUrgentRepairs() {
    return this.http.get<any>(`${this.baseUrl}/dashboard/urgent-repairs`);
  }
  getCategoryDistribution() {
    return this.http.get<any>(`${this.baseUrl}/dashboard/category-distribution`);
  }
  getSummary() {
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`);
  }

  getDistrtcs() {
    return this.http.get<District[]>(`${this.baseUrl}/districts`,);
  }

  getInstitute(
    page: number,
    size: number,
    search?: string,
    districtId?: string,) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params = params.set('search', search);
    }

    if (districtId) {
      params = params.set('districtId', districtId);
    }
    return this.http.get<PagedResult<Institution>>(`${this.baseUrl}/institute`, { params });
  }

  getEquipment(
    page: number,
    size: number,
    search?: string,
    category?: string,
    status?: string,
    assignedInstitutionId?: string) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params =
        params.set('search', search);
    }

    if (status) {
      params =
        params.set('status', status);
    }
    if (category) {
      params =
        params.set('category', category);
    }

    if (assignedInstitutionId) {
      params =
        params.set(
          'assignedInstitutionId',
          assignedInstitutionId
        );
    }
    return this.http.get<PagedResult<Equipment>>(`${this.baseUrl}/equipment`,
      { params });
  }

  getRepairRequest(
    page: number,
    size: number,
    search?: string,
    priority?: string,
    status?: string,) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params =
        params.set('search', search);
    }

    if (status) {
      params =
        params.set('status', status);
    }
    if (priority) {
      params =
        params.set('priority', priority);
    }
    return this.http.get<PagedResult<RepairRequest>>(`${this.baseUrl}/repair-requests`,
      { params });
  }

  getWorkOrder(repairRequestId?: string,) {
    return this.http.get<WorkOrder>(`${this.baseUrl}/work-order/${repairRequestId}`,);
  }

  getWorkOrders(
    page: number,
    size: number,
    search?: string,
    repairRequestId?: string,
    status?: string,) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params =
        params.set('search', search);
    }

    if (status) {
      params =
        params.set('status', status);
    }
    if (repairRequestId) {
      params =
        params.set('repairRequestId', repairRequestId);
    }
    return this.http.get<PagedResult<WorkOrder>>(`${this.baseUrl}/work-order`,
      { params });
  }
  getInventorytem(page: number,
    size: number,
    search?: string,
    name?: string,
    category?: string,) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params =
        params.set('search', search);
    }

    if (name) {
      params =
        params.set('name', name);
    }
    if (category) {
      params =
        params.set('category', category);
    }
    return this.http.get<PagedResult<InventoryItem>>(`${this.baseUrl}/inventory-items`,
      { params });
  }

  getOrganizationTree() {

    return this.http.get<OrganizationTreeNode>(
      `${this.baseUrl}/dashboard/organization-tree`
    );
  }

  /**
   * Fetch paginated completed repair requests for a specific equipment.
   * The backend filters by equipmentId and returns requests whose
   * linked work orders have a terminal status (Completed / Verified & Closed).
   */
  getEquipmentRepairHistory(
    equipmentId: string,
    page: number = 1,
    size: number = 10,
    status?: string
  ) {
    let params = new HttpParams()
      .set('equipmentId', equipmentId)
      .set('page', page)
      .set('size', size);

    if (status) {
      params = params.set('status', status);
    }
    console.log('sent to back end for history equipmentid ', equipmentId)
    return this.http.get<PagedResult<RepairRequest>>(
      `${this.baseUrl}/repair-history`,
      { params }
    );
  }

  getAuditLogs(page: number, size: number, search: string,
    selectedAction: string,
    from: string | undefined,
    to: string | undefined) {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search) {
      params = params.set('search', search);
    }

    if (selectedAction) {
      params = params.set('selectedAction', selectedAction);
    }
    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }
    return this.http.get<PagedResult<AuditLog>>(`${this.baseUrl}/audit`,
      { params });
  }
}
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { District, Equipment, Institution, InventoryItem, PagedResult, RepairRequest, WorkOrder } from '../models/biomed.interface';
import { UserFacadeService } from './user-facade.service';
import { OrganizationTreeNode } from '../../layout/organization.chart/organiization.tree.node';
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
    return this.http.get<District[]>(`${this.baseUrl}/districts`,
    );
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
      params =
        params.set('search', search);
    }

    if (districtId) {
      params =
        params.set(
          'districtId',
          districtId
        );
    }
    console.log('Query institute ', this.userApi.currentSession())
    return this.http.get<PagedResult<Institution>>(`${this.baseUrl}/institute`,
      { params });
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
    console.log('params sent', page, size, search, status, category, assignedInstitutionId)
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


    console.log('params sent', page, size, search, status, priority)
    return this.http.get<PagedResult<RepairRequest>>(`${this.baseUrl}/repair-requests`,
      { params });
  }

  getWorkOrder(
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


    console.log('get word order params sent', page, size, search, status, repairRequestId)
    return this.http.get<PagedResult<WorkOrder>>(`${this.baseUrl}/work-orders`,
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
}
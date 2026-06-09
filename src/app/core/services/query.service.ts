import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Equipment, Institution, PagedResult } from '../models/biomed.interface';
import { UserFacadeService } from './user-facade.service';


@Injectable({
  providedIn: 'root',
})
export class QueryService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(
    public userApi: UserFacadeService,
    private http: HttpClient) { }

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

}
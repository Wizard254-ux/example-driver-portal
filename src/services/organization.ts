
import api from './api';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  website: string;
  email_domain: string;
  is_active: boolean;
  organization:any;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  website?: string;
  email_domain?: string;
}



export const organizationService = {
  async getOrganization(id: number): Promise<Organization> {
    const response = await api.get(`/api/auth/organization-admin-profiles/${id}/`);
    return response.data;
  },

  async updateOrganization(id: number, data: UpdateOrganizationData): Promise<Organization> {
    const response = await api.patch(`/api/auth/organization-admin-profiles/${id}/`, data);
    return response.data;
  },
  async getDriverSummary(): Promise<any> {
    const response = await api.get(`/api/dashboard/organization/drivers-overview/`);
    console.log('data of summary is ',response)
    return response.data;
  },
  async getDriverInfo(id:string): Promise<any> {
    const response = await api.get(`/api/dashboard/organization/drivers/${id}/`);
    console.log('data driver of summary is ',response)
    return response.data;
  }
};

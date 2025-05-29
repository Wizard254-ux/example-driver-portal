
import api from './api';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string;
  website: string;
  email_domain: string;
  is_active: boolean;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  website?: string;
  email_domain?: string;
}

export const organizationService = {
  async getOrganization(id: number): Promise<Organization> {
    const response = await api.get(`/organization/${id}/`);
    return response.data;
  },

  async updateOrganization(id: number, data: UpdateOrganizationData): Promise<Organization> {
    const response = await api.patch(`/organization/${id}/`, data);
    return response.data;
  }
};

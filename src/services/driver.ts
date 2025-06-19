
import api from './api';

export interface CreateDriverData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string;
  license_expiry: string;
  years_of_experience: number;
  vehicle_type: string;
  bio?: string;
}

export interface UpdateDriverData {
  years_of_experience?: number;
  vehicle_type?: string;
  license_expiry?: string;
  bio?: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website: string;
  email_domain: string;
  is_active: boolean;
}

export interface DriverProfile {
  id: number;
  user: {
    id: number;
    masked_email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    is_active: boolean;
    is_email_verified: boolean;
    masked_phone_number: string;
    profile_picture: string | null;
    date_joined: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };
  organization: Organization;
  bio: string | null;
  avatar: string | null;
  license_number: string;
  license_expiry: string;
  years_of_experience: number;
  vehicle_type: string;
  is_active: boolean;
}

export interface DriversListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DriverProfile[];
}

export const driverService = {
  async createDriver(data: CreateDriverData): Promise<DriverProfile> {
    const response = await api.post('/api/auth/driver-profiles/register/', data);
    return response.data;
  },

  async getDrivers(): Promise<DriversListResponse> {
    const response = await api.get('/api/auth/driver-profiles/fetch/');
    return response.data;
  },

  async getDriver(id: number): Promise<DriverProfile> {
    const response = await api.get(`/api/auth/driver-profiles/${id}`);
    return response.data;
  },

  async updateDriver(id: number, data: UpdateDriverData): Promise<DriverProfile> {
    const response = await api.patch(`/api/auth/driver-profiles/${id}/`, data);
    return response.data;
  },

  async deleteDriver(id: number): Promise<void> {
    await api.delete(`/api/auth/driver-profiles/${id}/delete/`);
  }
};

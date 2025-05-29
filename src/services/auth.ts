
import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  organization_name: string;
  organization_email_domain: string;
  organization_website: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface User {
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
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', data);
    const { tokens, user } = response.data;
    
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
};

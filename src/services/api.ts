import axios from 'axios';

/**
 * Main API client configuration for FreightFusion backend
 * Handles authentication, token refresh, and error management
 */
const api = axios.create({
  baseURL: 'http://localhost:8000', // Backend API base URL
  timeout: 10000000, // 10 second timeout for requests
  withCredentials: true // Include cookies for CSRF protection
});

/**
 * Request interceptor: Automatically adds JWT token to all requests
 * Retrieves token from localStorage and adds to Authorization header
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handles token refresh and authentication errors
 * - Automatically refreshes expired tokens
 * - Redirects to login on authentication failure
 * - Retries original request after token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details for debugging
    if (error.response) {
      console.log('API Error Response:', error.response.data);
    }
    console.log('API Error:', error);
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite retry loops
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Attempt to refresh the access token
          const response = await axios.post('/api/auth/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry the original request with new token
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

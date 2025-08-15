
import axios from 'axios';

// Determine the base URL based on the environment
const getBaseURL = () => {
  // Check if we want to force direct connection (useful for debugging)
  if (import.meta.env.VITE_USE_DIRECT_API === 'true') {
    return 'https://a23db48ead06.ngrok-free.app';
  }
  
  // In development, use relative URLs so Vite proxy handles the routing
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, use your ngrok backend URL
  return 'https://a23db48ead06.ngrok-free.app';
};

// Create axios instance with environment-aware baseURL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000000,
  withCredentials: true // Re-enabled since proxy handles CORS
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always add ngrok header when connecting to ngrok URLs
    if (config.baseURL?.includes('ngrok') || config.url?.includes('ngrok')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if(error.response){
      console.log(error.resonse, error.response.data);
    }
    console.log(error)
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          return api(originalRequest);
        } catch (refreshError) {
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

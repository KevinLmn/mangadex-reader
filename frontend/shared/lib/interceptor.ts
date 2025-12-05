import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const isBrowser = typeof window !== 'undefined';

const getToken = () => (isBrowser ? localStorage.getItem('authToken') : null);
const removeToken = () => isBrowser && localStorage.removeItem('authToken');

/**
 * Create axios instance with interceptor logic
 */
const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach token on request
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Handle 401 errors - clear token and reject
  instance.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        removeToken();
        // Redirect to login if in browser
        if (isBrowser && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012';
const api = createAxiosInstance(`${baseUrl}/api`);
export default api;

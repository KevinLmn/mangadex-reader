import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Refresh the access token from backend
 */
const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post<{ token: string }>(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`
    );
    const newToken = response.data.token;

    if (newToken) {
      localStorage.setItem('authToken', newToken);
      return newToken;
    } else {
      throw new Error('No token returned from refresh');
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
    throw err;
  }
};

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
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Handle 401 errors and try refresh
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (err) {
          localStorage.removeItem('authToken');
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAxiosInstance(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012');
export default api;

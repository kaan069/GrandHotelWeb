/**
 * Axios Yapılandırması
 *
 * API istekleri için merkezi Axios instance'ı.
 * Base URL, timeout, interceptor'lar burada tanımlanır.
 *
 * Özellikler:
 *   - Otomatik JWT token ekleme (request interceptor)
 *   - 401'de otomatik token refresh (response interceptor)
 *   - Refresh başarısızsa logout
 */

import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor — her istekte token ve hotel ID ekler
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('grandhotel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const hotelId = localStorage.getItem('grandhotel_hotel_id');
    if (hotelId) {
      config.headers['X-Hotel-Id'] = hotelId;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response Interceptor — 401'de token refresh dener, başarısızsa logout
 */
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as any;
    const errorDetail = (error.response?.data as { detail?: string } | undefined)?.detail || '';
    // Backend süresi dolmuş token için 403 dönebiliyor (DRF default davranışı).
    // Hem 401 hem de "token" mesajlı 403'te refresh denenir.
    const isTokenError =
      status === 401 ||
      (status === 403 && /token|süres/i.test(errorDetail));

    // Token hatası → refresh dene (login endpoint'i hariç)
    if (isTokenError && !originalRequest._retry && !originalRequest.url?.includes('/staff/login')) {
      const refreshToken = localStorage.getItem('grandhotel_refresh_token');

      // Refresh token yoksa veya fake token ise direkt logout
      if (!refreshToken || refreshToken.startsWith('staff-')) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // Zaten refresh yapılıyorsa bekle
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/staff/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh } = response.data;
        localStorage.setItem('grandhotel_token', access);
        localStorage.setItem('grandhotel_refresh_token', refresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

        // Bekleyen istekleri yeni token ile tekrarla
        pendingRequests.forEach((cb) => cb(access));
        pendingRequests = [];

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        clearAuthAndRedirect();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403 && !isTokenError) {
      console.warn('Bu işlem için yetkiniz bulunmuyor.');
    }

    if (status && status >= 500) {
      console.error('Sunucu hatası:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

function clearAuthAndRedirect() {
  localStorage.removeItem('grandhotel_token');
  localStorage.removeItem('grandhotel_refresh_token');
  localStorage.removeItem('grandhotel_user');
  localStorage.removeItem('grandhotel_hotel_id');
  delete api.defaults.headers.common['Authorization'];
  window.location.href = '/login';
}

export default api;

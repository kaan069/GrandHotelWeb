/**
 * Axios Yapılandırması
 *
 * API istekleri için merkezi Axios instance'ı.
 * Base URL, timeout, interceptor'lar burada tanımlanır.
 *
 * Özellikler:
 *   - Otomatik JWT token ekleme (request interceptor)
 *   - 401'de otomatik token refresh (response interceptor, refreshAccessToken)
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
 * Refresh token ile yeni access token alır. Başarısızsa null döner.
 *
 * Aynı anda birden fazla istek (veya WebSocket) token yenilemek isterse hepsi
 * aynı isteği bekler — her biri ayrı refresh atmaz.
 * WebSocket'ler 4401 kapanma kodunda bunu çağırıp yeniden bağlanır.
 */
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('grandhotel_refresh_token');
      if (!refreshToken) return null;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/staff/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('grandhotel_token', data.access);
        localStorage.setItem('grandhotel_refresh_token', data.refresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        return data.access as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Response Interceptor — 401'de token refresh dener, başarısızsa logout
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as any;
    const errorDetail = (error.response?.data as { detail?: string } | undefined)?.detail || '';
    // Backend kimlik hatalarında 401 döner (authenticate_header). Eski sürümler
    // 403 dönebildiği için token mesajlı 403 de token hatası sayılır.
    const isTokenError =
      status === 401 ||
      (status === 403 && /token|süres/i.test(errorDetail));

    // Token hatası → bir kez refresh dene (login endpoint'i hariç)
    if (isTokenError && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/staff/login')) {
      originalRequest._retry = true;
      const access = await refreshAccessToken();
      if (!access) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
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

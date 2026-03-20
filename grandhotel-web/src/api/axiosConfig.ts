/**
 * Axios Yapılandırması
 *
 * API istekleri için merkezi Axios instance'ı.
 * Base URL, timeout, interceptor'lar burada tanımlanır.
 *
 * Özellikler:
 *   - Otomatik token ekleme (request interceptor)
 *   - 401 hatalarında otomatik logout (response interceptor)
 *   - Merkezi hata yönetimi
 *
 * Kullanım:
 *   import api from './axiosConfig';
 *   const response = await api.get('/rooms');
 *   const data = await api.post('/reservations', body);
 */

import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';

/* Axios instance oluştur */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 saniye zaman aşımı
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Her istekte localStorage'dan token alıp header'a ekler.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('grandhotel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * API yanıtlarını merkezi olarak işler.
 *
 * - 401 (Unauthorized): Token geçersiz/süresi dolmuş → Otomatik logout
 * - 403 (Forbidden): Yetki yok → Konsola uyarı
 * - 500+ (Server Error): Sunucu hatası → Konsola hata
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      /* Token geçersiz - kullanıcıyı login sayfasına yönlendir */
      console.warn('Oturum süresi doldu veya geçersiz token.');
      localStorage.removeItem('grandhotel_token');
      localStorage.removeItem('grandhotel_refresh_token');
      localStorage.removeItem('grandhotel_user');
      window.location.href = '/login';
    }

    if (status === 403) {
      console.warn('Bu işlem için yetkiniz bulunmuyor.');
    }

    if (status && status >= 500) {
      console.error('Sunucu hatası:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;

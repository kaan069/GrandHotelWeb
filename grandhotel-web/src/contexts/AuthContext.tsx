/**
 * AuthContext - Kimlik Doğrulama Context'i
 *
 * Kullanıcı oturum bilgilerini uygulama genelinde yönetir.
 * Login, logout ve kullanıcı bilgilerine erişim sağlar.
 *
 * Giriş: Şube Kodu + Personel Numarası + Şifre
 * Backend API: POST /api/staff/login/
 */

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/axiosConfig';
import { staffApi } from '../api/services';
import type { Role } from '../utils/constants';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: Role;          // İlk rol (eski uyumluluk — menü/yetki kontrolü için)
  roles: string[];     // Tüm roller
  enabledModules: string[];  // Otel'in aktif modülleri
  branchCode: string;
  staffNumber: string;
  hotelId: number;
  hotelName: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (branchCode: string, staffNumber: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

/* LocalStorage anahtarları */
const TOKEN_KEY = 'grandhotel_token';
const REFRESH_TOKEN_KEY = 'grandhotel_refresh_token';
const USER_KEY = 'grandhotel_user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** Uygulama ilk açıldığında localStorage'dan oturum bilgisini kontrol eder */
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Giriş — backend API çağrısı */
  const login = useCallback(async (_branchCode: string, staffNumber: string, password: string): Promise<User> => {
    const employee = await staffApi.login({ staffNumber, password });

    /* Birden fazla rol olabilir — ilk rolü ana rol olarak kullan (menü uyumluluğu) */
    const primaryRole = (employee.roles && employee.roles.length > 0
      ? employee.roles[0]
      : 'reception') as Role;

    const userData: User = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: primaryRole,
      roles: employee.roles || [],
      enabledModules: employee.enabledModules || ['base'],
      branchCode: '001',
      staffNumber: employee.staffNumber,
      hotelId: 1,
      hotelName: 'Grand Hotel',
    };

    const token = `staff-${employee.id}-${Date.now()}`;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
    return userData;
  }, []);

  /** Çıkış */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  /** Kullanıcı bilgilerini güncelle */
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev!, ...updatedData };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * ProtectedRoute Bileşeni
 *
 * Kimlik doğrulaması ve yetki kontrolü yapan route koruyucusu.
 * Giriş yapmamış kullanıcıları login sayfasına yönlendirir.
 * Yetkisiz kullanıcıları dashboard'a yönlendirir.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredModule?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles = [], requiredModule }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  /* Auth durumu henüz kontrol ediliyorsa yükleniyor göster */
  if (loading) {
    return <LoadingSpinner fullPage message="Oturum kontrol ediliyor..." />;
  }

  /* Giriş yapmamışsa login sayfasına yönlendir */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* Rol kontrolü */
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  /* Modül kontrolü */
  if (requiredModule && !user?.enabledModules?.includes(requiredModule)) {
    return <Navigate to="/dashboard" replace />;
  }

  /* Yetki kontrolü başarılı - alt route'ları render et */
  return <Outlet />;
};

export default ProtectedRoute;

/**
 * HotelContext — Aktif otel bilgisi
 *
 * Login sonrası otel bilgilerini bir kere çeker, tüm uygulamaya sağlar.
 * Logo, otel adı gibi bilgiler ProfileMenu, HotelInfoSection vb. yerlerde
 * tek kaynaktan okunur. Logo yüklenip güncellendiğinde refreshHotel() ile
 * yeniden fetch edilir.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

import { hotelApi } from '../api/services';
import type { ApiHotel } from '../api/services';
import { AuthContext } from './AuthContext';

interface HotelContextType {
  hotel: ApiHotel | null;
  loading: boolean;
  refreshHotel: () => Promise<void>;
}

const HotelContext = createContext<HotelContextType | null>(null);

interface HotelProviderProps {
  children: ReactNode;
}

export const HotelProvider: React.FC<HotelProviderProps> = ({ children }) => {
  const auth = useContext(AuthContext);
  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHotel = useCallback(async () => {
    if (!auth?.isAuthenticated) {
      setHotel(null);
      return;
    }
    setLoading(true);
    try {
      const data = await hotelApi.get();
      setHotel(data);
    } catch (err) {
      console.error('Otel bilgileri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  return (
    <HotelContext.Provider value={{ hotel, loading, refreshHotel: fetchHotel }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = (): HotelContextType => {
  const ctx = useContext(HotelContext);
  if (!ctx) {
    throw new Error('useHotel yalnızca HotelProvider içinde kullanılabilir');
  }
  return ctx;
};

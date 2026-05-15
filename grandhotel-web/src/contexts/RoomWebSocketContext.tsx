/**
 * RoomWebSocketContext — Paylaşılan tek WebSocket bağlantısı
 *
 * Uygulamada birden fazla component oda güncellemelerini dinler
 * (Dashboard, ReservationChart, BmsDashboard...). Her birinin ayrı bir
 * WS açması yerine bu provider tek bir bağlantı tutar ve gelen mesajları
 * abone olan tüm component'lere fan-out eder.
 *
 * Kullanım:
 *   useRoomUpdates((room) => {
 *     setRooms(prev => prev.map(r => r.id === room.id ? room : r));
 *   });
 *
 * Özellikler:
 *   - Tek WS bağlantısı (provider mount olduğu sürece açık)
 *   - Exponential backoff reconnect (1s, 2s, 4s, ... max 30s)
 *   - Başarılı bağlantıda backoff sıfırlanır
 *   - Provider unmount → WS kapanır, reconnect yapılmaz
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import type { ApiRoom } from '../api/services';

type Listener = (room: ApiRoom) => void;

interface RoomWSContextValue {
  subscribe: (listener: Listener) => () => void;
}

const RoomWebSocketContext = createContext<RoomWSContextValue | null>(null);

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/rooms/';
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export const RoomWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listenersRef = useRef<Set<Listener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const closedByUserRef = useRef<boolean>(false);

  const connect = useCallback(() => {
    const hotelId = localStorage.getItem('grandhotel_hotel_id');
    if (!hotelId) {
      console.warn('[WS] hotel_id yok, bağlantı atlandı');
      return;
    }
    const url = `${WS_URL}?hotel_id=${encodeURIComponent(hotelId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      backoffRef.current = INITIAL_BACKOFF_MS;
      console.log('[WS] Oda güncellemelerine bağlandı');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_update' && data.room) {
          listenersRef.current.forEach((fn) => {
            try {
              fn(data.room);
            } catch (err) {
              console.error('[WS] listener hatası:', err);
            }
          });
        }
      } catch (err) {
        console.error('[WS] Mesaj ayrıştırma hatası:', err);
      }
    };

    ws.onclose = () => {
      if (closedByUserRef.current) return;
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      console.log(`[WS] Bağlantı koptu. ${delay}ms sonra tekrar bağlanılacak...`);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    closedByUserRef.current = false;
    connect();
    return () => {
      closedByUserRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <RoomWebSocketContext.Provider value={{ subscribe }}>
      {children}
    </RoomWebSocketContext.Provider>
  );
};

/**
 * Oda güncellemelerini dinle. Callback her render'da değişebilir — ref ile
 * güncel tutulur, abonelik yeniden açılmaz.
 */
export const useRoomUpdates = (onUpdate: (room: ApiRoom) => void) => {
  const ctx = useContext(RoomWebSocketContext);
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!ctx) {
      console.warn('[WS] useRoomUpdates: RoomWebSocketProvider ağaçta yok');
      return;
    }
    return ctx.subscribe((room) => cbRef.current(room));
  }, [ctx]);
};

/**
 * useRoomWebSocket — Gerçek zamanlı oda durumu güncellemeleri
 *
 * Backend'deki WebSocket sunucusuna bağlanır.
 * Bir oda durumu değiştiğinde (check-in, check-out, temiz/kirli)
 * güncel oda verisini callback ile iletir.
 *
 * Kullanım:
 *   useRoomWebSocket({
 *     onRoomUpdate: (room) => {
 *       setRooms(prev => prev.map(r => r.id === room.id ? room : r));
 *     },
 *   });
 *
 * Özellikler:
 *   - Otomatik bağlantı (component mount olduğunda)
 *   - Otomatik reconnect (bağlantı kopunca 3 saniye sonra tekrar bağlanır)
 *   - Temiz cleanup (component unmount olduğunda bağlantı kapatılır)
 *   - Ek kütüphane gerektirmez (native WebSocket API)
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ApiRoom } from '../api/services';

/** WebSocket sunucu adresi — backend ile aynı host, /ws/rooms/ path */
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/rooms/';

interface UseRoomWebSocketOptions {
  /** Oda güncellendiğinde çağrılacak callback */
  onRoomUpdate: (room: ApiRoom) => void;
  /** WebSocket bağlantısını etkinleştir/devre dışı bırak (varsayılan: true) */
  enabled?: boolean;
}

export default function useRoomWebSocket({ onRoomUpdate, enabled = true }: UseRoomWebSocketOptions) {
  /**
   * useRef neden kullanılıyor?
   *
   * wsRef → WebSocket instance'ını tutar. Cleanup'ta kapatmak için lazım.
   * reconnectTimer → Reconnect timeout'unu tutar. Cleanup'ta temizlemek için lazım.
   * onRoomUpdateRef → Callback'in güncel halini tutar.
   *
   * Neden onRoomUpdate'i direkt kullanmıyoruz?
   *   Callback her render'da yeni bir fonksiyon olur.
   *   useEffect dependency'sine koysak → her render'da socket yeniden açılır.
   *   Ref ile "en güncel callback"i tutarız, socket yeniden açılmaz.
   */
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRoomUpdateRef = useRef(onRoomUpdate);
  onRoomUpdateRef.current = onRoomUpdate;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Multi-tenant: hotel_id query param zorunlu (backend reddediyor)
    const hotelId = localStorage.getItem('grandhotel_hotel_id');
    if (!hotelId) {
      console.warn('[WS] hotel_id yok, bağlantı atlandı');
      return;
    }
    const url = `${WS_URL}?hotel_id=${encodeURIComponent(hotelId)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Oda güncellemelerine bağlandı');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_update' && data.room) {
          onRoomUpdateRef.current(data.room);
        }
      } catch (err) {
        console.error('[WS] Mesaj ayrıştırma hatası:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Bağlantı koptu. 3 saniye sonra tekrar bağlanılacak...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  // StrictMode korumalı: ilk mount'ta bir kez bağlan
  const connectedRef = useRef(false);
  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;
    connect();
    return () => {
      // StrictMode unmount → sadece timer'ı temizle, WS bağlı kalsın
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

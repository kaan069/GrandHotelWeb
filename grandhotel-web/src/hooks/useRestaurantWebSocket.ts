/**
 * useRestaurantWebSocket — Restoran gerçek zamanlı güncellemeleri
 *
 * Backend'deki ws://localhost:8000/ws/restaurant/ adresine bağlanır.
 * Yeni sipariş, sipariş durumu, masa ve kasa güncellemelerini dinler.
 *
 * Kullanım:
 *   useRestaurantWebSocket({
 *     onNewOrder: (order) => { ... },        // KDS: yeni sipariş geldi
 *     onOrderStatusUpdate: (order) => { ... }, // sipariş durumu değişti
 *     onTableUpdate: (table) => { ... },      // masa durumu değişti
 *     onCashierUpdate: (data) => { ... },     // kasa hareketi
 *     groups: ['kitchen', 'tables'],          // sadece belirli gruplar (opsiyonel)
 *   });
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ApiOrderItemStatus, ApiTable } from '../api/services';

const WS_BASE = process.env.REACT_APP_WS_URL_RESTAURANT || 'ws://localhost:8000/ws/restaurant/';

interface UseRestaurantWebSocketOptions {
  onNewOrder?: (order: ApiOrderItemStatus) => void;
  onOrderStatusUpdate?: (order: ApiOrderItemStatus) => void;
  onTableUpdate?: (table: ApiTable) => void;
  onCashierUpdate?: (data: Record<string, unknown>) => void;
  /** Hangi gruplara katılınacak: 'kitchen', 'tables', 'cashier' */
  groups?: string[];
  enabled?: boolean;
}

export default function useRestaurantWebSocket({
  onNewOrder,
  onOrderStatusUpdate,
  onTableUpdate,
  onCashierUpdate,
  groups,
  enabled = true,
}: UseRestaurantWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNewOrderRef = useRef(onNewOrder);
  const onOrderStatusUpdateRef = useRef(onOrderStatusUpdate);
  const onTableUpdateRef = useRef(onTableUpdate);
  const onCashierUpdateRef = useRef(onCashierUpdate);

  onNewOrderRef.current = onNewOrder;
  onOrderStatusUpdateRef.current = onOrderStatusUpdate;
  onTableUpdateRef.current = onTableUpdate;
  onCashierUpdateRef.current = onCashierUpdate;

  const connect = useCallback(() => {
    if (!enabled) return;

    let url = WS_BASE;
    if (groups && groups.length > 0) {
      url += `?groups=${groups.join(',')}`;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS Restaurant] Bağlandı');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'new_order':
            onNewOrderRef.current?.(data.order);
            break;
          case 'order_status_update':
            onOrderStatusUpdateRef.current?.(data.order);
            break;
          case 'table_update':
            onTableUpdateRef.current?.(data.table);
            break;
          case 'cashier_update':
            onCashierUpdateRef.current?.(data.data);
            break;
        }
      } catch (err) {
        console.error('[WS Restaurant] Mesaj hatası:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS Restaurant] Bağlantı koptu. 3s sonra tekrar...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled, groups]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}

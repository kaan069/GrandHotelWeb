/**
 * CustomerDisplay — Müşteri Ekranı (Kasa Arkası 2. Monitör)
 *
 * URL: /kasa/display/:tableId
 * Auth yok, layout yok — tam ekran, koyu arka plan, büyük fontlar.
 * WebSocket ile anlık güncellenir.
 * Ödeme yapılınca "Teşekkürler" mesajı → 5sn sonra boş ekran.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Divider } from '@mui/material';
import { tablesApi } from '../../api/services';
import type { ApiTable } from '../../api/services';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';

const CustomerDisplay: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [table, setTable] = useState<ApiTable | null>(null);
  const [thankYou, setThankYou] = useState(false);

  const fetchTable = useCallback(async () => {
    if (!tableId) return;
    try {
      const data = await tablesApi.getById(Number(tableId));
      setTable(data);

      // Ödeme yapıldıysa (aktif tab yok) → teşekkür ekranı
      if (!data.currentTab || data.status === 'empty') {
        if (table?.currentTab) {
          // Önceden tab vardı ama artık yok → ödeme yapılmış
          setThankYou(true);
          setTimeout(() => { setThankYou(false); setTable(data); }, 5000);
        }
      }
    } catch {
      setTable(null);
    }
  }, [tableId]);

  useEffect(() => { fetchTable(); }, [fetchTable]);

  // WebSocket: masa güncellemelerini dinle
  useRestaurantWebSocket({
    groups: ['tables'],
    onTableUpdate: (updated) => {
      if (String(updated.id) === tableId) {
        // Masa güncellendi — detayı yenile
        fetchTable();
      }
    },
  });

  // 30sn'de bir polling (WebSocket yedek)
  useEffect(() => {
    const timer = setInterval(fetchTable, 30000);
    return () => clearInterval(timer);
  }, [fetchTable]);

  const tab = table?.currentTab;
  const items = tab?.items || [];
  const total = tab ? parseFloat(tab.totalAmount) : 0;

  // Teşekkür ekranı
  if (thankYou) {
    return (
      <Box sx={styles.container}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '4rem', mb: 2 }}>
            ✓
          </Typography>
          <Typography sx={{ fontSize: '3rem', fontWeight: 800, color: '#22c55e', mb: 1 }}>
            Teşekkürler!
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', color: '#94a3b8' }}>
            Afiyet olsun
          </Typography>
        </Box>
      </Box>
    );
  }

  // Boş masa / yükleniyor
  if (!tab || items.length === 0) {
    return (
      <Box sx={styles.container}>
        <Box sx={{ textAlign: 'center' }}>
          {table && (
            <Typography sx={{ fontSize: '2rem', color: '#64748b', mb: 2 }}>
              Masa {table.tableNumber}
            </Typography>
          )}
          <Typography sx={{ fontSize: '1.5rem', color: '#475569' }}>
            Hoş geldiniz
          </Typography>
        </Box>
      </Box>
    );
  }

  // Sipariş detayı
  return (
    <Box sx={styles.container}>
      <Box sx={styles.content}>
        {/* Masa numarası */}
        <Typography sx={styles.tableNumber}>
          Masa {table?.tableNumber}
        </Typography>

        <Divider sx={{ borderColor: '#334155', my: 2 }} />

        {/* Sipariş kalemleri */}
        {items.map((item) => (
          <Box key={item.id} sx={styles.itemRow}>
            <Typography sx={styles.itemQty}>{item.quantity}x</Typography>
            <Typography sx={styles.itemName}>{item.description}</Typography>
            <Typography sx={styles.itemPrice}>
              {parseFloat(item.totalPrice).toFixed(2)} ₺
            </Typography>
          </Box>
        ))}

        <Divider sx={{ borderColor: '#334155', my: 2 }} />

        {/* Toplam */}
        <Box sx={styles.totalRow}>
          <Typography sx={styles.totalLabel}>TOPLAM</Typography>
          <Typography sx={styles.totalValue}>{total.toFixed(2)} ₺</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    bgcolor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 4,
  },
  content: {
    width: '100%',
    maxWidth: 600,
  },
  tableNumber: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    py: 1.5,
    gap: 2,
  },
  itemQty: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#94a3b8',
    minWidth: 60,
  },
  itemName: {
    fontSize: '1.8rem',
    fontWeight: 500,
    color: '#e2e8f0',
    flex: 1,
  },
  itemPrice: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#38bdf8',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mt: 1,
  },
  totalLabel: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#94a3b8',
  },
  totalValue: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#22c55e',
  },
};

export default CustomerDisplay;

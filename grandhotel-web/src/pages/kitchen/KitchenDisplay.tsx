/**
 * Mutfak Ekranı (KDS — Kitchen Display System)
 *
 * Aşçı hesabında açılan tam ekran sipariş yönetim paneli.
 * Yeni siparişler anında WebSocket ile gelir ve sesli bildirim çalar.
 *
 * Özellikler:
 *   - Gerçek zamanlı sipariş takibi (WebSocket)
 *   - Sesli bildirim (şiddetli, yeni sipariş gelince)
 *   - Renk kodlamalı kartlar (bekliyor, hazırlanıyor, hazır)
 *   - Hizmet alanına göre filtre
 *   - Büyük dokunmatik butonlar (mutfak ekranı optimize)
 *   - Geçen süre göstergesi
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  Typography,
  CircularProgress,
  IconButton,
  Badge,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Check as ReadyIcon,
  VolumeUp as SoundOnIcon,
  VolumeOff as SoundOffIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { kitchenApi, serviceAreasApi } from '../../api/services';
import type { ApiOrderItemStatus, ApiServiceArea } from '../../api/services';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';
import useAudioAlert from '../../hooks/useAudioAlert';

/** Geçen süreyi hesapla */
const getElapsedMinutes = (sentAt: string): number => {
  return Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000);
};

/** Geçen süre rengi */
const getTimeColor = (minutes: number): string => {
  if (minutes > 10) return '#ef4444'; // kırmızı
  if (minutes > 5) return '#f97316';  // turuncu
  return '#22c55e'; // yeşil
};

/** Durum rengi */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#ef4444';
    case 'preparing': return '#f59e0b';
    case 'ready': return '#22c55e';
    case 'served': return '#94a3b8';
    case 'cancelled': return '#64748b';
    default: return '#94a3b8';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Bekliyor';
    case 'preparing': return 'Hazırlanıyor';
    case 'ready': return 'Hazır';
    case 'served': return 'Servis Edildi';
    case 'cancelled': return 'İptal';
    default: return status;
  }
};

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrderItemStatus[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ApiServiceArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // active = pending+preparing+ready
  const [loading, setLoading] = useState(true);
  const { play, enable, isEnabled } = useAudioAlert({ volume: 1.0 });

  // Otomatik yenileme sayacı
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000); // 30sn'de bir geçen süre güncelle
    return () => clearInterval(timer);
  }, []);

  /** Siparişleri yükle */
  const fetchOrders = useCallback(async () => {
    try {
      const filters: { status?: string; serviceAreaId?: number } = {};
      if (statusFilter === 'active') {
        // pending + preparing + ready → hepsini çekip filtrele
      } else {
        filters.status = statusFilter;
      }
      if (selectedArea !== 'all') {
        filters.serviceAreaId = selectedArea;
      }
      const data = await kitchenApi.getOrders(filters);
      if (statusFilter === 'active') {
        setOrders(data.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)));
      } else {
        setOrders(data);
      }
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedArea, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** Hizmet alanlarını yükle */
  useEffect(() => {
    serviceAreasApi.getAll().then(setServiceAreas).catch(console.error);
  }, []);

  /** WebSocket: yeni sipariş ve durum güncellemeleri */
  useRestaurantWebSocket({
    groups: ['kitchen'],
    onNewOrder: (order) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      play(); // Sesli bildirim
    },
    onOrderStatusUpdate: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    },
  });

  /** Hazırlamaya başla */
  const handleStart = async (id: number) => {
    try {
      const updated = await kitchenApi.startPreparing(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      console.error('Başlatma hatası:', err);
    }
  };

  /** Hazır */
  const handleReady = async (id: number) => {
    try {
      const updated = await kitchenApi.markReady(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      console.error('Hazır hatası:', err);
    }
  };

  /** İptal */
  const handleCancel = async (id: number) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      const updated = await kitchenApi.cancelItem(id, 'Mutfak tarafından iptal');
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      console.error('İptal hatası:', err);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mutfak Ekranı"
        subtitle={`${pendingCount} bekliyor · ${preparingCount} hazırlanıyor · ${readyCount} hazır`}
      />

      {/* Kontrol Bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Ses kontrolü */}
        <Button
          variant={isEnabled ? 'contained' : 'outlined'}
          color={isEnabled ? 'success' : 'warning'}
          startIcon={isEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          onClick={enable}
          size="large"
          sx={{ minHeight: 48 }}
        >
          {isEnabled ? 'Ses Açık' : 'Sesi Aç'}
        </Button>

        <IconButton onClick={fetchOrders} size="large">
          <RefreshIcon />
        </IconButton>

        {/* Hizmet alanı filtresi */}
        <Tabs
          value={selectedArea}
          onChange={(_, v) => setSelectedArea(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
        >
          <Tab value="all" label="Tümü" />
          {serviceAreas.filter((a) => a.hasKitchen).map((area) => (
            <Tab key={area.id} value={area.id} label={area.name} />
          ))}
        </Tabs>

        {/* Durum filtresi */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip
            label={`Aktif (${pendingCount + preparingCount + readyCount})`}
            color={statusFilter === 'active' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('active')}
            variant={statusFilter === 'active' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Tümü"
            color={statusFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('all')}
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>

      {/* Sipariş Kartları — Masaya Göre Gruplanmış */}
      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Aktif sipariş yok
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {(() => {
            // Siparişleri masaya/konuma göre grupla
            const grouped = new Map<string, ApiOrderItemStatus[]>();
            orders.forEach((order) => {
              const key = order.tableNumber
                ? `Masa ${order.tableNumber}`
                : order.roomNumber
                  ? `Oda ${order.roomNumber}`
                  : order.guestName || 'Bilinmiyor';
              const list = grouped.get(key) || [];
              list.push(order);
              grouped.set(key, list);
            });

            return Array.from(grouped.entries()).map(([location, items]) => {
              // Grup için en eski sipariş süresini al
              const oldestElapsed = Math.max(...items.map((o) => getElapsedMinutes(o.sentToKitchenAt)));
              // Grup durumu: en acil olanı göster
              const hasPending = items.some((o) => o.status === 'pending');
              const hasPreparing = items.some((o) => o.status === 'preparing');
              const groupColor = hasPending ? '#ef4444' : hasPreparing ? '#f59e0b' : '#22c55e';
              const servicePoint = items[0]?.servicePoint || '';

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={location}>
                  <Card
                    sx={{
                      height: '100%',
                      borderLeft: `6px solid ${groupColor}`,
                      transition: 'all 0.3s',
                    }}
                  >
                    <CardContent sx={{ pb: '12px !important' }}>
                      {/* Üst: Konum + Süre */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {location}
                        </Typography>
                        <Chip
                          icon={<TimeIcon sx={{ fontSize: 14 }} />}
                          label={`${oldestElapsed} dk`}
                          size="small"
                          sx={{ bgcolor: getTimeColor(oldestElapsed), color: 'white', fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {servicePoint} · {items.length} kalem
                      </Typography>

                      {/* Ürün Listesi */}
                      {items.map((order) => {
                        const statusColor = getStatusColor(order.status);
                        return (
                          <Box
                            key={order.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.75,
                              px: 1,
                              mb: 0.5,
                              bgcolor: '#f8fafc',
                              borderRadius: 1,
                              borderLeft: `3px solid ${statusColor}`,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {order.itemQuantity}x {order.itemDescription}
                              </Typography>
                              {order.notes && (
                                <Typography variant="caption" color="error.main" fontWeight={600}>
                                  {order.notes}
                                </Typography>
                              )}
                            </Box>
                            {/* Kalem aksiyonları */}
                            {order.status === 'pending' && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" color="warning" onClick={() => handleStart(order.id)} title="Başla">
                                  <StartIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleCancel(order.id)} title="İptal">
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                            {order.status === 'preparing' && (
                              <IconButton size="small" color="success" onClick={() => handleReady(order.id)} title="Hazır">
                                <ReadyIcon fontSize="small" />
                              </IconButton>
                            )}
                            {order.status === 'ready' && (
                              <Chip label="Hazır" size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />
                            )}
                            {order.status === 'cancelled' && (
                              <Chip label="İptal" size="small" sx={{ bgcolor: '#94a3b8', color: '#fff', fontSize: '0.7rem' }} />
                            )}
                          </Box>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Grid>
              );
            });
          })()}
        </Grid>
      )}
    </div>
  );
};

export default KitchenDisplay;

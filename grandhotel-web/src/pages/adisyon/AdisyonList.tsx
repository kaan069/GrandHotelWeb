/**
 * Adisyon Listesi Sayfası
 *
 * Tüm adisyonları listeler. Filtreler: durum, hizmet noktası, tarih.
 * Satıra tıklayınca detay dialog açılır.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Dayjs } from 'dayjs';

import { PageHeader } from '../../components/common';
import { FilterPanel, DateRangePicker } from '../../components/forms';
import { tabsApi, menuApi, roomsApi } from '../../api/services';
import type { ApiTab, ApiTabItem, ApiMenuItem, ApiRoom } from '../../api/services';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const SERVICE_POINT_LABELS: Record<string, string> = {
  restaurant: 'Restoran',
  bar: 'Bar',
  spa: 'Spa',
  pool: 'Havuz',
  lobby: 'Lobi',
  other: 'Diğer',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  closed: 'Kapalı',
  paid: 'Ödendi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  open: 'warning',
  closed: 'info',
  paid: 'success',
  cancelled: 'error',
};

const AdisyonList: React.FC = () => {
  const [tabs, setTabs] = useState<ApiTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateStart, setDateStart] = useState<Dayjs | null>(null);
  const [dateEnd, setDateEnd] = useState<Dayjs | null>(null);

  /* Detail dialog */
  const [detailTab, setDetailTab] = useState<ApiTab | null>(null);
  const [detailItems, setDetailItems] = useState<ApiTabItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Create dialog */
  const [createOpen, setCreateOpen] = useState(false);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [newTab, setNewTab] = useState({ roomId: '', guestName: '', servicePoint: 'restaurant', notes: '' });

  /* Add item dialog */
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState({ menuItemId: '', description: '', quantity: '1', unitPrice: '' });

  const fetchTabs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;
      if (serviceFilter) filters.servicePoint = serviceFilter;
      if (dateStart) filters.dateFrom = dateStart.format('YYYY-MM-DD');
      if (dateEnd) filters.dateTo = dateEnd.format('YYYY-MM-DD');
      const data = await tabsApi.getAll(filters as any);
      setTabs(data);
    } catch (err) {
      console.error('Adisyonlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, serviceFilter, dateStart, dateEnd]);

  useEffect(() => { fetchTabs(); }, [fetchTabs]);

  /* Detay aç */
  const handleRowClick = async (tab: ApiTab) => {
    setDetailTab(tab);
    setDetailLoading(true);
    try {
      const detail = await tabsApi.getById(tab.id);
      setDetailItems(detail.items || []);
    } catch (err) {
      console.error('Adisyon detay hatası:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  /* Yeni adisyon oluştur */
  const handleCreate = async () => {
    if (!newTab.guestName.trim()) return;
    try {
      await tabsApi.create({
        roomId: newTab.roomId ? Number(newTab.roomId) : undefined,
        guestName: newTab.guestName.trim(),
        servicePoint: newTab.servicePoint,
        notes: newTab.notes,
      });
      setCreateOpen(false);
      setNewTab({ roomId: '', guestName: '', servicePoint: 'restaurant', notes: '' });
      fetchTabs();
    } catch (err) {
      console.error('Adisyon oluşturma hatası:', err);
    }
  };

  /* Create dialog açılınca odalar ve menüyü yükle */
  const openCreateDialog = async () => {
    setCreateOpen(true);
    try {
      const [roomsData, menuData] = await Promise.all([
        roomsApi.getAll(),
        menuApi.getItems(),
      ]);
      setRooms(roomsData);
      setMenuItems(menuData);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    }
  };

  /* Kalem ekle */
  const handleAddItem = async () => {
    if (!detailTab || !addItemForm.unitPrice) return;
    try {
      const menuItem = addItemForm.menuItemId ? menuItems.find((m) => m.id === Number(addItemForm.menuItemId)) : null;
      await tabsApi.addItem(detailTab.id, {
        menuItemId: addItemForm.menuItemId ? Number(addItemForm.menuItemId) : undefined,
        description: addItemForm.description || menuItem?.name || '',
        quantity: Number(addItemForm.quantity) || 1,
        unitPrice: Number(addItemForm.unitPrice),
      });
      setAddItemOpen(false);
      setAddItemForm({ menuItemId: '', description: '', quantity: '1', unitPrice: '' });
      // Refresh detail
      const detail = await tabsApi.getById(detailTab.id);
      setDetailItems(detail.items || []);
      setDetailTab(detail);
      fetchTabs();
    } catch (err) {
      console.error('Kalem ekleme hatası:', err);
    }
  };

  /* Kalem sil */
  const handleRemoveItem = async (itemId: number) => {
    if (!detailTab) return;
    try {
      await tabsApi.removeItem(detailTab.id, itemId);
      const detail = await tabsApi.getById(detailTab.id);
      setDetailItems(detail.items || []);
      setDetailTab(detail);
      fetchTabs();
    } catch (err) {
      console.error('Kalem silme hatası:', err);
    }
  };

  /* Ödeme yap */
  const handlePay = async (method: 'room_charge' | 'cash' | 'card') => {
    if (!detailTab) return;
    try {
      await tabsApi.pay(detailTab.id, method);
      setDetailTab(null);
      fetchTabs();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ödeme hatası');
    }
  };

  /* İptal */
  const handleCancel = async () => {
    if (!detailTab || !window.confirm('Adisyonu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await tabsApi.cancel(detailTab.id);
      setDetailTab(null);
      fetchTabs();
    } catch (err) {
      console.error('İptal hatası:', err);
    }
  };

  /* Menü item seçildiğinde fiyatı doldur */
  const handleMenuItemSelect = (menuItemId: string) => {
    setAddItemForm((p) => ({ ...p, menuItemId }));
    const item = menuItems.find((m) => m.id === Number(menuItemId));
    if (item) {
      setAddItemForm((p) => ({
        ...p,
        menuItemId,
        description: item.name,
        unitPrice: item.price,
      }));
    }
  };

  const filterConfig = [
    {
      id: 'status',
      label: 'Durum',
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      id: 'servicePoint',
      label: 'Hizmet Noktası',
      options: Object.entries(SERVICE_POINT_LABELS).map(([value, label]) => ({ value, label })),
      value: serviceFilter,
      onChange: setServiceFilter,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Adisyonlar"
        subtitle={`${tabs.length} adisyon`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Yeni Adisyon
          </Button>
        }
      />

      {/* Filtreler */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <FilterPanel
          filters={filterConfig}
          onClearAll={() => { setStatusFilter(''); setServiceFilter(''); }}
        />
        <DateRangePicker
          startDate={dateStart}
          endDate={dateEnd}
          onStartChange={setDateStart}
          onEndChange={setDateEnd}
          startLabel="Başlangıç"
          endLabel="Bitiş"
        />
      </Box>

      {/* Tablo */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Adisyon No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Oda</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Misafir</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hizmet Noktası</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Tutar</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Garson</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tabs.map((tab) => (
                <TableRow
                  key={tab.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(tab)}
                >
                  <TableCell>
                    <strong style={{ color: '#1565C0' }}>{tab.tabNo}</strong>
                  </TableCell>
                  <TableCell>{tab.roomNumber || '-'}</TableCell>
                  <TableCell>{tab.guestName || '-'}</TableCell>
                  <TableCell>
                    <Chip label={SERVICE_POINT_LABELS[tab.servicePoint] || tab.servicePoint} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(parseFloat(tab.totalAmount))}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[tab.status] || tab.status}
                      size="small"
                      color={STATUS_COLORS[tab.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{tab.openedByName || '-'}</TableCell>
                  <TableCell>{formatDateTime(tab.openedAt)}</TableCell>
                </TableRow>
              ))}
              {tabs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Adisyon bulunamadı</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Yeni Adisyon Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <ReceiptIcon color="primary" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
          Yeni Adisyon
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Oda (Opsiyonel)"
            value={newTab.roomId}
            onChange={(e) => setNewTab((p) => ({ ...p, roomId: e.target.value }))}
            fullWidth
          >
            <MenuItem value="">Dış Müşteri</MenuItem>
            {rooms.filter((r) => r.status === 'occupied').map((r) => (
              <MenuItem key={r.id} value={String(r.id)}>
                Oda {r.roomNumber} — {r.guestName || 'Misafir'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Misafir Adı"
            value={newTab.guestName}
            onChange={(e) => setNewTab((p) => ({ ...p, guestName: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            select
            label="Hizmet Noktası"
            value={newTab.servicePoint}
            onChange={(e) => setNewTab((p) => ({ ...p, servicePoint: e.target.value }))}
            fullWidth
          >
            {Object.entries(SERVICE_POINT_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Not"
            value={newTab.notes}
            onChange={(e) => setNewTab((p) => ({ ...p, notes: e.target.value }))}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Vazgeç</Button>
          <Button onClick={handleCreate} variant="contained">Adisyon Aç</Button>
        </DialogActions>
      </Dialog>

      {/* Adisyon Detay Dialog */}
      <Dialog open={!!detailTab} onClose={() => setDetailTab(null)} maxWidth="md" fullWidth>
        {detailTab && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  Adisyon {detailTab.tabNo}
                  <Chip
                    label={STATUS_LABELS[detailTab.status]}
                    size="small"
                    color={STATUS_COLORS[detailTab.status]}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {formatCurrency(parseFloat(detailTab.totalAmount))}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {detailTab.guestName} | {detailTab.roomNumber ? `Oda ${detailTab.roomNumber}` : 'Dış Müşteri'} | {SERVICE_POINT_LABELS[detailTab.servicePoint]}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {detailLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Ürün</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Adet</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Birim</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Toplam</TableCell>
                      {detailTab.status === 'open' && <TableCell />}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(item.unitPrice))}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(item.totalPrice))}</TableCell>
                        {detailTab.status === 'open' && (
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {detailItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography color="text.secondary">Henüz kalem yok</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
              {detailTab.status === 'open' && (
                <>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddItemOpen(true); if (menuItems.length === 0) menuApi.getItems().then(setMenuItems); }}>
                    Kalem Ekle
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" color="error" onClick={handleCancel}>İptal Et</Button>
                  <Button size="small" variant="outlined" onClick={() => handlePay('cash')}>Nakit</Button>
                  <Button size="small" variant="outlined" onClick={() => handlePay('card')}>Kart</Button>
                  {detailTab.roomId && (
                    <Button size="small" variant="contained" onClick={() => handlePay('room_charge')}>
                      Odaya Yansıt
                    </Button>
                  )}
                </>
              )}
              {detailTab.status !== 'open' && (
                <Button onClick={() => setDetailTab(null)} color="inherit">Kapat</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Kalem Ekle Dialog */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kalem Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Menüden Seç (Opsiyonel)"
            value={addItemForm.menuItemId}
            onChange={(e) => handleMenuItemSelect(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Serbest Giriş</MenuItem>
            {menuItems.map((m) => (
              <MenuItem key={m.id} value={String(m.id)}>
                {m.name} — {formatCurrency(parseFloat(m.price))}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Açıklama"
            value={addItemForm.description}
            onChange={(e) => setAddItemForm((p) => ({ ...p, description: e.target.value }))}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Adet"
              type="number"
              value={addItemForm.quantity}
              onChange={(e) => setAddItemForm((p) => ({ ...p, quantity: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Birim Fiyat (₺)"
              type="number"
              value={addItemForm.unitPrice}
              onChange={(e) => setAddItemForm((p) => ({ ...p, unitPrice: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemOpen(false)} color="inherit">Vazgeç</Button>
          <Button onClick={handleAddItem} variant="contained">Ekle</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdisyonList;

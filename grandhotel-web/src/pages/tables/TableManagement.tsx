/**
 * Masa Yönetimi Sayfası
 *
 * Restoran/cafe masalarını kart grid düzeninde gösterir.
 * Masa aç/kapat, ürün ekle, ödeme yap, transfer işlemleri.
 *
 * Roller: waiter, restaurant_manager, cashier, patron, manager, barista, barman
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  SwapHoriz as TransferIcon,
  Payment as PayIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { tablesApi, serviceAreasApi, tabsApi, menuApi } from '../../api/services';
import type { ApiTable, ApiServiceArea, ApiTab, ApiMenuItem } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';

const STATUS_COLORS: Record<string, string> = {
  empty: '#22c55e',
  occupied: '#ef4444',
  reserved: '#3b82f6',
  bill_requested: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  reserved: 'Rezerve',
  bill_requested: 'Hesap',
};

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ApiServiceArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  /* Drawer state */
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tableDetail, setTableDetail] = useState<ApiTable | null>(null);

  /* Open table dialog */
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [guestName, setGuestName] = useState('');

  /* Add item dialog */
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  /* Transfer dialog */
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState<number | ''>('');

  /* Masa/Alan oluşturma */
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableAreaId, setNewTableAreaId] = useState<number | ''>('');

  const [createAreaOpen, setCreateAreaOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaType, setNewAreaType] = useState('restaurant');

  /** Masaları yükle */
  const fetchTables = useCallback(async () => {
    try {
      const filters: { serviceAreaId?: number } = {};
      if (selectedArea !== 'all') filters.serviceAreaId = selectedArea;
      const data = await tablesApi.getAll(filters);
      setTables(data);
    } catch (err) {
      console.error('Masalar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  useEffect(() => {
    serviceAreasApi.getAll().then(setServiceAreas).catch(console.error);
  }, []);

  /** WebSocket: masa güncellemeleri */
  useRestaurantWebSocket({
    groups: ['tables'],
    onTableUpdate: (updatedTable) => {
      setTables((prev) =>
        prev.map((t) => (t.id === updatedTable.id ? updatedTable : t))
      );
    },
  });

  /** Masa detayını yükle */
  const openDrawer = async (table: ApiTable) => {
    setSelectedTable(table);
    setDrawerOpen(true);
    try {
      const detail = await tablesApi.getById(table.id);
      setTableDetail(detail);
    } catch {
      setTableDetail(null);
    }
  };

  /** Masa aç */
  const handleOpenTable = async () => {
    if (!selectedTable) return;
    try {
      await tablesApi.open(selectedTable.id, { guestName });
      setOpenDialogVisible(false);
      setGuestName('');
      fetchTables();
      openDrawer(selectedTable);
    } catch (err) {
      console.error('Masa açma hatası:', err);
    }
  };

  /** Masa kapat */
  const handleCloseTable = async () => {
    if (!selectedTable) return;
    try {
      await tablesApi.close(selectedTable.id);
      setDrawerOpen(false);
      fetchTables();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Masa kapatılamadı');
    }
  };

  /** Ürün ekle */
  const handleAddItem = async () => {
    if (!selectedMenuItem || !tableDetail?.currentTab) return;
    const item = menuItems.find((m) => m.id === selectedMenuItem);
    if (!item) return;

    try {
      await tabsApi.addItem(tableDetail.currentTab.id, {
        menuItemId: item.id,
        quantity: itemQuantity,
        unitPrice: parseFloat(item.price),
        notes: itemNotes || undefined,
      });
      setAddItemOpen(false);
      setSelectedMenuItem('');
      setItemQuantity(1);
      setItemNotes('');
      // Detayı yenile
      const detail = await tablesApi.getById(selectedTable!.id);
      setTableDetail(detail);
      fetchTables();
    } catch (err) {
      console.error('Ürün ekleme hatası:', err);
    }
  };

  /** Menü ürünlerini yükle */
  const openAddItem = async () => {
    try {
      const items = await menuApi.getItems();
      setMenuItems(items);
      setAddItemOpen(true);
    } catch (err) {
      console.error('Menü yüklenemedi:', err);
    }
  };

  /** Ödeme */
  const handlePay = async (method: 'cash' | 'card' | 'room_charge') => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.pay(tableDetail.currentTab.id, method);
      setDrawerOpen(false);
      fetchTables();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ödeme hatası');
    }
  };

  /** Transfer */
  const handleTransfer = async () => {
    if (!selectedTable || !targetTableId) return;
    try {
      await tablesApi.transfer(selectedTable.id, targetTableId as number);
      setTransferOpen(false);
      setTargetTableId('');
      setDrawerOpen(false);
      fetchTables();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Transfer hatası');
    }
  };

  /** Yeni masa oluştur */
  const handleCreateTable = async () => {
    if (!newTableNumber || !newTableAreaId) return;
    try {
      await tablesApi.create({ tableNumber: newTableNumber, serviceAreaId: newTableAreaId as number, capacity: newTableCapacity });
      setCreateTableOpen(false);
      setNewTableNumber('');
      setNewTableCapacity(4);
      setNewTableAreaId('');
      fetchTables();
    } catch (err) {
      console.error('Masa oluşturma hatası:', err);
    }
  };

  /** Yeni hizmet alanı oluştur */
  const handleCreateArea = async () => {
    if (!newAreaName) return;
    try {
      await serviceAreasApi.create({ name: newAreaName, areaType: newAreaType });
      setCreateAreaOpen(false);
      setNewAreaName('');
      setNewAreaType('restaurant');
      const areas = await serviceAreasApi.getAll();
      setServiceAreas(areas);
    } catch (err) {
      console.error('Alan oluşturma hatası:', err);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <PageHeader
          title="Masa Yönetimi"
          subtitle={`${tables.filter((t) => t.status === 'empty').length} boş · ${tables.filter((t) => t.status === 'occupied').length} dolu`}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setCreateAreaOpen(true)}>Hizmet Alanı Ekle</Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateTableOpen(true)}>Masa Ekle</Button>
        </Box>
      </Box>

      {/* Alan filtresi */}
      <Tabs
        value={selectedArea}
        onChange={(_, v) => setSelectedArea(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab value="all" label="Tümü" />
        {serviceAreas.map((area) => (
          <Tab key={area.id} value={area.id} label={area.name} />
        ))}
      </Tabs>

      {/* Masa Kartları */}
      <Grid container spacing={2}>
        {tables.map((table) => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={table.id}>
            <Card
              sx={{
                cursor: 'pointer',
                borderTop: `4px solid ${STATUS_COLORS[table.status] || '#94a3b8'}`,
                '&:hover': { boxShadow: 4 },
                transition: 'all 0.2s',
              }}
              onClick={() => openDrawer(table)}
            >
              <CardContent sx={{ textAlign: 'center', py: 2, pb: '12px !important' }}>
                <Typography variant="h4" fontWeight={800} color="text.primary">
                  {table.tableNumber}
                </Typography>
                <Chip
                  label={STATUS_LABELS[table.status] || table.status}
                  size="small"
                  sx={{
                    bgcolor: STATUS_COLORS[table.status],
                    color: 'white',
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                />
                {table.status === 'occupied' && (
                  <Typography variant="h6" fontWeight={700} color="primary" sx={{ mt: 1 }}>
                    {formatCurrency(parseFloat(table.currentTotal))}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  {table.serviceAreaName} · {table.capacity} kişi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Masa Detay Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        {selectedTable && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Masa {selectedTable.tableNumber}
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Chip
              label={STATUS_LABELS[selectedTable.status]}
              sx={{ bgcolor: STATUS_COLORS[selectedTable.status], color: 'white', fontWeight: 600, mb: 2 }}
            />

            {/* Boş masa → Aç butonu */}
            {selectedTable.status === 'empty' && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PersonIcon />}
                onClick={() => setOpenDialogVisible(true)}
                sx={{ py: 1.5, mb: 2 }}
              >
                Masa Aç
              </Button>
            )}

            {/* Dolu masa → Tab detayı */}
            {tableDetail?.currentTab && (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {tableDetail.currentTab.tabNo} · {tableDetail.currentTab.guestName}
                </Typography>

                <Divider sx={{ my: 1 }} />

                {/* Kalemler */}
                <List dense disablePadding>
                  {tableDetail.currentTab.items?.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={`${item.quantity}x ${item.description}`}
                        secondary={formatCurrency(parseFloat(item.totalPrice))}
                      />
                    </ListItem>
                  ))}
                  {(!tableDetail.currentTab.items || tableDetail.currentTab.items.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      Henüz ürün eklenmedi
                    </Typography>
                  )}
                </List>

                <Divider sx={{ my: 1 }} />

                <Typography variant="h5" fontWeight={700} color="primary" sx={{ textAlign: 'right', mb: 2 }}>
                  {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                </Typography>

                {/* Aksiyonlar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openAddItem}>
                    Ürün Ekle
                  </Button>
                  <Button variant="outlined" startIcon={<TransferIcon />} onClick={() => setTransferOpen(true)}>
                    Masa Transfer
                  </Button>
                  <Divider sx={{ my: 0.5 }} />
                  <Button variant="contained" color="success" startIcon={<PayIcon />} onClick={() => handlePay('cash')}>
                    Nakit Ödeme
                  </Button>
                  <Button variant="contained" color="info" startIcon={<PayIcon />} onClick={() => handlePay('card')}>
                    Kart Ödeme
                  </Button>
                  {tableDetail.currentTab.roomId && (
                    <Button variant="contained" color="warning" startIcon={<PayIcon />} onClick={() => handlePay('room_charge')}>
                      Odaya Yansıt
                    </Button>
                  )}
                </Box>
              </>
            )}

            {/* Dolu ama tab yoksa */}
            {selectedTable.status === 'occupied' && !tableDetail?.currentTab && (
              <Button variant="outlined" color="warning" fullWidth onClick={handleCloseTable}>
                Masayı Kapat
              </Button>
            )}

            {/* Ödenmişse kapat */}
            {selectedTable.status !== 'empty' && !tableDetail?.currentTab && (
              <Button variant="outlined" fullWidth onClick={handleCloseTable} sx={{ mt: 1 }}>
                Masayı Boşalt
              </Button>
            )}
          </Box>
        )}
      </Drawer>

      {/* Masa Aç Dialog */}
      <Dialog open={openDialogVisible} onClose={() => setOpenDialogVisible(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Masa Aç</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Müşteri Adı (opsiyonel)"
            fullWidth
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleOpenTable} variant="contained">Aç</Button>
        </DialogActions>
      </Dialog>

      {/* Ürün Ekle Dialog */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ürün Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Ürün Seç"
            fullWidth
            value={selectedMenuItem}
            onChange={(e) => setSelectedMenuItem(Number(e.target.value))}
          >
            {menuItems.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} — {formatCurrency(parseFloat(item.price))}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Adet"
            type="number"
            fullWidth
            value={itemQuantity}
            onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Özel Not (soğansız, acılı vb.)"
            fullWidth
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleAddItem} variant="contained" disabled={!selectedMenuItem}>Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Masa Transfer</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Hedef Masa"
            fullWidth
            value={targetTableId}
            onChange={(e) => setTargetTableId(Number(e.target.value))}
            sx={{ mt: 1 }}
          >
            {tables
              .filter((t) => t.status === 'empty' && t.id !== selectedTable?.id)
              .map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  Masa {t.tableNumber} — {t.serviceAreaName}
                </MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleTransfer} variant="contained" disabled={!targetTableId}>Transfer Et</Button>
        </DialogActions>
      </Dialog>

      {/* Masa Oluştur Dialog */}
      <Dialog open={createTableOpen} onClose={() => setCreateTableOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Masa Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Masa Numarası" fullWidth value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} />
          <TextField label="Kapasite" type="number" fullWidth value={newTableCapacity} onChange={(e) => setNewTableCapacity(Math.max(1, parseInt(e.target.value) || 1))} inputProps={{ min: 1 }} />
          <TextField select label="Hizmet Alanı" fullWidth value={newTableAreaId} onChange={(e) => setNewTableAreaId(Number(e.target.value))}>
            {serviceAreas.map((area) => (
              <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTableOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCreateTable} variant="contained" disabled={!newTableNumber || !newTableAreaId}>Oluştur</Button>
        </DialogActions>
      </Dialog>

      {/* Hizmet Alanı Oluştur Dialog */}
      <Dialog open={createAreaOpen} onClose={() => setCreateAreaOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Hizmet Alanı</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Alan Adı" fullWidth value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
          <TextField select label="Alan Tipi" fullWidth value={newAreaType} onChange={(e) => setNewAreaType(e.target.value)}>
            <MenuItem value="restaurant">Restoran</MenuItem>
            <MenuItem value="cafe">Kafe</MenuItem>
            <MenuItem value="bar">Bar</MenuItem>
            <MenuItem value="pool_bar">Havuz Bar</MenuItem>
            <MenuItem value="room_service">Oda Servisi</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAreaOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCreateArea} variant="contained" disabled={!newAreaName}>Oluştur</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TableManagement;

/**
 * Masa Yönetimi Sayfası
 *
 * Masalar grid düzeninde. Masaya tıkla → direkt detay paneli:
 * - Mevcut adisyon kalemleri (adet +/-, silme)
 * - Menüden ürün ekleme (kategorili, + ile)
 * - İlk ürün eklendiğinde tab otomatik oluşur
 *
 * Garson/barista: Ürün ekleme/çıkarma
 * Kasiyer/patron/müdür: + ödeme
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
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Payment as PayIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { tablesApi, serviceAreasApi, tabsApi, menuApi, reservationsApi } from '../../api/services';
import type { ApiTable, ApiServiceArea, ApiMenuItem, ApiMenuCategory } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';
import useAuth from '../../hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  empty: '#22c55e', occupied: '#ef4444', reserved: '#3b82f6', bill_requested: '#f59e0b',
};

const TableManagement: React.FC = () => {
  const { user } = useAuth();
  const canPay = ['cashier', 'patron', 'manager', 'restaurant_manager'].includes(user?.role || '');

  const [tables, setTables] = useState<ApiTable[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ApiServiceArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  /* Masa detay */
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [tableDetail, setTableDetail] = useState<ApiTable | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Menü */
  const [categories, setCategories] = useState<ApiMenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  /* Snackbar */
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  /* Transfer */
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
      setTables(await tablesApi.getAll(filters));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedArea]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  useEffect(() => {
    serviceAreasApi.getAll().then(setServiceAreas).catch(console.error);
  }, []);

  /** Menü */
  useEffect(() => {
    menuApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCatId(cats[0].id);
        menuApi.getItems({ categoryId: cats[0].id }).then(setMenuItems);
      }
    }).catch(console.error);
  }, []);

  const handleCatChange = async (catId: number) => {
    setSelectedCatId(catId);
    try { setMenuItems(await menuApi.getItems({ categoryId: catId })); }
    catch { setMenuItems([]); }
  };

  /** WebSocket */
  useRestaurantWebSocket({
    groups: ['tables'],
    onTableUpdate: (t) => {
      setTables(prev => prev.map(x => x.id === t.id ? t : x));
      if (selectedTable?.id === t.id) loadDetail(t.id);
    },
  });

  /** Masaya tıkla → drawer aç, detay yükle */
  const handleTableClick = async (table: ApiTable) => {
    setSelectedTable(table);
    setDrawerOpen(true);
    await loadDetail(table.id);
  };

  const loadDetail = async (tableId: number) => {
    try { setTableDetail(await tablesApi.getById(tableId)); }
    catch { setTableDetail(null); }
  };

  /** Ürün ekle (tab yoksa otomatik oluşur) */
  const handleAddItem = async (menuItem: ApiMenuItem) => {
    if (!selectedTable) return;
    try {
      await tablesApi.addItem(selectedTable.id, { menuItemId: menuItem.id, quantity: 1, openedById: user?.id });
      await loadDetail(selectedTable.id);
      fetchTables();
    } catch (err) { console.error(err); }
  };

  /** Adet güncelle */
  const handleUpdateQty = async (itemId: number, qty: number) => {
    if (!tableDetail?.currentTab) return;
    if (qty < 1) return handleRemoveItem(itemId);
    try {
      await tabsApi.updateItem(tableDetail.currentTab.id, itemId, qty);
      await loadDetail(selectedTable!.id);
      fetchTables();
    } catch (err) { console.error(err); }
  };

  /** Kalem sil */
  const handleRemoveItem = async (itemId: number) => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.removeItem(tableDetail.currentTab.id, itemId);
      await loadDetail(selectedTable!.id);
      fetchTables();
    } catch (err) { console.error(err); }
  };

  /* Ödeme dialog */
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [checkedInRooms, setCheckedInRooms] = useState<Array<{ id: number; roomId: number; roomNumber: string; guestNames: string | null }>>([]);

  const handleShowRoomSelect = async () => {
    try {
      const res = await reservationsApi.getAll({ status: 'checked_in', isActive: true });
      setCheckedInRooms(res);
      setShowRoomSelect(true);
    } catch { setSnackbar({ open: true, message: 'Aktif konaklamalar yüklenemedi', severity: 'error' }); }
  };

  const handlePay = async (method: 'cash' | 'card' | 'room_charge', roomId?: number) => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.pay(tableDetail.currentTab.id, method, undefined, roomId);
      setPayDialogOpen(false);
      setDrawerOpen(false);
      setSelectedTable(null);
      fetchTables();
    } catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Ödeme hatası', severity: 'error' }); }
  };

  /** Transfer */
  const handleTransfer = async () => {
    if (!selectedTable || !targetTableId) return;
    try {
      await tablesApi.transfer(selectedTable.id, targetTableId as number);
      setTransferOpen(false);
      setDrawerOpen(false);
      fetchTables();
    } catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Transfer hatası', severity: 'error' }); }
  };

  /** Masa kapat */
  const handleCloseTable = async () => {
    if (!selectedTable) return;
    try {
      await tablesApi.close(selectedTable.id);
      setDrawerOpen(false);
      fetchTables();
    } catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Masa kapatılamadı', severity: 'error' }); }
  };

  /** Masa/alan oluştur */
  const handleCreateTable = async () => {
    if (!newTableNumber || !newTableAreaId) return;
    try {
      await tablesApi.create({ tableNumber: newTableNumber, serviceAreaId: newTableAreaId as number, capacity: newTableCapacity });
      setCreateTableOpen(false); setNewTableNumber(''); setNewTableCapacity(4); setNewTableAreaId('');
      fetchTables();
    } catch (err) { console.error(err); }
  };

  const handleCreateArea = async () => {
    if (!newAreaName) return;
    try {
      await serviceAreasApi.create({ name: newAreaName, areaType: newAreaType });
      setCreateAreaOpen(false); setNewAreaName(''); setNewAreaType('restaurant');
      setServiceAreas(await serviceAreasApi.getAll());
    } catch (err) { console.error(err); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <PageHeader
          title="Masa Yönetimi"
          subtitle={`${tables.filter(t => t.status === 'empty').length} boş · ${tables.filter(t => t.status === 'occupied').length} dolu`}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setCreateAreaOpen(true)}>Hizmet Alanı Ekle</Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateTableOpen(true)}>Masa Ekle</Button>
        </Box>
      </Box>

      {/* Alan filtresi */}
      <Tabs value={selectedArea} onChange={(_, v) => setSelectedArea(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        <Tab value="all" label="Tümü" />
        {serviceAreas.map(area => <Tab key={area.id} value={area.id} label={area.name} />)}
      </Tabs>

      {/* Masa Grid */}
      <Grid container spacing={1.5}>
        {tables.map(table => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={table.id}>
            <Card
              sx={{
                cursor: 'pointer',
                borderTop: `4px solid ${STATUS_COLORS[table.status] || '#94a3b8'}`,
                '&:hover': { boxShadow: 4 },
              }}
              onClick={() => handleTableClick(table)}
            >
              <CardContent sx={{ textAlign: 'center', py: 1.5, pb: '8px !important' }}>
                <Typography variant="h4" fontWeight={800}>{table.tableNumber}</Typography>
                {table.status === 'occupied' ? (
                  <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(parseFloat(table.currentTotal))}</Typography>
                ) : (
                  <Typography variant="caption" color="text.disabled">Boş</Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">{table.serviceAreaName}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Masa Detay Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        {selectedTable && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Masa {selectedTable.tableNumber}</Typography>
                {tableDetail?.currentTab && (
                  <Typography variant="caption" color="text.secondary">{tableDetail.currentTab.tabNo}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tableDetail?.currentTab && (
                  <Typography variant="h5" fontWeight={800} color="primary">
                    {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                  </Typography>
                )}
                <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
              </Box>
            </Box>

            {/* İçerik — scrollable */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {/* Adisyon kalemleri */}
              {tableDetail?.currentTab?.items && tableDetail.currentTab.items.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Adisyon</Typography>
                  {tableDetail.currentTab.items.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5, gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography variant="body2" sx={{ flex: 1 }}>{item.description}</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">{formatCurrency(parseFloat(item.totalPrice))}</Typography>
                      <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}

              {/* Menü — ürün ekle */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Menüden Ekle</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <Chip
                    key={cat.id} label={cat.name} size="small"
                    color={selectedCatId === cat.id ? 'primary' : 'default'}
                    variant={selectedCatId === cat.id ? 'filled' : 'outlined'}
                    onClick={() => handleCatChange(cat.id)}
                  />
                ))}
              </Box>
              <List dense disablePadding>
                {menuItems.filter(i => i.isAvailable).map(item => (
                  <ListItemButton key={item.id} sx={{ borderRadius: 1, py: 0.5 }} onClick={() => handleAddItem(item)}>
                    <ListItemText
                      primary={item.name}
                      secondary={formatCurrency(parseFloat(item.price))}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'primary', fontWeight: 600 }}
                    />
                    <AddIcon color="primary" sx={{ fontSize: 20 }} />
                  </ListItemButton>
                ))}
              </List>

              {/* Transfer + kapat */}
              {tableDetail?.currentTab && (
                <Box sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined" startIcon={<TransferIcon />} onClick={() => setTransferOpen(true)} fullWidth>
                    Masa Transfer
                  </Button>
                </Box>
              )}
              {selectedTable.status !== 'empty' && !tableDetail?.currentTab && (
                <Button size="small" variant="outlined" color="warning" onClick={handleCloseTable} fullWidth sx={{ mt: 1 }}>
                  Masayı Boşalt
                </Button>
              )}
            </Box>

            {/* Ödeme — sadece yetkili roller */}
            {canPay && tableDetail?.currentTab?.items && tableDetail.currentTab.items.length > 0 && (
              <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0' }}>
                <Button variant="contained" color="primary" startIcon={<PayIcon />} onClick={() => setPayDialogOpen(true)} fullWidth>
                  Ödeme Al — {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Masa Transfer</DialogTitle>
        <DialogContent>
          <TextField select label="Hedef Masa" fullWidth value={targetTableId} onChange={(e) => setTargetTableId(Number(e.target.value))} sx={{ mt: 1 }}>
            {tables.filter(t => t.status === 'empty' && t.id !== selectedTable?.id).map(t => (
              <MenuItem key={t.id} value={t.id}>Masa {t.tableNumber} — {t.serviceAreaName}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleTransfer} variant="contained" disabled={!targetTableId}>Transfer Et</Button>
        </DialogActions>
      </Dialog>

      {/* Masa Oluştur */}
      <Dialog open={createTableOpen} onClose={() => setCreateTableOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Masa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Masa No" fullWidth value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} />
          <TextField label="Kapasite" type="number" fullWidth value={newTableCapacity} onChange={(e) => setNewTableCapacity(Math.max(1, parseInt(e.target.value) || 1))} />
          <TextField select label="Hizmet Alanı" fullWidth value={newTableAreaId} onChange={(e) => setNewTableAreaId(Number(e.target.value))}>
            {serviceAreas.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTableOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCreateTable} variant="contained" disabled={!newTableNumber || !newTableAreaId}>Oluştur</Button>
        </DialogActions>
      </Dialog>

      {/* Hizmet Alanı Oluştur */}
      <Dialog open={createAreaOpen} onClose={() => setCreateAreaOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Hizmet Alanı</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Alan Adı" fullWidth value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
          <TextField select label="Tip" fullWidth value={newAreaType} onChange={(e) => setNewAreaType(e.target.value)}>
            <MenuItem value="restaurant">Restoran</MenuItem>
            <MenuItem value="cafe">Kafe</MenuItem>
            <MenuItem value="bar">Bar</MenuItem>
            <MenuItem value="pool_bar">Havuz Bar</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAreaOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCreateArea} variant="contained" disabled={!newAreaName}>Oluştur</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Ödeme Yöntemi Dialog */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>Ödeme Yöntemi</DialogTitle>
        <DialogContent>
          {tableDetail?.currentTab && (
            <Typography variant="h4" fontWeight={800} color="primary" sx={{ textAlign: 'center', my: 2 }}>
              {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
            </Typography>
          )}
          {!showRoomSelect ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => handlePay('cash')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Typography sx={{ fontSize: 24 }}>💵</Typography>
                  <Box><Typography variant="h6" fontWeight={700}>Nakit</Typography><Typography variant="body2" color="text.secondary">Nakit ödeme</Typography></Box>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => handlePay('card')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Typography sx={{ fontSize: 24 }}>💳</Typography>
                  <Box><Typography variant="h6" fontWeight={700}>Kredi Kartı</Typography><Typography variant="body2" color="text.secondary">Kart ile ödeme</Typography></Box>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={handleShowRoomSelect}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Typography sx={{ fontSize: 24 }}>🏨</Typography>
                  <Box><Typography variant="h6" fontWeight={700}>Odaya Aktar</Typography><Typography variant="body2" color="text.secondary">Otel misafirinin odasına yansıt</Typography></Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Button size="small" onClick={() => setShowRoomSelect(false)}>← Geri</Button>
                <Typography variant="subtitle1" fontWeight={600}>Oda Seçin</Typography>
              </Box>
              {checkedInRooms.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Aktif konaklama yok</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}>
                  {checkedInRooms.map(res => (
                    <Card key={res.id} variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: '#f59e0b' } }} onClick={() => handlePay('room_charge', res.roomId)}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                        <Typography variant="h5" fontWeight={800} color="primary" sx={{ minWidth: 60, textAlign: 'center' }}>{res.roomNumber}</Typography>
                        <Box><Typography fontWeight={600}>{res.guestNames || 'Misafir'}</Typography><Typography variant="caption" color="text.secondary">Oda {res.roomNumber}</Typography></Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setPayDialogOpen(false)} color="inherit">İptal</Button></DialogActions>
      </Dialog>
    </div>
  );
};

export default TableManagement;

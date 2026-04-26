/**
 * Kasa Sayfası — Yeniden Tasarım
 *
 * Sol: Kasalar listesi (hizmet alanı bazlı)
 * Orta: Seçili kasanın masaları (grid)
 * Sağ: Seçili masanın detayı (adisyon kalemleri + menü + ödeme)
 *
 * Akış: Kasa seç → masalar yüklensin → masaya tıkla → ürün ekle/çıkar → ödeme al
 * Garson/barista: Ürün ekler, ödeme butonlarını görmez
 * Kasiyer/patron/müdür: Hem ürün ekler hem ödeme alır
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
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PayIcon,
  Receipt as ReceiptIcon,
  Assessment as SummaryIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { kasaApi, tablesApi, tabsApi, menuApi, reservationsApi } from '../../api/services';
import type {
  ApiCashRegister, ApiCashTransaction, ApiCashSummary,
  ApiTable, ApiMenuItem, ApiMenuCategory,
} from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';
import useAuth from '../../hooks/useAuth';

const TABLE_COLORS: Record<string, string> = {
  empty: '#22c55e', occupied: '#ef4444', reserved: '#3b82f6', bill_requested: '#f59e0b',
};

const CashRegisterPage: React.FC = () => {
  const { user } = useAuth();
  const canPay = ['cashier', 'patron', 'manager', 'restaurant_manager'].includes(user?.role || '');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  /* Kasalar */
  const [registers, setRegisters] = useState<ApiCashRegister[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<ApiCashRegister | null>(null);
  const [loading, setLoading] = useState(true);

  /* Masalar */
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [tableDetail, setTableDetail] = useState<ApiTable | null>(null);

  /* Menü */
  const [categories, setCategories] = useState<ApiMenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  /* Kasa işlemleri */
  const [transactions, setTransactions] = useState<ApiCashTransaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [summary, setSummary] = useState<ApiCashSummary | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  /* Kasa aç/kapa dialog */
  const [openRegisterDialog, setOpenRegisterDialog] = useState<{ register: ApiCashRegister; mode: 'open' | 'close' } | null>(null);
  const [balanceInput, setBalanceInput] = useState('0');
  const [registerActionLoading, setRegisterActionLoading] = useState(false);

  const handleOpenRegisterClick = (register: ApiCashRegister) => {
    setBalanceInput('0');
    setOpenRegisterDialog({ register, mode: 'open' });
  };

  const handleCloseRegisterClick = (register: ApiCashRegister) => {
    setBalanceInput(register.todayTotals?.collected || register.todayTotals?.total || '0');
    setOpenRegisterDialog({ register, mode: 'close' });
  };

  const submitRegisterAction = async () => {
    if (!openRegisterDialog) return;
    const { register, mode } = openRegisterDialog;
    const amount = parseFloat(balanceInput || '0');
    if (Number.isNaN(amount) || amount < 0) {
      setSnackbar({ open: true, message: 'Geçerli bir tutar girin', severity: 'error' });
      return;
    }
    setRegisterActionLoading(true);
    try {
      if (mode === 'open') {
        await kasaApi.open(register.id, { openingBalance: amount });
        setSnackbar({ open: true, message: 'Kasa açıldı', severity: 'success' });
      } else {
        await kasaApi.close(register.id, { closingBalance: amount });
        setSnackbar({ open: true, message: 'Kasa kapatıldı', severity: 'success' });
      }
      setOpenRegisterDialog(null);
      await fetchRegisters();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: e?.response?.data?.error || 'İşlem başarısız', severity: 'error' });
    } finally {
      setRegisterActionLoading(false);
    }
  };

  /** Kasaları yükle */
  const fetchRegisters = useCallback(async () => {
    try {
      const data = await kasaApi.getAll();
      setRegisters(data);
      // İlk açık kasayı seç
      if (!selectedRegister) {
        const open = data.find(r => r.status === 'open');
        if (open) selectRegister(open);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRegisters(); }, [fetchRegisters]);

  /** Menü kategorilerini yükle */
  useEffect(() => {
    menuApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCatId(cats[0].id);
        menuApi.getItems({ categoryId: cats[0].id }).then(setMenuItems);
      }
    }).catch(console.error);
  }, []);

  /** Kategori değişti */
  const handleCatChange = async (catId: number) => {
    setSelectedCatId(catId);
    try {
      const items = await menuApi.getItems({ categoryId: catId });
      setMenuItems(items);
    } catch { setMenuItems([]); }
  };

  /** Kasa seç → masaları yükle */
  const selectRegister = async (register: ApiCashRegister) => {
    setSelectedRegister(register);
    setSelectedTable(null);
    setTableDetail(null);
    setShowTransactions(false);
    if (register.serviceAreaId) {
      try {
        const data = await tablesApi.getAll({ serviceAreaId: register.serviceAreaId });
        setTables(data);
      } catch { setTables([]); }
    } else {
      setTables([]);
    }
  };

  /** Masaları yenile */
  const refreshTables = async () => {
    if (!selectedRegister?.serviceAreaId) return;
    try {
      const data = await tablesApi.getAll({ serviceAreaId: selectedRegister.serviceAreaId });
      setTables(data);
    } catch { }
  };

  /** WebSocket */
  useRestaurantWebSocket({
    groups: ['tables', 'cashier'],
    onTableUpdate: (updatedTable) => {
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
      if (selectedTable?.id === updatedTable.id) {
        loadTableDetail(updatedTable.id);
      }
    },
    onCashierUpdate: () => {
      fetchRegisters();
    },
  });

  /** Masaya tıkla → detay yükle */
  const handleTableClick = async (table: ApiTable) => {
    setSelectedTable(table);
    setShowTransactions(false);
    await loadTableDetail(table.id);
  };

  const loadTableDetail = async (tableId: number) => {
    try {
      const detail = await tablesApi.getById(tableId);
      setTableDetail(detail);
    } catch { setTableDetail(null); }
  };

  /** Masaya ürün ekle (tab yoksa otomatik oluşur) */
  const handleAddItem = async (menuItem: ApiMenuItem) => {
    if (!selectedTable) return;
    try {
      await tablesApi.addItem(selectedTable.id, {
        menuItemId: menuItem.id,
        quantity: 1,
        openedById: user?.id,
      });
      await loadTableDetail(selectedTable.id);
      refreshTables();
    } catch (err) {
      console.error('Ürün ekleme hatası:', err);
    }
  };

  /** Adet güncelle */
  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (!tableDetail?.currentTab) return;
    if (newQty < 1) return handleRemoveItem(itemId);
    try {
      await tabsApi.updateItem(tableDetail.currentTab.id, itemId, newQty);
      await loadTableDetail(selectedTable!.id);
      refreshTables();
    } catch (err) { console.error(err); }
  };

  /** Kalem sil */
  const handleRemoveItem = async (itemId: number) => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.removeItem(tableDetail.currentTab.id, itemId);
      await loadTableDetail(selectedTable!.id);
      refreshTables();
    } catch (err) { console.error(err); }
  };

  /* Hesap böl dialog */
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitSelected, setSplitSelected] = useState<number[]>([]);
  const [splitGuestName, setSplitGuestName] = useState('');
  const [splitting, setSplitting] = useState(false);

  const handleSplitToggle = (itemId: number) => {
    setSplitSelected(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleSplit = async () => {
    if (!tableDetail?.currentTab || splitSelected.length === 0) return;
    setSplitting(true);
    try {
      await tabsApi.split(tableDetail.currentTab.id, splitSelected, splitGuestName || undefined);
      setSplitOpen(false);
      setSplitSelected([]);
      setSplitGuestName('');
      // Masayı yenile
      if (selectedTable) loadTableDetail(selectedTable.id);
      setSnackbar({ open: true, message: 'Hesap bölündü — yeni adisyon oluşturuldu', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Hesap bölme hatası', severity: 'error' });
    } finally {
      setSplitting(false);
    }
  };

  /* Ödeme dialog */
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [checkedInRooms, setCheckedInRooms] = useState<Array<{ id: number; roomId: number; roomNumber: string; guestNames: string | null }>>([]);

  /** Ödeme dialog aç */
  const openPayDialog = () => {
    setShowRoomSelect(false);
    setPayDialogOpen(true);
  };

  /** Odaya aktar — aktif konaklayanları yükle */
  const handleShowRoomSelect = async () => {
    try {
      const res = await reservationsApi.getAll({ status: 'checked_in', isActive: true });
      setCheckedInRooms(res);
      setShowRoomSelect(true);
    } catch {
      setSnackbar({ open: true, message: 'Aktif konaklamalar yüklenemedi', severity: 'error' });
    }
  };

  /** Ödeme tamamla */
  const handlePay = async (method: 'cash' | 'card' | 'room_charge', roomId?: number) => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.pay(tableDetail.currentTab.id, method, selectedRegister?.id, roomId);
      setPayDialogOpen(false);
      setSelectedTable(null);
      setTableDetail(null);
      refreshTables();
      fetchRegisters();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Ödeme hatası', severity: 'error' });
    }
  };

  /** Kasa işlemleri */
  const loadTransactions = async () => {
    if (!selectedRegister) return;
    try {
      const data = await kasaApi.getTransactions(selectedRegister.id);
      setTransactions(data);
      setShowTransactions(true);
      setSelectedTable(null);
      setTableDetail(null);
    } catch { }
  };

  const showSummary = async () => {
    if (!selectedRegister) return;
    try {
      const data = await kasaApi.getSummary(selectedRegister.id);
      setSummary(data);
      setSummaryOpen(true);
    } catch { }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const totalOnTables = tables.reduce((sum, t) => sum + parseFloat(t.currentTotal || '0'), 0);

  return (
    <div>
      <PageHeader
        title="Kasa"
        subtitle={
          selectedRegister
            ? `${selectedRegister.name} · ${selectedRegister.status === 'open' ? '🟢 Açık' : '⚪ Kapalı'} · ${occupiedCount} dolu masa · Masalarda: ${formatCurrency(totalOnTables)}`
            : 'Kasa seçin'
        }
      />

      <Grid container spacing={1.5} sx={{ height: 'calc(100vh - 140px)' }}>
        {/* ══ SOL: Kasalar ══ */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 0.5 }}>Kasalar</Typography>
          {registers.map(reg => {
            const isOpen = reg.status === 'open';
            const collected = parseFloat(reg.todayTotals?.collected || '0');
            const pending = parseFloat(reg.todayTotals?.pending || '0');
            return (
              <Card
                key={reg.id}
                sx={{
                  mb: 0.5, cursor: 'pointer',
                  border: selectedRegister?.id === reg.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  '&:hover': { boxShadow: 2 },
                }}
                onClick={() => selectRegister(reg)}
              >
                <CardContent sx={{ py: 1, px: 1.5, pb: '8px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                      {reg.name}
                    </Typography>
                    <Chip
                      label={isOpen ? 'Açık' : 'Kapalı'}
                      color={isOpen ? 'success' : 'default'}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
                    />
                  </Box>
                  {reg.todayTotals && (
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Tahsil:</Typography>
                        <Typography variant="caption" fontWeight={600}>{formatCurrency(collected)}</Typography>
                      </Box>
                      {pending > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="warning.main">Bekleyen:</Typography>
                          <Typography variant="caption" fontWeight={600} color="warning.main">
                            {formatCurrency(pending)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  {canPay && (
                    <Box sx={{ mt: 1 }}>
                      {isOpen ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          fullWidth
                          sx={{ fontSize: '0.7rem', py: 0.25 }}
                          onClick={(e) => { e.stopPropagation(); handleCloseRegisterClick(reg); }}
                        >
                          Kasayı Kapat
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          fullWidth
                          sx={{ fontSize: '0.7rem', py: 0.25 }}
                          onClick={(e) => { e.stopPropagation(); handleOpenRegisterClick(reg); }}
                        >
                          Kasayı Aç
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {selectedRegister && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Button size="small" variant="outlined" startIcon={<ReceiptIcon />} onClick={loadTransactions} fullWidth>
                İşlemler
              </Button>
              <Button size="small" variant="outlined" startIcon={<SummaryIcon />} onClick={showSummary} fullWidth>
                Özet
              </Button>
            </Box>
          )}
        </Grid>

        {/* ══ ORTA: Masalar Grid ══ */}
        <Grid size={{ xs: 12, md: selectedTable || showTransactions ? 4 : 10 }}>
          {!selectedRegister ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">Sol panelden bir kasa seçin</Typography>
            </Box>
          ) : tables.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">Bu kasaya bağlı masa yok</Typography>
            </Box>
          ) : (
            <Grid container spacing={1}>
              {tables.map(table => (
                <Grid size={{ xs: 4, sm: 3, md: selectedTable || showTransactions ? 4 : 2 }} key={table.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderTop: `4px solid ${TABLE_COLORS[table.status] || '#94a3b8'}`,
                      border: selectedTable?.id === table.id ? '2px solid #3b82f6' : undefined,
                      '&:hover': { boxShadow: 3 },
                      transition: 'all 0.15s',
                    }}
                    onClick={() => handleTableClick(table)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 1, pb: '6px !important' }}>
                      <Typography variant="h5" fontWeight={800}>{table.tableNumber}</Typography>
                      {table.status === 'occupied' && (
                        <Typography variant="subtitle2" fontWeight={700} color="primary">
                          {formatCurrency(parseFloat(table.currentTotal))}
                        </Typography>
                      )}
                      {table.status === 'empty' && (
                        <Typography variant="caption" color="text.disabled">Boş</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* ══ SAĞ: Masa Detayı veya İşlemler ══ */}
        {(selectedTable || showTransactions) && (
          <Grid size={{ xs: 12, md: 6 }}>
            {showTransactions ? (
              /* İşlemler paneli */
              <Card sx={{ height: '100%', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {selectedRegister?.name} — İşlemler
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Saat</TableCell>
                          <TableCell>Adisyon</TableCell>
                          <TableCell>Açıklama</TableCell>
                          <TableCell align="right">Tutar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {new Date(tx.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>{tx.tabNo || '—'}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(parseFloat(tx.amount))}</TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">Henüz işlem yok</Typography>
                          </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : selectedTable && (
              /* Masa detayı */
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, overflow: 'auto', pb: 0 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={700}>Masa {selectedTable.tableNumber}</Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', py: 0.25, minWidth: 0 }}
                        onClick={() => window.open(`/kasa/display/${selectedTable.id}`, '_blank', 'width=600,height=800')}
                      >
                        Müşteri Ekranı
                      </Button>
                    </Box>
                    {tableDetail?.currentTab && (
                      <Typography variant="h5" fontWeight={800} color="primary">
                        {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                      </Typography>
                    )}
                  </Box>

                  {tableDetail?.currentTab?.tabNo && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Adisyon: {tableDetail.currentTab.tabNo}
                    </Typography>
                  )}

                  {/* Adisyon kalemleri */}
                  {tableDetail?.currentTab?.items && tableDetail.currentTab.items.length > 0 && (
                    <>
                      <Divider sx={{ mb: 1 }} />
                      {tableDetail.currentTab.items.map(item => (
                        <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5, gap: 1 }}>
                          <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography variant="body2" sx={{ flex: 1 }}>{item.description}</Typography>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {formatCurrency(parseFloat(item.totalPrice))}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <Divider sx={{ mt: 1 }} />
                    </>
                  )}

                  {/* Menü — ürün ekle */}
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                    Menüden Ekle
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                      <Chip
                        key={cat.id}
                        label={cat.name}
                        size="small"
                        color={selectedCatId === cat.id ? 'primary' : 'default'}
                        variant={selectedCatId === cat.id ? 'filled' : 'outlined'}
                        onClick={() => handleCatChange(cat.id)}
                      />
                    ))}
                  </Box>
                  <List dense disablePadding>
                    {menuItems.filter(i => i.isAvailable).map(item => (
                      <ListItemButton
                        key={item.id}
                        sx={{ borderRadius: 1, py: 0.5 }}
                        onClick={() => handleAddItem(item)}
                      >
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
                </CardContent>

                {/* Ödeme butonları — sadece kasiyer/patron/müdür */}
                {canPay && tableDetail?.currentTab && tableDetail.currentTab.items && tableDetail.currentTab.items.length > 0 && (
                  <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => { setSplitSelected([]); setSplitGuestName(''); setSplitOpen(true); }}
                      sx={{ minWidth: 120 }}
                    >
                      Hesap Böl
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<PayIcon />} onClick={openPayDialog} fullWidth size="large">
                      Ödeme Al — {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                    </Button>
                  </Box>
                )}
              </Card>
            )}
          </Grid>
        )}
      </Grid>

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

      {/* Kasa Aç/Kapa Dialog */}
      <Dialog
        open={!!openRegisterDialog}
        onClose={() => !registerActionLoading && setOpenRegisterDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {openRegisterDialog?.mode === 'open' ? 'Kasayı Aç' : 'Kasayı Kapat'}
          {openRegisterDialog && (
            <Typography variant="body2" color="text.secondary">
              {openRegisterDialog.register.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label={openRegisterDialog?.mode === 'open' ? 'Açılış Bakiyesi (₺)' : 'Sayım Sonucu (₺)'}
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              helperText={
                openRegisterDialog?.mode === 'open'
                  ? 'Kasada hâlihazırda olan nakit miktarını girin (yoksa 0).'
                  : 'Kasada saydığınız fiili nakit miktarını girin. Sistem ile farkı kayda geçer.'
              }
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRegisterDialog(null)} disabled={registerActionLoading} color="inherit">
            İptal
          </Button>
          <Button
            onClick={submitRegisterAction}
            disabled={registerActionLoading}
            variant="contained"
            color={openRegisterDialog?.mode === 'open' ? 'success' : 'error'}
          >
            {registerActionLoading
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : openRegisterDialog?.mode === 'open' ? 'Kasayı Aç' : 'Kasayı Kapat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Özet Dialog */}
      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Günlük Kasa Özeti</DialogTitle>
        <DialogContent>
          {summary && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Nakit Satış:</Typography>
                <Typography fontWeight={600} color="success.main">{formatCurrency(parseFloat(summary.cashSales))}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Kart Satış:</Typography>
                <Typography fontWeight={600} color="info.main">{formatCurrency(parseFloat(summary.cardSales))}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Odaya Yansıtma:</Typography>
                <Typography fontWeight={600} color="warning.main">{formatCurrency(parseFloat(summary.roomChargeSales))}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Toplam:</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(parseFloat(summary.totalSales))}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">{summary.transactionCount} işlem</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryOpen(false)} variant="contained">Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Hesap Böl Dialog */}
      <Dialog open={splitOpen} onClose={() => setSplitOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hesap Böl</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ayrı ödenecek kalemleri seçin:
          </Typography>
          {tableDetail?.currentTab?.items?.map((item) => {
            const checked = splitSelected.includes(item.id);
            return (
              <Box
                key={item.id}
                onClick={() => handleSplitToggle(item.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  p: 1, mb: 0.5, borderRadius: 1, cursor: 'pointer',
                  bgcolor: checked ? '#eff6ff' : 'transparent',
                  border: checked ? '1px solid #3b82f6' : '1px solid transparent',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <Checkbox checked={checked} size="small" />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                  {item.quantity}x {item.description}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {Number(item.totalPrice).toLocaleString('tr-TR')} ₺
                </Typography>
              </Box>
            );
          })}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography fontWeight={700}>Seçili Toplam:</Typography>
            <Typography fontWeight={700} color="primary">
              {(tableDetail?.currentTab?.items || [])
                .filter((i) => splitSelected.includes(i.id))
                .reduce((s, i) => s + Number(i.totalPrice), 0)
                .toLocaleString('tr-TR')} ₺
            </Typography>
          </Box>
          <TextField
            label="Kişi Adı (opsiyonel)"
            fullWidth
            size="small"
            value={splitGuestName}
            onChange={(e) => setSplitGuestName(e.target.value)}
            placeholder="Örn: Mehmet"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={handleSplit}
            disabled={splitSelected.length === 0 || splitting}
          >
            {splitting ? <CircularProgress size={20} /> : `Seçilenleri Ayır (${splitSelected.length} kalem)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ödeme Yöntemi Dialog */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          Ödeme Yöntemi Seçin
        </DialogTitle>
        <DialogContent>
          {tableDetail?.currentTab && (
            <Typography variant="h4" fontWeight={800} color="primary" sx={{ textAlign: 'center', my: 2 }}>
              {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
            </Typography>
          )}

          {!showRoomSelect ? (
            /* Yöntem seçimi */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: '#22c55e' } }}
                onClick={() => handlePay('cash')}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#22c55e15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 24 }}>💵</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Nakit</Typography>
                    <Typography variant="body2" color="text.secondary">Nakit olarak ödeme al</Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: '#3b82f6' } }}
                onClick={() => handlePay('card')}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 24 }}>💳</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Kredi Kartı</Typography>
                    <Typography variant="body2" color="text.secondary">Kart ile ödeme al</Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: '#f59e0b' } }}
                onClick={handleShowRoomSelect}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#f59e0b15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 24 }}>🏨</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Odaya Aktar</Typography>
                    <Typography variant="body2" color="text.secondary">Otel müşterisinin odasına yansıt</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            /* Oda seçimi */
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Button size="small" onClick={() => setShowRoomSelect(false)}>← Geri</Button>
                <Typography variant="subtitle1" fontWeight={600}>Oda Seçin</Typography>
              </Box>
              {checkedInRooms.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Aktif konaklama bulunamadı
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}>
                  {checkedInRooms.map((res) => (
                    <Card
                      key={res.id}
                      variant="outlined"
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: '#f59e0b' } }}
                      onClick={() => handlePay('room_charge', res.roomId)}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                        <Box sx={{ minWidth: 60, textAlign: 'center' }}>
                          <Typography variant="h5" fontWeight={800} color="primary">
                            {res.roomNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {res.guestNames || 'Misafir'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Oda {res.roomNumber}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)} color="inherit">İptal</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CashRegisterPage;

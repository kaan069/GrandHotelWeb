/**
 * Kasa Yönetimi Sayfası
 *
 * Üst: Masa düzeni (box grid) — masaya tıkla → adisyon detayı açılır
 * Alt: Kasa işlemleri (açma/kapama, gün sonu özet)
 *
 * Resepsiyondaki oda detayı mantığı: masa kartları + detay paneli
 * Mobil ve web paralel çalışır — aynı API'ler kullanılır.
 *
 * Roller: cashier, patron, manager, restaurant_manager
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
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  LockOpen as OpenIcon,
  Lock as CloseIcon,
  Add as AddIcon,
  Assessment as SummaryIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Payment as PayIcon,
  SwapHoriz as TransferIcon,
  Close as CloseDetailIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { kasaApi, tablesApi, serviceAreasApi, tabsApi, menuApi } from '../../api/services';
import type {
  ApiCashRegister, ApiCashTransaction, ApiCashSummary,
  ApiTable, ApiServiceArea, ApiTab, ApiMenuItem,
} from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import useRestaurantWebSocket from '../../hooks/useRestaurantWebSocket';

const TX_TYPE_LABELS: Record<string, string> = {
  sale_cash: 'Nakit Satış',
  sale_card: 'Kart Satış',
  sale_room_charge: 'Odaya Yansıtma',
  expense: 'Gider',
  opening: 'Açılış',
  closing: 'Kapanış',
};

const TX_TYPE_COLORS: Record<string, string> = {
  sale_cash: '#22c55e',
  sale_card: '#3b82f6',
  sale_room_charge: '#f59e0b',
  expense: '#ef4444',
  opening: '#94a3b8',
  closing: '#64748b',
};

const TABLE_STATUS_COLORS: Record<string, string> = {
  empty: '#22c55e',
  occupied: '#ef4444',
  reserved: '#3b82f6',
  bill_requested: '#f59e0b',
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  reserved: 'Rezerve',
  bill_requested: 'Hesap',
};

const CashRegisterPage: React.FC = () => {
  /* ─── Masa State ─── */
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ApiServiceArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
  const [tableDetail, setTableDetail] = useState<ApiTable | null>(null);

  /* ─── Kasa State ─── */
  const [registers, setRegisters] = useState<ApiCashRegister[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<ApiCashRegister | null>(null);
  const [transactions, setTransactions] = useState<ApiCashTransaction[]>([]);
  const [summary, setSummary] = useState<ApiCashSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0=masalar, 1=kasa

  /* ─── Dialog States ─── */
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [expenseDialogVisible, setExpenseDialogVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [summaryDialogVisible, setSummaryDialogVisible] = useState(false);

  /* Masa aç dialog */
  const [openTableDialogVisible, setOpenTableDialogVisible] = useState(false);
  const [guestName, setGuestName] = useState('');

  /* Ürün ekle dialog */
  const [addItemDialogVisible, setAddItemDialogVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  /* Kasa oluşturma */
  const [createRegisterOpen, setCreateRegisterOpen] = useState(false);
  const [newRegisterName, setNewRegisterName] = useState('');
  const [newRegisterType, setNewRegisterType] = useState('restaurant');

  /* ─── Data Fetch ─── */
  const fetchTables = useCallback(async () => {
    try {
      const filters: { serviceAreaId?: number } = {};
      if (selectedArea !== 'all') filters.serviceAreaId = selectedArea;
      const data = await tablesApi.getAll(filters);
      setTables(data);
    } catch (err) {
      console.error('Masalar yüklenemedi:', err);
    }
  }, [selectedArea]);

  const fetchRegisters = useCallback(async () => {
    try {
      const data = await kasaApi.getAll();
      setRegisters(data);
    } catch (err) {
      console.error('Kasalar yüklenemedi:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchTables(),
      fetchRegisters(),
      serviceAreasApi.getAll().then(setServiceAreas).catch(console.error),
    ]).finally(() => setLoading(false));
  }, [fetchTables, fetchRegisters]);

  /* WebSocket */
  useRestaurantWebSocket({
    groups: ['tables', 'cashier'],
    onTableUpdate: (updatedTable) => {
      setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    },
    onCashierUpdate: () => {
      fetchRegisters();
      if (selectedRegister) loadTransactions(selectedRegister.id);
    },
  });

  /* ─── Masa İşlemleri ─── */
  const handleTableClick = async (table: ApiTable) => {
    if (table.status === 'empty') {
      setSelectedTable(table);
      setGuestName('');
      setOpenTableDialogVisible(true);
    } else {
      setSelectedTable(table);
      try {
        const detail = await tablesApi.getById(table.id);
        setTableDetail(detail);
      } catch {
        setTableDetail(null);
      }
    }
  };

  const handleOpenTable = async () => {
    if (!selectedTable) return;
    try {
      await tablesApi.open(selectedTable.id, { guestName });
      setOpenTableDialogVisible(false);
      fetchTables();
      // Detayı aç
      const detail = await tablesApi.getById(selectedTable.id);
      setTableDetail(detail);
    } catch (err) {
      console.error('Masa açma hatası:', err);
    }
  };

  const handleCloseTable = async () => {
    if (!selectedTable) return;
    try {
      await tablesApi.close(selectedTable.id);
      setSelectedTable(null);
      setTableDetail(null);
      fetchTables();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Masa kapatılamadı');
    }
  };

  const handleCloseDetail = () => {
    setSelectedTable(null);
    setTableDetail(null);
  };

  /* Ürün ekle */
  const openAddItem = async () => {
    try {
      const items = await menuApi.getItems();
      setMenuItems(items);
      setAddItemDialogVisible(true);
    } catch {
      console.error('Menü yüklenemedi');
    }
  };

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
      setAddItemDialogVisible(false);
      setSelectedMenuItem('');
      setItemQuantity(1);
      setItemNotes('');
      const detail = await tablesApi.getById(selectedTable!.id);
      setTableDetail(detail);
      fetchTables();
    } catch (err) {
      console.error('Ürün ekleme hatası:', err);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!tableDetail?.currentTab) return;
    try {
      await tabsApi.removeItem(tableDetail.currentTab.id, itemId);
      const detail = await tablesApi.getById(selectedTable!.id);
      setTableDetail(detail);
      fetchTables();
    } catch (err) {
      console.error('Kalem silme hatası:', err);
    }
  };

  /* Ödeme */
  const handlePay = async (method: 'cash' | 'card' | 'room_charge') => {
    if (!tableDetail?.currentTab) return;
    const registerId = registers.find(r => r.status === 'open')?.id;
    try {
      await tabsApi.pay(tableDetail.currentTab.id, method, registerId);
      setSelectedTable(null);
      setTableDetail(null);
      fetchTables();
      fetchRegisters();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ödeme hatası');
    }
  };

  /* ─── Kasa İşlemleri ─── */
  const loadTransactions = async (registerId: number) => {
    try {
      const data = await kasaApi.getTransactions(registerId);
      setTransactions(data);
    } catch (err) {
      console.error('İşlemler yüklenemedi:', err);
    }
  };

  const selectRegister = (register: ApiCashRegister) => {
    setSelectedRegister(register);
    loadTransactions(register.id);
  };

  const handleOpenRegister = async () => {
    if (!selectedRegister) return;
    try {
      await kasaApi.open(selectedRegister.id, { openingBalance: parseFloat(openingBalance) || 0 });
      setOpenDialogVisible(false);
      setOpeningBalance('');
      fetchRegisters();
    } catch (err) {
      console.error('Kasa açma hatası:', err);
    }
  };

  const handleCloseRegister = async () => {
    if (!selectedRegister) return;
    try {
      await kasaApi.close(selectedRegister.id, { closingBalance: parseFloat(closingBalance) || 0 });
      setCloseDialogVisible(false);
      setClosingBalance('');
      fetchRegisters();
    } catch (err) {
      console.error('Kasa kapama hatası:', err);
    }
  };

  const handleAddExpense = async () => {
    if (!selectedRegister) return;
    try {
      await kasaApi.addExpense(selectedRegister.id, {
        amount: parseFloat(expenseAmount) || 0,
        description: expenseDescription,
      });
      setExpenseDialogVisible(false);
      setExpenseAmount('');
      setExpenseDescription('');
      loadTransactions(selectedRegister.id);
      fetchRegisters();
    } catch (err) {
      console.error('Gider ekleme hatası:', err);
    }
  };

  const handleCreateRegister = async () => {
    if (!newRegisterName) return;
    try {
      await kasaApi.create({ name: newRegisterName, registerType: newRegisterType });
      setCreateRegisterOpen(false);
      setNewRegisterName('');
      setNewRegisterType('restaurant');
      fetchRegisters();
    } catch (err) {
      console.error('Kasa oluşturma hatası:', err);
    }
  };

  const showSummary = async () => {
    if (!selectedRegister) return;
    try {
      const data = await kasaApi.getSummary(selectedRegister.id);
      setSummary(data);
      setSummaryDialogVisible(true);
    } catch (err) {
      console.error('Özet hatası:', err);
    }
  };

  const emptyCount = tables.filter((t) => t.status === 'empty').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <div>
      <PageHeader
        title="Kasa"
        subtitle={`${occupiedCount} dolu masa · ${emptyCount} boş · ${registers.filter((r) => r.status === 'open').length} açık kasa`}
      />

      {/* Tab Seçimi: Masalar | Kasa */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Masalar (${tables.length})`} />
        <Tab label={`Kasa İşlemleri (${registers.length})`} />
      </Tabs>

      {/* ═══ TAB 0: MASALAR ═══ */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          {/* Sol: Masa Grid */}
          <Grid size={{ xs: 12, md: selectedTable ? 5 : 12 }}>
            {/* Alan filtresi */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label="Tümü"
                color={selectedArea === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedArea('all')}
                variant={selectedArea === 'all' ? 'filled' : 'outlined'}
                size="small"
              />
              {serviceAreas.map((area) => (
                <Chip
                  key={area.id}
                  label={area.name}
                  color={selectedArea === area.id ? 'primary' : 'default'}
                  onClick={() => setSelectedArea(area.id)}
                  variant={selectedArea === area.id ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>

            {/* Masa kartları */}
            <Grid container spacing={1}>
              {tables.map((table) => (
                <Grid size={{ xs: 4, sm: 3, md: selectedTable ? 4 : 2 }} key={table.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderTop: `4px solid ${TABLE_STATUS_COLORS[table.status] || '#94a3b8'}`,
                      border: selectedTable?.id === table.id ? '2px solid #3b82f6' : undefined,
                      '&:hover': { boxShadow: 4 },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleTableClick(table)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 1.5, pb: '8px !important' }}>
                      <Typography variant="h5" fontWeight={800}>{table.tableNumber}</Typography>
                      <Chip
                        label={TABLE_STATUS_LABELS[table.status]}
                        size="small"
                        sx={{ bgcolor: TABLE_STATUS_COLORS[table.status], color: 'white', fontWeight: 600, fontSize: '0.65rem', mt: 0.5 }}
                      />
                      {table.status === 'occupied' && (
                        <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                          {formatCurrency(parseFloat(table.currentTotal))}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Sağ: Masa Detay Paneli (oda detayı mantığı) */}
          {selectedTable && (
            <Grid size={{ xs: 12, md: 7 }}>
              <Card>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Masa {selectedTable.tableNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTable.serviceAreaName} · {tableDetail?.currentTab?.tabNo || 'Adisyon yok'}
                        {tableDetail?.currentTab?.guestName && ` · ${tableDetail.currentTab.guestName}`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {tableDetail?.currentTab && (
                        <Typography variant="h5" fontWeight={800} color="primary">
                          {formatCurrency(parseFloat(tableDetail.currentTab.totalAmount))}
                        </Typography>
                      )}
                      <IconButton onClick={handleCloseDetail} size="small">
                        <CloseDetailIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Adisyon Kalemleri */}
                  {tableDetail?.currentTab ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Adisyon Kalemleri ({tableDetail.currentTab.items?.length || 0})
                        </Typography>
                        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAddItem}>
                          Ürün Ekle
                        </Button>
                      </Box>

                      {tableDetail.currentTab.items && tableDetail.currentTab.items.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Ürün</TableCell>
                                <TableCell align="center">Adet</TableCell>
                                <TableCell align="right">Birim</TableCell>
                                <TableCell align="right">Toplam</TableCell>
                                <TableCell align="center" sx={{ width: 40 }}></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tableDetail.currentTab.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell align="center">{item.quantity}</TableCell>
                                  <TableCell align="right">{formatCurrency(parseFloat(item.unitPrice))}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(parseFloat(item.totalPrice))}
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          Henüz ürün eklenmedi
                        </Typography>
                      )}

                      {/* Ödeme Butonları */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="success" startIcon={<PayIcon />} onClick={() => handlePay('cash')}>
                          Nakit
                        </Button>
                        <Button variant="contained" color="info" startIcon={<PayIcon />} onClick={() => handlePay('card')}>
                          Kart
                        </Button>
                        {tableDetail.currentTab.roomId && (
                          <Button variant="contained" color="warning" startIcon={<PayIcon />} onClick={() => handlePay('room_charge')}>
                            Odaya Yansıt
                          </Button>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography color="text.secondary">Bu masada aktif adisyon yok</Typography>
                      <Button variant="outlined" sx={{ mt: 1 }} onClick={handleCloseTable}>
                        Masayı Boşalt
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* ═══ TAB 1: KASA İŞLEMLERİ ═══ */}
      {activeTab === 1 && (
        <Grid container spacing={2}>
          {/* Sol: Kasa Listesi */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={() => setCreateRegisterOpen(true)} sx={{ mb: 1 }}>
              Yeni Kasa
            </Button>
            {registers.map((register) => (
              <Card
                key={register.id}
                sx={{
                  mb: 1, cursor: 'pointer',
                  border: selectedRegister?.id === register.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  '&:hover': { boxShadow: 2 },
                }}
                onClick={() => selectRegister(register)}
              >
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>{register.name}</Typography>
                    <Chip label={register.status === 'open' ? 'Açık' : 'Kapalı'} color={register.status === 'open' ? 'success' : 'default'} size="small" />
                  </Box>
                  {register.status === 'open' && register.todayTotals && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bugün: {formatCurrency(parseFloat(register.todayTotals.total))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nakit: {formatCurrency(parseFloat(register.todayTotals.cash))} · Kart: {formatCurrency(parseFloat(register.todayTotals.card))}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Sağ: Kasa Detay */}
          <Grid size={{ xs: 12, md: 8 }}>
            {selectedRegister ? (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>{selectedRegister.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {selectedRegister.status === 'closed' ? (
                        <Button variant="contained" color="success" startIcon={<OpenIcon />} onClick={() => setOpenDialogVisible(true)}>Kasa Aç</Button>
                      ) : (
                        <>
                          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setExpenseDialogVisible(true)}>Gider</Button>
                          <Button variant="outlined" startIcon={<SummaryIcon />} onClick={showSummary}>Özet</Button>
                          <Button variant="contained" color="error" startIcon={<CloseIcon />} onClick={() => setCloseDialogVisible(true)}>Kapat</Button>
                        </>
                      )}
                    </Box>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Saat</TableCell>
                          <TableCell>İşlem</TableCell>
                          <TableCell>Adisyon</TableCell>
                          <TableCell>Açıklama</TableCell>
                          <TableCell align="right">Tutar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {new Date(tx.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>
                              <Chip label={TX_TYPE_LABELS[tx.transactionType] || tx.transactionType} size="small" sx={{ bgcolor: TX_TYPE_COLORS[tx.transactionType] || '#94a3b8', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell>{tx.tabNo || '—'}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(parseFloat(tx.amount))}</TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography variant="body2" color="text.secondary">Henüz işlem yok</Typography></TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">Sol panelden bir kasa seçin</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* ═══ DIALOG'LAR ═══ */}

      {/* Masa Aç Dialog */}
      <Dialog open={openTableDialogVisible} onClose={() => setOpenTableDialogVisible(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Masa {selectedTable?.tableNumber} — Aç</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Müşteri Adı (opsiyonel)" fullWidth value={guestName} onChange={(e) => setGuestName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTableDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleOpenTable} variant="contained">Aç</Button>
        </DialogActions>
      </Dialog>

      {/* Ürün Ekle Dialog */}
      <Dialog open={addItemDialogVisible} onClose={() => setAddItemDialogVisible(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ürün Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Ürün Seç" fullWidth value={selectedMenuItem} onChange={(e) => setSelectedMenuItem(Number(e.target.value))}>
            {menuItems.map((item) => (
              <MenuItem key={item.id} value={item.id}>{item.name} — {formatCurrency(parseFloat(item.price))}</MenuItem>
            ))}
          </TextField>
          <TextField label="Adet" type="number" fullWidth value={itemQuantity} onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))} inputProps={{ min: 1 }} />
          <TextField label="Özel Not (soğansız, acılı vb.)" fullWidth value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleAddItem} variant="contained" disabled={!selectedMenuItem}>Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* Kasa Aç Dialog */}
      <Dialog open={openDialogVisible} onClose={() => setOpenDialogVisible(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Kasa Aç</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Açılış Bakiyesi (₺)" type="number" fullWidth value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleOpenRegister} variant="contained">Aç</Button>
        </DialogActions>
      </Dialog>

      {/* Kasa Kapat Dialog */}
      <Dialog open={closeDialogVisible} onClose={() => setCloseDialogVisible(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Kasa Kapat</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Sayılan Nakit (₺)" type="number" fullWidth value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleCloseRegister} variant="contained" color="error">Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Gider Ekle Dialog */}
      <Dialog open={expenseDialogVisible} onClose={() => setExpenseDialogVisible(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Gider Ekle</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Tutar (₺)" type="number" fullWidth value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
          <TextField label="Açıklama" fullWidth value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogVisible(false)} color="inherit">İptal</Button>
          <Button onClick={handleAddExpense} variant="contained">Ekle</Button>
        </DialogActions>
      </Dialog>

      {/* Özet Dialog */}
      <Dialog open={summaryDialogVisible} onClose={() => setSummaryDialogVisible(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Günlük Kasa Özeti</DialogTitle>
        <DialogContent>
          {summary && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Açılış Bakiyesi:</Typography>
                <Typography fontWeight={600}>{formatCurrency(parseFloat(summary.openingBalance))}</Typography>
              </Box>
              <Divider />
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Giderler:</Typography>
                <Typography fontWeight={600} color="error.main">-{formatCurrency(parseFloat(summary.expenses))}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Toplam Satış:</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(parseFloat(summary.totalSales))}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Beklenen Nakit:</Typography>
                <Typography fontWeight={600}>{formatCurrency(parseFloat(summary.expectedCash))}</Typography>
              </Box>
              {summary.actualCash && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Sayılan Nakit:</Typography>
                    <Typography fontWeight={600}>{formatCurrency(parseFloat(summary.actualCash))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Fark:</Typography>
                    <Typography fontWeight={700} color={parseFloat(summary.difference || '0') >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(parseFloat(summary.difference || '0'))}
                    </Typography>
                  </Box>
                </>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{summary.transactionCount} işlem · {summary.date}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogVisible(false)} variant="contained">Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Kasa Oluştur Dialog */}
      <Dialog open={createRegisterOpen} onClose={() => setCreateRegisterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Kasa Oluştur</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Kasa Adı" fullWidth value={newRegisterName} onChange={(e) => setNewRegisterName(e.target.value)} />
          <TextField select label="Kasa Tipi" fullWidth value={newRegisterType} onChange={(e) => setNewRegisterType(e.target.value)}>
            <MenuItem value="restaurant">Restoran Kasa</MenuItem>
            <MenuItem value="cafe">Kafe Kasa</MenuItem>
            <MenuItem value="bar">Bar Kasa</MenuItem>
            <MenuItem value="reception">Resepsiyon Kasa</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRegisterOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCreateRegister} variant="contained" disabled={!newRegisterName}>Oluştur</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CashRegisterPage;

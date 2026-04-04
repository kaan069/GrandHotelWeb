/**
 * SuperAdmin Hotel Detail
 *
 * Belirli bir otelin detay bilgilerini ve verilerini goruntuler.
 * Sekmeler: Personel, Odalar, Musteriler, Firmalar, Menu, Hizmet Alanlari, Rezervasyonlar, Arizalar, Stok
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  ArrowBack as ArrowBackIcon,
  Hotel as HotelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL, MODULE_DEFINITIONS } from '../../utils/constants';

/* ==================== TYPES ==================== */

interface HotelDetail {
  id: number;
  branchCode: string;
  name: string;
  staffCount: number;
  roomCount: number;
  enabledModules: string[];
}

interface TabDef {
  key: string;
  label: string;
  columns: string[];
}

/* ==================== TAB DEFINITIONS ==================== */

const TABS: TabDef[] = [
  { key: 'staff', label: 'Personel', columns: ['staffNumber', 'firstName', 'lastName', 'phone', 'roles', 'status'] },
  { key: 'rooms', label: 'Odalar', columns: ['roomNumber', 'bedType', 'floor', 'capacity', 'status'] },
  { key: 'guests', label: 'Musteriler', columns: ['firstName', 'lastName', 'phone', 'email', 'tcNo'] },
  { key: 'companies', label: 'Firmalar', columns: ['name', 'contactPerson', 'phone', 'email'] },
  { key: 'menu-categories', label: 'Menu', columns: ['name', 'sortOrder', 'isActive'] },
  { key: 'service-areas', label: 'Hizmet Alanlari', columns: ['name', 'areaType', 'hasKitchen'] },
  { key: 'reservations', label: 'Rezervasyonlar', columns: ['roomNumber', 'guestName', 'checkIn', 'checkOut', 'status'] },
  { key: 'faults', label: 'Arizalar', columns: ['roomNumber', 'category', 'description', 'status'] },
  { key: 'stock', label: 'Stok', columns: ['name', 'category', 'quantity', 'unit'] },
];

/* ==================== COLUMN LABEL MAP ==================== */

const COLUMN_LABELS: Record<string, string> = {
  staffNumber: 'Sicil No',
  firstName: 'Ad',
  lastName: 'Soyad',
  phone: 'Telefon',
  roles: 'Roller',
  status: 'Durum',
  roomNumber: 'Oda No',
  bedType: 'Yatak Tipi',
  floor: 'Kat',
  capacity: 'Kapasite',
  email: 'E-posta',
  tcNo: 'TC No',
  name: 'Ad',
  contactPerson: 'Yetkili',
  sortOrder: 'Siralama',
  isActive: 'Aktif',
  areaType: 'Alan Tipi',
  hasKitchen: 'Mutfak',
  guestName: 'Misafir',
  checkIn: 'Giris',
  checkOut: 'Cikis',
  category: 'Kategori',
  description: 'Aciklama',
  quantity: 'Miktar',
  unit: 'Birim',
};

/* ==================== AXIOS HELPER ==================== */

function superadminApi() {
  const token = localStorage.getItem('superadmin_token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Superadmin-Token': token || '',
    },
  });
}

/* ==================== HELPERS ==================== */

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? 'Evet' : 'Hayir';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/* ==================== COMPONENT ==================== */

const SuperAdminHotelDetail: React.FC = () => {
  const navigate = useNavigate();
  const { hotelId } = useParams<{ hotelId: string }>();

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [hotelLoading, setHotelLoading] = useState(true);
  const [hotelError, setHotelError] = useState('');

  const [activeTab, setActiveTab] = useState(0);
  const [tabData, setTabData] = useState<Record<string, unknown>[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState('');

  /* CRUD state */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  /* Auth kontrolu */
  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin/login', { replace: true });
    }
  }, [navigate]);

  /* Otel detayini yukle */
  const loadHotel = useCallback(async () => {
    try {
      setHotelLoading(true);
      const res = await superadminApi().get(`/hotel/superadmin/hotels/${hotelId}/`);
      setHotel(res.data);
      setHotelError('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login', { replace: true });
        return;
      }
      setHotelError('Otel bilgileri yuklenirken hata olustu.');
    } finally {
      setHotelLoading(false);
    }
  }, [hotelId, navigate]);

  useEffect(() => {
    loadHotel();
  }, [loadHotel]);

  /* Sekme verisini yukle */
  const loadTabData = useCallback(async (tabKey: string) => {
    try {
      setTabLoading(true);
      setTabError('');
      const res = await superadminApi().get(`/hotel/superadmin/hotels/${hotelId}/data/${tabKey}/`);
      setTabData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login', { replace: true });
        return;
      }
      setTabError('Veriler yuklenirken hata olustu.');
      setTabData([]);
    } finally {
      setTabLoading(false);
    }
  }, [hotelId, navigate]);

  useEffect(() => {
    const tabKey = TABS[activeTab]?.key;
    if (tabKey) {
      loadTabData(tabKey);
    }
  }, [activeTab, loadTabData]);

  /* Tab degisimi */
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /* CRUD handlers */
  const handleAdd = () => {
    const emptyForm: Record<string, string> = {};
    currentTab.columns.forEach((col) => { emptyForm[col] = ''; });
    setEditRecord(null);
    setEditForm(emptyForm);
    setEditDialogOpen(true);
  };

  const handleEdit = (row: Record<string, unknown>) => {
    const form: Record<string, string> = {};
    currentTab.columns.forEach((col) => {
      const val = row[col];
      form[col] = Array.isArray(val) ? val.join(', ') : (val != null ? String(val) : '');
    });
    setEditRecord(row);
    setEditForm(form);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const tabKey = currentTab.key;
    try {
      const payload: Record<string, unknown> = { ...editForm };
      // roles alanını array'e çevir
      if (payload.roles && typeof payload.roles === 'string') {
        payload.roles = (payload.roles as string).split(',').map((r: string) => r.trim()).filter(Boolean);
      }
      // boolean alanları çevir
      ['isActive', 'hasKitchen', 'isMinibar'].forEach((f) => {
        if (f in payload) {
          const v = String(payload[f]).toLowerCase();
          payload[f] = v === 'true' || v === 'evet' || v === '1';
        }
      });
      // sayısal alanları çevir
      ['floor', 'capacity', 'sortOrder', 'quantity'].forEach((f) => {
        if (f in payload && payload[f] !== '') {
          payload[f] = Number(payload[f]);
        }
      });

      if (editRecord) {
        // Güncelle
        await superadminApi().put(
          `/hotel/superadmin/hotels/${hotelId}/data/${tabKey}/${editRecord.id}/`,
          payload
        );
        setSnackbar({ open: true, message: 'Kayıt güncellendi', severity: 'success' });
      } else {
        // Yeni ekle
        await superadminApi().post(
          `/hotel/superadmin/hotels/${hotelId}/data/${tabKey}/`,
          payload
        );
        setSnackbar({ open: true, message: 'Kayıt eklendi', severity: 'success' });
      }
      setEditDialogOpen(false);
      loadTabData(tabKey);
    } catch {
      setSnackbar({ open: true, message: 'İşlem sırasında hata oluştu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    const tabKey = currentTab.key;
    try {
      await superadminApi().delete(
        `/hotel/superadmin/hotels/${hotelId}/data/${tabKey}/${row.id}/`
      );
      setSnackbar({ open: true, message: 'Kayıt silindi', severity: 'success' });
      loadTabData(tabKey);
    } catch {
      setSnackbar({ open: true, message: 'Silme sırasında hata oluştu', severity: 'error' });
    }
  };

  /* ==================== RENDER ==================== */

  const currentTab = TABS[activeTab];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4F8' }}>
      {/* AppBar */}
      <AppBar position="static" sx={{ bgcolor: '#1A1A2E' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/superadmin')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            SuperAdmin Panel
            {hotel && (
              <Typography
                component="span"
                variant="h6"
                sx={{ fontWeight: 400, ml: 1, opacity: 0.8 }}
              >
                — {hotel.name}
              </Typography>
            )}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Icerik */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Yukleniyor */}
        {hotelLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : hotelError ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {hotelError}
          </Alert>
        ) : hotel ? (
          <>
            {/* Otel Bilgi Karti */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HotelIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {hotel.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Chip
                        label={`Sube: ${hotel.branchCode}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {hotel.staffCount} Personel
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {hotel.roomCount} Oda
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Moduller */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                  {hotel.enabledModules.map((mod) => {
                    const def = MODULE_DEFINITIONS.find((d) => d.id === mod);
                    return (
                      <Chip
                        key={mod}
                        label={def?.label || mod}
                        size="small"
                        color="primary"
                        variant={mod === 'base' ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>

            {/* Sekmeler */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  bgcolor: '#fff',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 48,
                  },
                }}
              >
                {TABS.map((tab) => (
                  <Tab key={tab.key} label={tab.label} />
                ))}
              </Tabs>

              {/* Ekle Butonu */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>
                  Yeni Ekle
                </Button>
              </Box>

              {/* Tablo Icerik */}
              <Box sx={{ p: 0 }}>
                {tabLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : tabError ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    {tabError}
                  </Alert>
                ) : tabData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      Bu kategoride kayit bulunamadi.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {currentTab.columns.map((col) => (
                            <TableCell
                              key={col}
                              sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}
                            >
                              {COLUMN_LABELS[col] || col}
                            </TableCell>
                          ))}
                          <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: 100 }}>İşlem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tabData.map((row, idx) => (
                          <TableRow
                            key={(row as Record<string, unknown>).id as number || idx}
                            hover
                            sx={{ '&:last-child td': { borderBottom: 0 } }}
                          >
                            {currentTab.columns.map((col) => (
                              <TableCell key={col}>
                                {formatCellValue((row as Record<string, unknown>)[col])}
                              </TableCell>
                            ))}
                            <TableCell>
                              <IconButton size="small" color="primary" onClick={() => handleEdit(row as Record<string, unknown>)}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(row as Record<string, unknown>)}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Paper>
          </>
        ) : null}
      </Box>

      {/* Düzenle / Ekle Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRecord ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {currentTab.columns.map((col) => (
              <TextField
                key={col}
                label={COLUMN_LABELS[col] || col}
                value={editForm[col] || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, [col]: e.target.value }))}
                size="small"
                fullWidth
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : (editRecord ? 'Güncelle' : 'Ekle')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default SuperAdminHotelDetail;

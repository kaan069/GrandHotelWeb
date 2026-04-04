/**
 * SuperAdmin Dashboard
 *
 * Tum otelleri listeler, yeni otel ekleme ve modul yonetimi saglar.
 * Kendi auth mekanizmasi vardir (superadmin_token).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Hotel as HotelIcon,
  People as PeopleIcon,
  MeetingRoom as RoomIcon,
  Logout as LogoutIcon,
  Extension as ModuleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL, MODULE_DEFINITIONS } from '../../utils/constants';

/* ==================== TYPES ==================== */

interface HotelInfo {
  id: number;
  branchCode: string;
  name: string;
  staffCount: number;
  roomCount: number;
  enabledModules: string[];
}

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

/* ==================== COMPONENT ==================== */

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Yeni otel dialog */
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    branchCode: '',
    name: '',
    patronPassword: '',
    enabledModules: ['base'] as string[],
  });
  const [creating, setCreating] = useState(false);

  /* Modul duzenleme dialog */
  const [moduleOpen, setModuleOpen] = useState(false);
  const [moduleHotel, setModuleHotel] = useState<HotelInfo | null>(null);
  const [moduleSelection, setModuleSelection] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  /* Snackbar */
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  /* Otelleri yukle */
  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await superadminApi().get('/hotel/superadmin/hotels/');
      setHotels(res.data);
      setError('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('superadmin_token');
        navigate('/superadmin/login', { replace: true });
        return;
      }
      setError('Oteller yuklenirken hata olustu.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auth kontrolu + ilk yukleme (tek sefer) */
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin/login', { replace: true });
      return;
    }
    loadedRef.current = true;
    loadHotels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==================== YENI OTEL ==================== */

  const handleCreateOpen = () => {
    setCreateForm({ branchCode: '', name: '', patronPassword: '', enabledModules: ['base'] });
    setCreateOpen(true);
  };

  const handleCreateModuleToggle = (moduleId: string) => {
    if (moduleId === 'base') return; // base her zaman aktif
    setCreateForm((prev) => {
      const current = prev.enabledModules;
      const next = current.includes(moduleId)
        ? current.filter((m) => m !== moduleId)
        : [...current, moduleId];
      return { ...prev, enabledModules: next };
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await superadminApi().post('/hotel/superadmin/hotels/', createForm);
      setCreateOpen(false);
      setSnackbar({ open: true, message: 'Otel basariyla olusturuldu!', severity: 'success' });
      loadHotels();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setSnackbar({ open: true, message: err.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Otel olusturulurken hata olustu.', severity: 'error' });
      }
    } finally {
      setCreating(false);
    }
  };

  /* ==================== MODUL DUZENLEME ==================== */

  const handleModuleOpen = (hotel: HotelInfo) => {
    setModuleHotel(hotel);
    setModuleSelection([...hotel.enabledModules]);
    setModuleOpen(true);
  };

  const handleModuleToggle = (moduleId: string) => {
    if (moduleId === 'base') return;
    setModuleSelection((prev) => {
      if (prev.includes(moduleId)) {
        // Kapatilanin bagimlilarini da kapat
        const toRemove = new Set([moduleId]);
        MODULE_DEFINITIONS.forEach((m) => {
          if (m.dependsOn.includes(moduleId) && prev.includes(m.id)) {
            toRemove.add(m.id);
          }
        });
        return prev.filter((m) => !toRemove.has(m));
      } else {
        // Acilanin bagimliklarini da ac
        const mod = MODULE_DEFINITIONS.find((m) => m.id === moduleId);
        const toAdd = [moduleId, ...(mod?.dependsOn || [])];
        return Array.from(new Set([...prev, ...toAdd]));
      }
    });
  };

  const handleModuleSave = async () => {
    if (!moduleHotel) return;
    setSavingModules(true);
    try {
      await superadminApi().put(`/hotel/superadmin/hotels/${moduleHotel.id}/modules/`, {
        enabledModules: moduleSelection,
      });
      setModuleOpen(false);
      setSnackbar({ open: true, message: 'Moduller basariyla guncellendi!', severity: 'success' });
      loadHotels();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setSnackbar({ open: true, message: err.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Moduller guncellenirken hata olustu.', severity: 'error' });
      }
    } finally {
      setSavingModules(false);
    }
  };

  /* ==================== LOGOUT ==================== */

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    navigate('/superadmin/login', { replace: true });
  };

  /* ==================== RENDER ==================== */

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4F8' }}>
      {/* AppBar */}
      <AppBar position="static" sx={{ bgcolor: '#1A1A2E' }}>
        <Toolbar>
          <AdminIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            SuperAdmin Panel
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Cikis
          </Button>
        </Toolbar>
      </AppBar>

      {/* Icerik */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Baslik + Ekle Butonu */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Oteller</Typography>
            <Typography variant="body2" color="text.secondary">
              Sisteme kayitli tum otelleri yonetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateOpen}
            sx={{ borderRadius: 2 }}
          >
            Yeni Otel Ekle
          </Button>
        </Box>

        {/* Hata */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Yukleniyor */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : hotels.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <HotelIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Henuz otel eklenmemis
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                "Yeni Otel Ekle" butonu ile ilk otelinizi olusturun.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          /* Otel Kartlari */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2.5 }}>
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                onClick={() => navigate(`/superadmin/hotels/${hotel.id}`)}
                sx={{
                  borderRadius: 3,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Otel Bilgileri */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <HotelIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {hotel.name}
                      </Typography>
                      <Chip
                        label={`Sube: ${hotel.branchCode}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  {/* Istatistikler */}
                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {hotel.staffCount} Personel
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <RoomIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {hotel.roomCount} Oda
                      </Typography>
                    </Box>
                  </Box>

                  {/* Aktif Moduller */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {hotel.enabledModules.map((mod) => {
                      const def = MODULE_DEFINITIONS.find((d) => d.id === mod);
                      return (
                        <Chip
                          key={mod}
                          label={def?.label || mod}
                          size="small"
                          color="primary"
                          variant={mod === 'base' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      );
                    })}
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  {/* Islem Butonu */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={(e) => { e.stopPropagation(); handleModuleOpen(hotel); }}
                    >
                      Modulleri Duzenle
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* ==================== YENI OTEL DIALOG ==================== */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Yeni Otel Ekle
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Sube Kodu"
              value={createForm.branchCode}
              onChange={(e) => setCreateForm((p) => ({ ...p, branchCode: e.target.value }))}
              placeholder="Orn: 002"
              fullWidth
              required
            />
            <TextField
              label="Otel Adi"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Orn: Grand Hotel Istanbul"
              fullWidth
              required
            />
            <TextField
              label="Patron Sifresi"
              type="password"
              value={createForm.patronPassword}
              onChange={(e) => setCreateForm((p) => ({ ...p, patronPassword: e.target.value }))}
              placeholder="Patron hesabi icin sifre"
              fullWidth
              required
              helperText="Otel icin otomatik patron hesabi olusturulacaktir."
            />

            {/* Modul Secimi */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ModuleIcon fontSize="small" color="primary" />
                Aktif Moduller
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {MODULE_DEFINITIONS.map((mod) => (
                  <FormControlLabel
                    key={mod.id}
                    control={
                      <Switch
                        checked={createForm.enabledModules.includes(mod.id)}
                        onChange={() => handleCreateModuleToggle(mod.id)}
                        disabled={mod.alwaysOn}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{mod.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                      </Box>
                    }
                    sx={{ ml: 0 }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">
            Iptal
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createForm.branchCode || !createForm.name || !createForm.patronPassword}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {creating ? 'Olusturuluyor...' : 'Otel Olustur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== MODUL DUZENLEME DIALOG ==================== */}
      <Dialog open={moduleOpen} onClose={() => setModuleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ModuleIcon color="primary" />
          Modul Yonetimi — {moduleHotel?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Kapatilan modullerin verileri silinmez, sadece erisim kapatilir.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {MODULE_DEFINITIONS.map((mod) => (
              <Box
                key={mod.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: moduleSelection.includes(mod.id) ? 'primary.light' : 'divider',
                  borderRadius: 2,
                  bgcolor: moduleSelection.includes(mod.id) ? 'action.hover' : 'transparent',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight={600}>{mod.label}</Typography>
                    {mod.alwaysOn && (
                      <Chip label="Her Zaman Aktif" size="small" color="primary" variant="outlined" />
                    )}
                    {mod.dependsOn.length > 0 && (
                      <Chip
                        label={`${mod.dependsOn.map((d) => MODULE_DEFINITIONS.find((m) => m.id === d)?.label || d).join(', ')} gerektirir`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                </Box>
                <Switch
                  checked={moduleSelection.includes(mod.id)}
                  onChange={() => handleModuleToggle(mod.id)}
                  disabled={mod.alwaysOn}
                  color="primary"
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModuleOpen(false)} color="inherit">
            Iptal
          </Button>
          <Button
            variant="contained"
            onClick={handleModuleSave}
            disabled={savingModules}
            startIcon={savingModules ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
          >
            {savingModules ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default SuperAdminDashboard;

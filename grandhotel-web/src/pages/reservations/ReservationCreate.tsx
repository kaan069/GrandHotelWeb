/**
 * Yeni Rezervasyon Oluşturma Sayfası
 *
 * /reservations/new rotası ile açılır.
 * Misafir seçimi/oluşturma, oda seçimi, tarih ve ek bilgiler.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Autocomplete,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { reservationsApi, guestsApi, roomsApi, companiesApi } from '../../api/services';
import type { ApiGuest, ApiRoom, ApiCompany } from '../../api/services';
import useAuth from '../../hooks/useAuth';

/* ==================== COMPONENT ==================== */

const ReservationCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data
  const [guests, setGuests] = useState<ApiGuest[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form
  const [selectedGuest, setSelectedGuest] = useState<ApiGuest | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ApiRoom | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<ApiCompany | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Guest search
  const [guestSearch, setGuestSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ApiGuest[]>([]);
  const [searching, setSearching] = useState(false);

  // New guest dialog
  const [newGuestOpen, setNewGuestOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', phone: '', email: '', tcNo: '' });
  const [newGuestSaving, setNewGuestSaving] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load rooms & companies
  useEffect(() => {
    const load = async () => {
      try {
        const [r, c] = await Promise.all([roomsApi.getAll(), companiesApi.getAll()]);
        setRooms(r.filter((room: ApiRoom) => room.status === 'available'));
        setCompanies(c);
      } catch {
        setSnackbar({ open: true, message: 'Veriler yüklenemedi.', severity: 'error' });
      } finally {
        setDataLoading(false);
      }
    };
    load();

    // Set default check-in to today
    const today = new Date().toISOString().split('T')[0];
    setCheckIn(today);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setCheckOut(tomorrow);
  }, []);

  // Guest search debounce
  useEffect(() => {
    if (guestSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await guestsApi.search(guestSearch);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [guestSearch]);

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  // Validate
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedGuest) errs.guest = 'Misafir seçiniz.';
    if (!selectedRoom) errs.room = 'Oda seçiniz.';
    if (!checkIn) errs.checkIn = 'Giriş tarihi gerekli.';
    if (!checkOut) errs.checkOut = 'Çıkış tarihi gerekli.';
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      errs.checkOut = 'Çıkış tarihi girişten sonra olmalı.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validate() || !selectedGuest || !selectedRoom) return;
    setSaving(true);
    try {
      const result = await reservationsApi.create({
        roomId: selectedRoom.id,
        guestId: selectedGuest.id,
        checkIn,
        checkOut,
        notes: notes || undefined,
        staffName: user ? `${user.firstName} ${user.lastName}` : undefined,
        companyId: selectedCompany?.id || undefined,
      });
      setSnackbar({ open: true, message: 'Rezervasyon oluşturuldu.', severity: 'success' });
      setTimeout(() => navigate(`/reservations`), 500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || 'Rezervasyon oluşturulamadı.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // New guest
  const handleNewGuestSave = async () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.phone) {
      setSnackbar({ open: true, message: 'Ad, soyad ve telefon zorunludur.', severity: 'error' });
      return;
    }
    setNewGuestSaving(true);
    try {
      const created = await guestsApi.create({
        firstName: newGuest.firstName,
        lastName: newGuest.lastName,
        phone: newGuest.phone,
        email: newGuest.email || undefined,
        tcNo: newGuest.tcNo || '',
      });
      setSelectedGuest(created);
      setNewGuestOpen(false);
      setNewGuest({ firstName: '', lastName: '', phone: '', email: '', tcNo: '' });
      setSnackbar({ open: true, message: 'Misafir oluşturuldu.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Misafir oluşturulamadı.', severity: 'error' });
    } finally {
      setNewGuestSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reservations')} size="small">
          Geri
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Yeni Rezervasyon
        </Typography>
      </Box>

      {/* Misafir Seçimi */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Misafir
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {selectedGuest ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${selectedGuest.firstName} ${selectedGuest.lastName} — ${selectedGuest.phone}`}
                onDelete={() => setSelectedGuest(null)}
                color="primary"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={searchResults}
                getOptionLabel={(g) => `${g.firstName} ${g.lastName} — ${g.phone}`}
                loading={searching}
                onInputChange={(_, val) => setGuestSearch(val)}
                onChange={(_, val) => setSelectedGuest(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Misafir Ara (ad, soyad veya telefon)"
                    error={!!errors.guest}
                    helperText={errors.guest}
                    size="small"
                  />
                )}
                noOptionsText={guestSearch.length < 2 ? 'En az 2 karakter yazın' : 'Sonuç bulunamadı'}
              />
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setNewGuestOpen(true)}
                size="small"
                sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
              >
                Yeni Misafir
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Oda & Tarihler */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Oda ve Tarihler
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Oda"
                value={selectedRoom?.id || ''}
                onChange={(e) => {
                  const room = rooms.find(r => r.id === Number(e.target.value));
                  setSelectedRoom(room || null);
                }}
                error={!!errors.room}
                helperText={errors.room}
                size="small"
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.roomNumber} — {room.bedType} — Kat {room.floor}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Giriş Tarihi"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                error={!!errors.checkIn}
                helperText={errors.checkIn}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Çıkış Tarihi"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                error={!!errors.checkOut}
                helperText={errors.checkOut}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {nights > 0 && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              {nights} gece
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Ek Bilgiler */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Ek Bilgiler
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Firma (Opsiyonel)"
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const comp = companies.find(c => c.id === Number(e.target.value));
                  setSelectedCompany(comp || null);
                }}
                size="small"
              >
                <MenuItem value="">Bireysel</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Notlar"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Submit */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/reservations')}>
          Vazgeç
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving}
          size="large"
        >
          Rezervasyon Oluştur
        </Button>
      </Box>

      {/* New Guest Dialog */}
      <Dialog open={newGuestOpen} onClose={() => setNewGuestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Misafir</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Ad" required size="small"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest(g => ({ ...g, firstName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Soyad" required size="small"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest(g => ({ ...g, lastName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Telefon" required size="small"
                value={newGuest.phone}
                onChange={(e) => setNewGuest(g => ({ ...g, phone: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="E-posta" size="small"
                value={newGuest.email}
                onChange={(e) => setNewGuest(g => ({ ...g, email: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="TC No" size="small"
                value={newGuest.tcNo}
                onChange={(e) => setNewGuest(g => ({ ...g, tcNo: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGuestOpen(false)}>Vazgeç</Button>
          <Button
            variant="contained"
            onClick={handleNewGuestSave}
            disabled={newGuestSaving}
          >
            {newGuestSaving ? <CircularProgress size={18} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
    </Box>
  );
};

export default ReservationCreate;

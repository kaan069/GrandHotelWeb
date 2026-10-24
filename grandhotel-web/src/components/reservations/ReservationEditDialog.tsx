/**
 * ReservationEditDialog — rezervasyon oda / tarih / firma / not düzenleme
 *
 * Tutar düzenlenmez: rezervasyon toplamı backend'de folio'dan (ve rezerve durumdayken
 * gece × oda fiyatından) hesaplanır (Reservation.refresh_totals). Burada salt okunur gösterilir.
 */

import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { reservationsApi } from '../../api/services';
import type { ApiReservation, ApiCompany } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import { getApiErrorMessage } from '../../utils/apiError';

interface Room {
  id: number;
  roomNumber: string;
  status: string;
}

interface ReservationEditForm {
  roomId: string;
  checkIn: string;
  checkOut: string;
  companyId: string;
  notes: string;
}

interface ReservationEditDialogProps {
  open: boolean;
  onClose: () => void;
  reservation: ApiReservation | null;
  rooms: Room[];
  companies: ApiCompany[];
  onSave: (updated: ApiReservation) => void;
}

const ReservationEditDialog: React.FC<ReservationEditDialogProps> = ({
  open,
  onClose,
  reservation,
  rooms,
  companies,
  onSave,
}) => {
  const [form, setForm] = useState<ReservationEditForm>({
    roomId: '',
    checkIn: '',
    checkOut: '',
    companyId: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<ReservationEditForm>>({});
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    if (reservation) {
      setForm({
        roomId: String(reservation.roomId),
        checkIn: reservation.checkIn?.split('T')[0] || '',
        checkOut: reservation.checkOut?.split('T')[0] || '',
        companyId: reservation.companyId ? String(reservation.companyId) : '',
        notes: reservation.notes || '',
      });
    }
    setErrors({});
    setLoading(false);
  };

  /* Giriş yapılmışsa oda "Oda Taşı" ile değişir, giriş tarihi sabittir (backend de reddeder) */
  const isCheckedIn = reservation?.status === 'checked_in';

  const handleSave = async () => {
    if (!reservation) return;

    const errs: Partial<ReservationEditForm> = {};
    if (!form.roomId) errs.roomId = 'Oda seçin';
    if (!form.checkIn) errs.checkIn = 'Giriş tarihi zorunlu';
    if (!form.checkOut) errs.checkOut = 'Çıkış tarihi zorunlu';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      errs.checkOut = 'Çıkış tarihi girişten sonra olmalı';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const updated = await reservationsApi.update(reservation.id, {
        roomId: Number(form.roomId),
        checkIn: form.checkIn,
        checkOut: form.checkOut || undefined,
        notes: form.notes || undefined,
        companyId: form.companyId ? Number(form.companyId) : null,
      });
      onSave(updated);
      onClose();
    } catch (err: unknown) {
      setErrors((p) => ({ ...p, notes: getApiErrorMessage(err, 'Güncelleme yapılamadı') }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" component="span">
            Rezervasyon Düzenle {reservation ? `#${reservation.id}` : ''}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Misafir (read-only) */}
          {reservation?.guestNames && (
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Misafir"
                fullWidth
                size="small"
                value={reservation.guestNames}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          )}

          {/* Oda Seçimi */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Oda Numarası"
              fullWidth
              size="small"
              required
              select
              value={form.roomId}
              onChange={(e) => { setForm((p) => ({ ...p, roomId: e.target.value })); setErrors((p) => ({ ...p, roomId: '' })); }}
              error={!!errors.roomId}
              helperText={errors.roomId || (isCheckedIn ? 'Konaklayan misafir için "Oda Taşı" kullanın' : undefined)}
              disabled={isCheckedIn}
            >
              {rooms.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  Oda {r.roomNumber} ({r.status === 'available' ? 'Müsait' : r.status === 'occupied' ? 'Dolu' : r.status})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Toplam Tutar — salt okunur (folio / oda fiyatından hesaplanır) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Toplam Tutar"
              fullWidth
              size="small"
              value={reservation ? formatCurrency(parseFloat(reservation.totalAmount) || 0) : ''}
              helperText="Folio ve oda fiyatından otomatik hesaplanır"
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          {/* Giriş Tarihi */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Giriş Tarihi"
              fullWidth
              size="small"
              type="date"
              required
              value={form.checkIn}
              onChange={(e) => { setForm((p) => ({ ...p, checkIn: e.target.value })); setErrors((p) => ({ ...p, checkIn: '' })); }}
              error={!!errors.checkIn}
              helperText={errors.checkIn || (isCheckedIn ? 'Giriş yapıldı — değiştirilemez' : undefined)}
              disabled={isCheckedIn}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Çıkış Tarihi */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Çıkış Tarihi"
              fullWidth
              size="small"
              type="date"
              required
              value={form.checkOut}
              onChange={(e) => { setForm((p) => ({ ...p, checkOut: e.target.value })); setErrors((p) => ({ ...p, checkOut: '' })); }}
              error={!!errors.checkOut}
              helperText={errors.checkOut}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Firma */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Firma"
              fullWidth
              size="small"
              select
              value={form.companyId}
              onChange={(e) => setForm((p) => ({ ...p, companyId: e.target.value }))}
            >
              <MenuItem value="">Bireysel</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Notlar */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notlar"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              error={!!errors.notes}
              helperText={errors.notes}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Vazgeç
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationEditDialog;

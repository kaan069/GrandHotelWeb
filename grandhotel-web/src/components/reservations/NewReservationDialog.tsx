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
} from '@mui/material';
import { EventNote as EventNoteIcon } from '@mui/icons-material';
import { getLocalDateStr } from '../../utils/formatters';

interface Room {
  id: number;
  roomNumber: string;
  status: string;
}

interface NewReservationForm {
  firstName: string;
  lastName: string;
  phone: string;
  room: string;
  checkIn: string;
  checkOut: string;
}

export interface NewReservationResult {
  guest: string;
  room: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  phone: string;
}

interface NewReservationDialogProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  onSave: (result: NewReservationResult) => void;
}

const buildEmptyForm = (): NewReservationForm => ({
  firstName: '',
  lastName: '',
  phone: '',
  room: '',
  checkIn: getLocalDateStr(),
  checkOut: getLocalDateStr(1),
});

const NewReservationDialog: React.FC<NewReservationDialogProps> = ({ open, onClose, rooms, onSave }) => {
  const [form, setForm] = useState<NewReservationForm>(buildEmptyForm());
  const [errors, setErrors] = useState<Partial<NewReservationForm>>({});

  const handleOpen = () => {
    setForm(buildEmptyForm());
    setErrors({});
  };

  const handleSave = () => {
    const errs: Partial<NewReservationForm> = {};
    if (!form.firstName.trim()) errs.firstName = 'Ad zorunlu';
    if (!form.lastName.trim()) errs.lastName = 'Soyad zorunlu';
    if (!form.phone.trim()) errs.phone = 'Telefon zorunlu';
    if (!form.room) errs.room = 'Oda seçin';
    if (!form.checkOut) errs.checkOut = 'Çıkış tarihi zorunlu';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      errs.checkOut = 'Çıkış tarihi girişten sonra olmalı';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const guest = `${form.firstName.trim()} ${form.lastName.trim()}`;
    const nights = Math.max(1, Math.round((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)));

    onSave({
      guest,
      room: form.room,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      nights,
      phone: form.phone.trim(),
    });

    onClose();
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
          <EventNoteIcon color="primary" />
          <Typography variant="h6" component="span">Yeni Rezervasyon</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Ad"
              fullWidth
              size="small"
              required
              value={form.firstName}
              onChange={(e) => { setForm((p) => ({ ...p, firstName: e.target.value })); setErrors((p) => ({ ...p, firstName: '' })); }}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Soyad"
              fullWidth
              size="small"
              required
              value={form.lastName}
              onChange={(e) => { setForm((p) => ({ ...p, lastName: e.target.value })); setErrors((p) => ({ ...p, lastName: '' })); }}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telefon"
              fullWidth
              size="small"
              required
              value={form.phone}
              onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: '' })); }}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Oda Numarası"
              fullWidth
              size="small"
              required
              select
              value={form.room}
              onChange={(e) => { setForm((p) => ({ ...p, room: e.target.value })); setErrors((p) => ({ ...p, room: '' })); }}
              error={!!errors.room}
              helperText={errors.room}
            >
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.roomNumber}>
                  Oda {r.roomNumber} ({r.status === 'available' ? 'Müsait' : r.status === 'occupied' ? 'Dolu' : r.status})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Giriş Tarihi"
              fullWidth
              size="small"
              type="date"
              required
              value={form.checkIn}
              onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
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
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button variant="contained" onClick={handleSave}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewReservationDialog;

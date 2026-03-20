/**
 * BookingForm - Rezervasyon talep formu
 *
 * Dialog içinde: ad soyad, telefon, email, tarihler, kişi sayısı, notlar.
 * Backend yok, sadece görsel onay.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { EventAvailable as BookIcon } from '@mui/icons-material';

import { formatCurrency } from '../../utils/formatters';

interface BookingFormProps {
  open: boolean;
  hotelName: string;
  roomTypeLabel: string;
  pricePerNight: number;
  onClose: () => void;
}

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guestCount: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  phone: '',
  email: '',
  checkIn: '',
  checkOut: '',
  guestCount: '2',
  notes: '',
};

const BookingForm: React.FC<BookingFormProps> = ({ open, hotelName, roomTypeLabel, pricePerNight, onClose }) => {
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Ad soyad zorunlu';
    if (!form.phone.trim()) newErrors.phone = 'Telefon zorunlu';
    if (!form.email.trim()) newErrors.email = 'E-posta zorunlu';
    if (!form.checkIn) newErrors.checkIn = 'Giriş tarihi zorunlu';
    if (!form.checkOut) newErrors.checkOut = 'Çıkış tarihi zorunlu';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      newErrors.checkOut = 'Çıkış tarihi giriş tarihinden sonra olmalı';
    }
    if (!form.guestCount || Number(form.guestCount) <= 0) newErrors.guestCount = 'Kişi sayısı girin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitted(true);
  };

  const handleClose = () => {
    setForm({ ...INITIAL_FORM });
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  // Gece sayısı hesapla
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookIcon color="primary" />
          <Typography variant="h6" component="span">Rezervasyon Talebi</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hotelName} &bull; {roomTypeLabel} &bull; {formatCurrency(pricePerNight)} / gece
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {submitted ? (
          <Alert severity="success" sx={{ borderRadius: 2, my: 2 }}>
            <Typography fontWeight={600}>Rezervasyon talebiniz alındı!</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              En kısa sürede sizinle iletişime geçeceğiz. Teşekkür ederiz.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Telefon"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                required
                size="small"
                placeholder="05XX XXX XX XX"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="E-posta"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Giriş Tarihi"
                name="checkIn"
                type="date"
                value={form.checkIn}
                onChange={handleChange}
                error={Boolean(errors.checkIn)}
                helperText={errors.checkIn}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Çıkış Tarihi"
                name="checkOut"
                type="date"
                value={form.checkOut}
                onChange={handleChange}
                error={Boolean(errors.checkOut)}
                helperText={errors.checkOut}
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.checkIn || today } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Kişi Sayısı"
                name="guestCount"
                type="number"
                value={form.guestCount}
                onChange={handleChange}
                error={Boolean(errors.guestCount)}
                helperText={errors.guestCount}
                required
                size="small"
              />
            </Grid>
            {nights > 0 && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Toplam</Typography>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    {formatCurrency(pricePerNight * nights)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {nights} gece
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notlar (opsiyonel)"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                multiline
                rows={2}
                size="small"
                placeholder="Özel istekleriniz varsa belirtebilirsiniz..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {submitted ? 'Kapat' : 'İptal'}
        </Button>
        {!submitted && (
          <Button variant="contained" onClick={handleSubmit} sx={{ borderRadius: 2 }}>
            Talep Gönder
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;

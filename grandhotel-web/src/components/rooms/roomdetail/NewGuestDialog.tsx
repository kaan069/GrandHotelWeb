import React, { useState } from 'react';
import {
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

interface NewGuestDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { tcNo: string; firstName: string; lastName: string; phone: string; email: string }) => void;
}

const NewGuestDialog: React.FC<NewGuestDialogProps> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!form.tcNo || form.tcNo.length !== 11) newErrors.tcNo = 'TC Kimlik 11 haneli olmalıdır';
    if (!form.firstName.trim()) newErrors.firstName = 'Ad giriniz';
    if (!form.lastName.trim()) newErrors.lastName = 'Soyad giriniz';
    if (!form.phone.trim()) newErrors.phone = 'Telefon giriniz';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(form);
    setForm({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
    setErrors({});
  };

  const handleClose = () => {
    setForm({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" />
        Yeni Müşteri Kaydı
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="TC Kimlik No"
              fullWidth
              value={form.tcNo}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                setForm((p) => ({ ...p, tcNo: v }));
                setErrors((p) => ({ ...p, tcNo: '' }));
              }}
              error={!!errors.tcNo}
              helperText={errors.tcNo}
              inputProps={{ maxLength: 11 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telefon"
              fullWidth
              value={form.phone}
              onChange={(e) => {
                setForm((p) => ({ ...p, phone: e.target.value }));
                setErrors((p) => ({ ...p, phone: '' }));
              }}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Ad"
              fullWidth
              value={form.firstName}
              onChange={(e) => {
                setForm((p) => ({ ...p, firstName: e.target.value }));
                setErrors((p) => ({ ...p, firstName: '' }));
              }}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Soyad"
              fullWidth
              value={form.lastName}
              onChange={(e) => {
                setForm((p) => ({ ...p, lastName: e.target.value }));
                setErrors((p) => ({ ...p, lastName: '' }));
              }}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="E-posta (Opsiyonel)"
              fullWidth
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">İptal</Button>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleSave}>
          Kaydet ve Odaya Ekle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewGuestDialog;

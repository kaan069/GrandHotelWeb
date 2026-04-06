import React, { useState, useCallback } from 'react';
import {
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { guestsApi } from '../../../api/services';

interface NewGuestDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { tcNo: string; firstName: string; lastName: string; phone: string; email: string }) => void;
}

const NewGuestDialog: React.FC<NewGuestDialogProps> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tcStatus, setTcStatus] = useState<'idle' | 'checking' | 'found' | 'blocked' | 'new'>('idle');
  const [foundGuestId, setFoundGuestId] = useState<number | null>(null);

  const resetForm = () => {
    setForm({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
    setErrors({});
    setTcStatus('idle');
    setFoundGuestId(null);
  };

  // TC girilip alan dışına çıkınca kontrol et
  const handleTcBlur = useCallback(async () => {
    const tc = form.tcNo.trim();
    if (tc.length !== 11) {
      setTcStatus('idle');
      return;
    }

    setTcStatus('checking');
    try {
      const result = await guestsApi.checkTc(tc);
      if (result.found && result.guest) {
        if (result.isBlocked) {
          setTcStatus('blocked');
          setForm(prev => ({
            ...prev,
            firstName: result.guest!.firstName,
            lastName: result.guest!.lastName,
            phone: result.guest!.phone || '',
            email: result.guest!.email || '',
          }));
          setFoundGuestId(result.guest!.id);
        } else {
          setTcStatus('found');
          setForm(prev => ({
            ...prev,
            firstName: result.guest!.firstName,
            lastName: result.guest!.lastName,
            phone: result.guest!.phone || '',
            email: result.guest!.email || '',
          }));
          setFoundGuestId(result.guest!.id);
        }
      } else {
        setTcStatus('new');
        setFoundGuestId(null);
      }
    } catch {
      setTcStatus('idle');
    }
  }, [form.tcNo]);

  const handleSave = () => {
    if (tcStatus === 'blocked') return; // Blokeli müşteri kaydedilemez

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
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" />
        Yeni Müşteri Kaydı
      </DialogTitle>
      <DialogContent dividers>
        {/* Blokeli uyarısı */}
        {tcStatus === 'blocked' && (
          <Alert severity="error" icon={<BlockIcon />} sx={{ mb: 2 }}>
            <strong>Bu müşteri kara listede!</strong> Kayıt yapılamaz. Yöneticinize başvurun.
          </Alert>
        )}

        {/* Kayıtlı müşteri bilgisi */}
        {tcStatus === 'found' && (
          <Alert severity="info" icon={<CheckIcon />} sx={{ mb: 2 }}>
            Bu TC sistemde kayıtlı — bilgiler otomatik dolduruldu.
          </Alert>
        )}

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
                if (v.length < 11) { setTcStatus('idle'); setFoundGuestId(null); }
              }}
              onBlur={handleTcBlur}
              error={!!errors.tcNo}
              helperText={errors.tcNo}
              inputProps={{ maxLength: 11 }}
              InputProps={{
                endAdornment: tcStatus === 'checking' ? (
                  <CircularProgress size={18} />
                ) : tcStatus === 'found' ? (
                  <Chip label="Kayıtlı" size="small" color="info" icon={<CheckIcon />} />
                ) : tcStatus === 'blocked' ? (
                  <Chip label="Blokeli" size="small" color="error" icon={<BlockIcon />} />
                ) : tcStatus === 'new' ? (
                  <Chip label="Yeni" size="small" color="success" />
                ) : null,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telefon"
              fullWidth
              value={form.phone}
              onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: '' })); }}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={tcStatus === 'blocked'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Ad"
              fullWidth
              value={form.firstName}
              onChange={(e) => { setForm((p) => ({ ...p, firstName: e.target.value })); setErrors((p) => ({ ...p, firstName: '' })); }}
              error={!!errors.firstName}
              helperText={errors.firstName}
              disabled={tcStatus === 'blocked'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Soyad"
              fullWidth
              value={form.lastName}
              onChange={(e) => { setForm((p) => ({ ...p, lastName: e.target.value })); setErrors((p) => ({ ...p, lastName: '' })); }}
              error={!!errors.lastName}
              helperText={errors.lastName}
              disabled={tcStatus === 'blocked'}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="E-posta (Opsiyonel)"
              fullWidth
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              disabled={tcStatus === 'blocked'}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">İptal</Button>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleSave}
          disabled={tcStatus === 'blocked' || tcStatus === 'checking'}
        >
          {tcStatus === 'found' ? 'Kayıtlı Müşteriyi Ekle' : 'Kaydet ve Odaya Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewGuestDialog;

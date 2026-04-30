import React, { useState, useCallback, useEffect } from 'react';
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
  Box,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material';
import { guestsApi } from '../../../api/services';
import IdScanDialog from '../IdScanDialog';
import type { MrzData } from '../../../utils/mrzParser';

interface NewGuestDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { tcNo: string; firstName: string; lastName: string; phone: string; email: string }) => void;
  /** Hızlı rezervasyondan gelen geçici isim (Reservation.placeholder_guest_name) — TC alanı boş */
  defaultName?: string;
  /** Hızlı rezervasyondan gelen geçici telefon */
  defaultPhone?: string;
}

const splitFullName = (full: string): { first: string; last: string } => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  // Son parça soyad, gerisi ad
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return { first, last };
};

const NewGuestDialog: React.FC<NewGuestDialogProps> = ({ open, onClose, onSave, defaultName, defaultPhone }) => {
  const [form, setForm] = useState({ tcNo: '', firstName: '', lastName: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tcStatus, setTcStatus] = useState<'idle' | 'checking' | 'found' | 'blocked' | 'new'>('idle');
  const [foundGuestId, setFoundGuestId] = useState<number | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const resetForm = useCallback(() => {
    const { first, last } = splitFullName(defaultName || '');
    setForm({
      tcNo: '',
      firstName: first,
      lastName: last,
      phone: defaultPhone || '',
      email: '',
    });
    setErrors({});
    setTcStatus('idle');
    setFoundGuestId(null);
  }, [defaultName, defaultPhone]);

  // Modal açılırken placeholder bilgileriyle prefill et
  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const handleScan = (data: MrzData) => {
    // MRZ'den gelen veriyi forma yaz; varsa mevcut prefill'i ezer
    setForm((p) => ({
      ...p,
      tcNo: data.tcNo,
      firstName: data.firstName || p.firstName,
      lastName: data.lastName || p.lastName,
    }));
    setErrors({});
    setScanOpen(false);
    // TC dolduğunda kontrol akışı manuel olarak tetiklenebilmesi için onBlur'a bırakıyoruz;
    // burada doğrudan aynı kontrolü çalıştırmak için TC'yi dolu kabul edip handleTcBlur'u tekrar çağırıyoruz
    setTimeout(() => handleTcBlur(data.tcNo), 0);
  };

  // TC girilip alan dışına çıkınca veya barkod ile gelince kontrol et
  const handleTcBlur = useCallback(async (overrideTc?: string) => {
    const tc = (overrideTc ?? form.tcNo).trim();
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          Yeni Müşteri Kaydı
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CardIcon />}
          onClick={() => setScanOpen(true)}
        >
          Kimlik Tara
        </Button>
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
              onBlur={() => handleTcBlur()}
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

      <IdScanDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={handleScan}
      />
    </Dialog>
  );
};

export default NewGuestDialog;

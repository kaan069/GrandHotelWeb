/**
 * CariPaymentDialog — cari tahsilat formu (tutar + ödeme yöntemi + açıklama)
 *
 * Kullanıldığı yerler:
 *   - AccountTransactionTable: "Tahsilat Al" (cariye genel tahsilat, fazlası avans)
 *   - DebtCards: seçili borç kutucuklarına tahsilat (maxAmount = seçililerin kalanı)
 * Kısmi tutar girilebilir; kaydetme işini çağıran taraf yapar (onSubmit).
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import { FOLIO_PAYMENT_METHODS } from '../../utils/constants';

export interface CariPaymentValues {
  amount: number;
  paymentMethod: string;
  description: string;
}

interface Props {
  open: boolean;
  title: string;
  /** Formun üstünde gösterilen bilgi (ör. kalan borç) */
  hint?: string;
  /** Açılışta önerilen tutar ve açıklama */
  defaultAmount?: number;
  /** Verilirse tutar bunu aşamaz (seçili borçların kalanı) */
  maxAmount?: number;
  defaultDescription?: string;
  onClose: () => void;
  /** Hata fırlatırsa dialog açık kalır */
  onSubmit: (values: CariPaymentValues) => Promise<void>;
}

const CariPaymentDialog: React.FC<Props> = ({
  open, title, hint, defaultAmount, maxAmount, defaultDescription = '', onClose, onSubmit,
}) => {
  const [form, setForm] = useState({ amount: '', method: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        amount: defaultAmount && defaultAmount > 0 ? defaultAmount.toFixed(2) : '',
        method: '',
        description: defaultDescription,
      });
    }
  }, [open, defaultAmount, defaultDescription]);

  const amountValue = parseFloat(form.amount.replace(',', '.'));
  const amountError = !(amountValue > 0)
    ? 'Geçerli bir tutar girin'
    : maxAmount !== undefined && amountValue > maxAmount + 0.001
      ? `Tutar seçili borçların toplamını (${maxAmount.toFixed(2)} ₺) aşamaz`
      : '';
  const formError = amountError || (!form.method ? 'Ödeme yöntemi seçin' : '');

  const handleSave = async () => {
    if (formError) return;
    setSaving(true);
    try {
      await onSubmit({ amount: amountValue, paymentMethod: form.method, description: form.description });
    } catch {
      /* Hata mesajını çağıran taraf gösterir; form açık kalır */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
        <TextField
          label="Tutar (₺)"
          type="number"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          error={!!form.amount && !!amountError}
          helperText={form.amount ? amountError : undefined}
          fullWidth
          autoFocus
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          select
          label="Ödeme Yöntemi"
          value={form.method}
          onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
          fullWidth
        >
          {FOLIO_PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        <TextField
          label="Açıklama"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Vazgeç</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !!formError} title={formError}>
          {saving ? <CircularProgress size={20} /> : 'Tahsilatı Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CariPaymentDialog;

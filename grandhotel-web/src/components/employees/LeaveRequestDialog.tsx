/**
 * LeaveRequestDialog — Personelin kendi izin talebi (profil menüsünden açılır)
 *
 * Talep 'Onay Bekliyor' olarak oluşur; patron/müdür Eleman Yönetimi'nden onaylar
 * veya reddeder. Bekleyen talep buradan geri çekilebilir.
 * Mobil karşılığı: ProfileScreen → İzin Talep Et.
 *
 * API: leavesApi.request / leavesApi.getForEmployee / leavesApi.cancel
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, EventAvailable as LeaveIcon } from '@mui/icons-material';

import { leavesApi, ApiLeave } from '../../api/services';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR');

const EMPTY_FORM = { leaveType: 'annual', startDate: '', endDate: '', note: '', deductFromAnnual: false };

const LeaveRequestDialog: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState(EMPTY_FORM);
  const [myLeaves, setMyLeaves] = useState<ApiLeave[]>([]);
  const [saving, setSaving] = useState(false);

  const loadMyLeaves = useCallback(() => {
    if (!user) return;
    leavesApi.getForEmployee(user.id).then(setMyLeaves).catch(() => setMyLeaves([]));
  }, [user]);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, startDate: today(), endDate: today() });
      loadMyLeaves();
    }
  }, [open, loadMyLeaves]);

  const formValid = form.startDate && form.endDate && form.endDate >= form.startDate;

  const handleSubmit = async () => {
    if (!formValid) return;
    setSaving(true);
    try {
      await leavesApi.request({
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        note: form.note.trim() || undefined,
        deductFromAnnual: form.leaveType === 'weekly' ? form.deductFromAnnual : undefined,
      });
      showSuccess('İzin talebiniz iletildi — yönetici onayı bekleniyor');
      setForm({ ...EMPTY_FORM, startDate: today(), endDate: today() });
      loadMyLeaves();
    } catch (err) {
      showError(getApiErrorMessage(err, 'İzin talebi oluşturulamadı'));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (leave: ApiLeave) => {
    if (!window.confirm('Bu izin talebini geri çekmek istiyor musunuz?')) return;
    try {
      await leavesApi.cancel(leave.id);
      showSuccess('Talep geri çekildi');
      loadMyLeaves();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Talep geri çekilemedi'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LeaveIcon color="primary" /> İzin Talebi
        <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          select
          label="İzin Türü"
          value={form.leaveType}
          onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value, deductFromAnnual: false }))}
        >
          {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Başlangıç"
            type="date"
            fullWidth
            value={form.startDate}
            inputProps={{ min: today() }}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value, endDate: p.endDate < e.target.value ? e.target.value : p.endDate }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Bitiş"
            type="date"
            fullWidth
            value={form.endDate}
            inputProps={{ min: form.startDate || today() }}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        {form.leaveType === 'weekly' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={form.deductFromAnnual}
                onChange={(e) => setForm((p) => ({ ...p, deductFromAnnual: e.target.checked }))}
              />
            }
            label="Haftalık izin hakkım bittiyse yıllık izinden düşülsün"
          />
        )}
        <TextField
          label="Not (isteğe bağlı)"
          multiline
          minRows={2}
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
        />

        <Divider />
        <Typography variant="subtitle2">Taleplerim</Typography>
        {myLeaves.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Henüz izin kaydınız yok.</Typography>
        ) : (
          myLeaves.slice(0, 10).map((leave) => (
            <Box key={leave.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)} ({leave.durationDays} gün)
              </Typography>
              <Chip
                size="small"
                label={LEAVE_STATUS_LABELS[leave.status] || leave.status}
                color={LEAVE_STATUS_COLORS[leave.status] || 'default'}
              />
              {leave.status === 'pending' && (
                <Button size="small" color="error" onClick={() => handleWithdraw(leave)}>Geri Çek</Button>
              )}
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formValid || saving}>Talep Gönder</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveRequestDialog;

/**
 * LeaveDialog — İzin Verme Dialog'u
 *
 * Müdür/patron bir elemana izin vermek için bu dialog'u kullanır.
 * İzin tipi, tarih aralığı, not girilir.
 * Haftalık izin zaten kullanılmışsa yıllıktan düşüm uyarısı gösterilir.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  IconButton,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import { FormField } from '../forms';

const LEAVE_TYPES = [
  { value: 'weekly', label: 'Haftalık İzin' },
  { value: 'annual', label: 'Yıllık İzin' },
  { value: 'daily', label: 'Günlük İzin' },
  { value: 'unpaid', label: 'Ücretsiz İzin' },
];

interface LeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    employeeId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    deductFromAnnual: boolean;
    note: string;
  }) => void;
  employee: {
    id: number;
    fullName: string;
    hasWeeklyLeaveThisWeek: boolean;
    remainingAnnualLeave: number;
    annualLeaveEntitlement: number;
  } | null;
}

const LeaveDialog: React.FC<LeaveDialogProps> = ({ open, onClose, onSave, employee }) => {
  const [leaveType, setLeaveType] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [deductFromAnnual, setDeductFromAnnual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Dialog açılınca formu sıfırla */
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setLeaveType('weekly');
      setStartDate(today);
      setEndDate(today);
      setNote('');
      setDeductFromAnnual(false);
      setErrors({});
    }
  }, [open]);

  /* Haftalık izin bu hafta kullanılmışsa otomatik uyarı */
  const showWeeklyWarning = leaveType === 'weekly' && employee?.hasWeeklyLeaveThisWeek;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!startDate) newErrors.startDate = 'Başlangıç tarihi zorunlu';
    if (!endDate) newErrors.endDate = 'Bitiş tarihi zorunlu';
    if (startDate && endDate && startDate > endDate) newErrors.endDate = 'Bitiş, başlangıçtan sonra olmalı';

    /* Yıllık izin kalan hak kontrolü */
    if ((leaveType === 'annual' || leaveType === 'daily' || (leaveType === 'weekly' && deductFromAnnual)) && employee) {
      const days = startDate && endDate
        ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
        : 0;
      if (days > employee.remainingAnnualLeave) {
        newErrors.endDate = `Kalan yıllık izin: ${employee.remainingAnnualLeave} gün. ${days} gün talep edilemez.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !employee) return;
    onSave({
      employeeId: employee.id,
      leaveType,
      startDate,
      endDate,
      deductFromAnnual: showWeeklyWarning ? deductFromAnnual : (leaveType === 'annual' || leaveType === 'daily'),
      note,
    });
    onClose();
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          İzin Ver — {employee.fullName}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Kalan izin bilgisi */}
          <Alert severity="info" sx={{ py: 0.5 }}>
            Yıllık izin: <strong>{employee.remainingAnnualLeave}</strong> / {employee.annualLeaveEntitlement} gün kalan
          </Alert>

          {/* İzin tipi */}
          <FormField
            name="leaveType"
            label="İzin Tipi"
            value={leaveType}
            onChange={(e) => setLeaveType((e.target as HTMLInputElement).value)}
            select
          >
            {LEAVE_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </FormField>

          {/* Haftalık izin uyarısı */}
          {showWeeklyWarning && (
            <Alert severity="warning">
              Bu hafta zaten haftalık izin kullanılmış.
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deductFromAnnual}
                    onChange={(e) => setDeductFromAnnual(e.target.checked)}
                    size="small"
                  />
                }
                label="Yıllık izinden düşülsün"
                sx={{ ml: 1, mt: 0.5, display: 'block' }}
              />
            </Alert>
          )}

          {/* Tarih aralığı */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              name="startDate"
              label="Başlangıç"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
              error={errors.startDate}
              required
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
            <FormField
              name="endDate"
              label="Bitiş"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
              error={errors.endDate}
              required
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Not */}
          <FormField
            name="note"
            label="Not (Opsiyonel)"
            value={note}
            onChange={(e) => setNote((e.target as HTMLInputElement).value)}
            placeholder="İzin sebebi..."
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSubmit} variant="contained" color="success">İzin Ver</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveDialog;

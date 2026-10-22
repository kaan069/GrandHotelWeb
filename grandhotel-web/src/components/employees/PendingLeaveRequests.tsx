/**
 * PendingLeaveRequests — Onay bekleyen izin talepleri (Eleman Yönetimi sayfasının üstü)
 *
 * Talep yoksa hiçbir şey göstermez. Onay sırasında backend bakiye ve çakışmayı
 * yeniden kontrol eder; sorun varsa hata mesajı gösterilir.
 * Mobil karşılığı: StaffScreen → Bekleyen İzin Talepleri.
 *
 * API: leavesApi.getAll({ status: 'pending' }) / approve / reject
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import { EventAvailable as LeaveIcon } from '@mui/icons-material';

import { leavesApi, ApiLeave } from '../../api/services';
import { LEAVE_TYPE_LABELS } from '../../utils/constants';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';

interface Props {
  /** Onay/red sonrası çalışan listesi (izin bakiyeleri) yenilensin */
  onChanged?: () => void;
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR');

const PendingLeaveRequests: React.FC<Props> = ({ onChanged }) => {
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState<ApiLeave[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    leavesApi.getAll({ status: 'pending' }).then(setRequests).catch(() => setRequests([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (leave: ApiLeave, approve: boolean) => {
    setBusyId(leave.id);
    try {
      await (approve ? leavesApi.approve(leave.id) : leavesApi.reject(leave.id));
      showSuccess(`${leave.employeeName} — izin talebi ${approve ? 'onaylandı' : 'reddedildi'}`);
      load();
      onChanged?.();
    } catch (err) {
      showError(getApiErrorMessage(err, 'İşlem yapılamadı'));
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'warning.main' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <LeaveIcon color="warning" /> Bekleyen İzin Talepleri
          <Chip size="small" label={requests.length} color="warning" />
        </Typography>
        {requests.map((leave) => (
          <Box
            key={leave.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: 1, borderColor: 'divider', flexWrap: 'wrap' }}
          >
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="body2" fontWeight={600}>{leave.employeeName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)} ({leave.durationDays} gün)
                {leave.note ? ` · "${leave.note}"` : ''}
              </Typography>
            </Box>
            <Button size="small" color="error" disabled={busyId === leave.id} onClick={() => decide(leave, false)}>
              Reddet
            </Button>
            <Button size="small" variant="contained" color="success" disabled={busyId === leave.id} onClick={() => decide(leave, true)}>
              Onayla
            </Button>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingLeaveRequests;

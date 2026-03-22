/**
 * EmployeeDetailDialog — Eleman Detay Dialog'u
 *
 * Elemanın bilgilerini ve izin geçmişini gösterir.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  EventAvailable as LeaveIcon,
} from '@mui/icons-material';
import { ROLE_LABELS } from '../../utils/constants';
import { getYearsOfService } from '../../utils/leaveCalculator';
import { leavesApi } from '../../api/services';
import type { ApiEmployee, ApiLeave } from '../../api/services';

interface EmployeeDetailDialogProps {
  open: boolean;
  onClose: () => void;
  employee: ApiEmployee | null;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  weekly: 'Haftalık',
  annual: 'Yıllık',
  daily: 'Günlük',
  unpaid: 'Ücretsiz',
};

const LEAVE_STATUS_LABELS: Record<string, string> = {
  approved: 'Onaylandı',
  pending: 'Beklemede',
  cancelled: 'İptal',
};

const LEAVE_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  cancelled: 'error',
};

const EmployeeDetailDialog: React.FC<EmployeeDetailDialogProps> = ({ open, onClose, employee }) => {
  const [leaves, setLeaves] = useState<ApiLeave[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  useEffect(() => {
    if (open && employee) {
      setLoadingLeaves(true);
      leavesApi.getForEmployee(employee.id)
        .then(setLeaves)
        .catch((err) => console.error('İzin geçmişi yüklenemedi:', err))
        .finally(() => setLoadingLeaves(false));
    }
  }, [open, employee]);

  if (!employee) return null;

  const years = getYearsOfService(employee.hireDate);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" />
        {employee.fullName}
        <Chip label={`#${employee.staffNumber}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
      </DialogTitle>
      <DialogContent dividers>
        {/* Kişisel Bilgiler */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{employee.phone || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">
              İşe Giriş: {formatDate(employee.hireDate)} ({Math.floor(years)} yıl)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {employee.roles.map((role) => (
                <Chip key={role} label={ROLE_LABELS[role] || role} size="small" color="primary" variant="outlined" />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* İzin Özeti */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            icon={<LeaveIcon />}
            label={`Kalan: ${employee.remainingAnnualLeave}/${employee.annualLeaveEntitlement} gün`}
            color={employee.remainingAnnualLeave <= 2 ? 'error' : 'success'}
            variant="outlined"
          />
          {employee.isOnLeaveToday && (
            <Chip label="Bugün İzinli" color="info" size="small" />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* İzin Geçmişi */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          İzin Geçmişi
        </Typography>

        {loadingLeaves ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : leaves.length > 0 ? (
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tür</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Başlangıç</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Bitiş</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Gün</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Not</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        label={LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(leave.startDate)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(leave.endDate)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{leave.durationDays}</TableCell>
                    <TableCell>
                      <Chip
                        label={LEAVE_STATUS_LABELS[leave.status] || leave.status}
                        size="small"
                        color={LEAVE_STATUS_COLORS[leave.status] || 'default'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.note || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            İzin kaydı bulunmuyor.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetailDialog;

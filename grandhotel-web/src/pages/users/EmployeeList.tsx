/**
 * EmployeeList - Eleman Yönetimi Sayfası
 *
 * Patron/müdür personel listesini görür, yeni eleman ekleyebilir ve izin verebilir.
 * Veriler backend API'den çekilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Box, Chip, IconButton, Stack, CircularProgress, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EventAvailable as LeaveIcon,
  Key as KeyIcon,
  QrCode2 as QrCodeIcon,
} from '@mui/icons-material';

import { GridRenderCellParams } from '@mui/x-data-grid';
import { PageHeader, DataTable } from '../../components/common';
import EmployeeAddDialog from '../../components/employees/EmployeeAddDialog';
import EmployeeDetailDialog from '../../components/employees/EmployeeDetailDialog';
import LeaveDialog from '../../components/employees/LeaveDialog';
import AttendanceQRDialog from './AttendanceQRDialog';
import { ROLE_LABELS } from '../../utils/constants';
import { getYearsOfService } from '../../utils/leaveCalculator';
import { staffApi, leavesApi } from '../../api/services';
import type { ApiEmployee } from '../../api/services';
import useAuth from '../../hooks/useAuth';

const getColumns = (onDelete: (id: number) => void, onLeave: (emp: ApiEmployee) => void, onResetPassword: (emp: ApiEmployee) => void) => [
  {
    field: 'staffNumber',
    headerName: 'Personel No',
    width: 100,
    renderCell: (params: GridRenderCellParams) => (
      <Chip label={`#${params.value}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
    ),
  },
  {
    field: 'fullName',
    headerName: 'Ad Soyad',
    width: 160,
  },
  {
    field: 'roles',
    headerName: 'Görevler',
    width: 220,
    renderCell: (params: GridRenderCellParams) => (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {(params.value || []).map((role: string) => (
          <Chip key={role} label={ROLE_LABELS[role] || role} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>
    ),
  },
  {
    field: 'phone',
    headerName: 'Telefon',
    width: 140,
  },
  {
    field: 'hireDate',
    headerName: 'İşe Giriş',
    width: 100,
    valueGetter: (value: string) => {
      if (!value) return '-';
      const d = new Date(value);
      return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
    },
  },
  {
    field: 'yearsOfService',
    headerName: 'Kıdem',
    width: 80,
    valueGetter: (_value: unknown, row: ApiEmployee) => {
      const years = getYearsOfService(row.hireDate);
      return `${Math.floor(years)} yıl`;
    },
  },
  {
    field: 'isOnLeaveToday',
    headerName: 'İzin',
    width: 90,
    renderCell: (params: GridRenderCellParams) => (
      params.value
        ? <Chip label="İzinli" size="small" color="success" />
        : <Typography variant="caption" color="text.disabled">-</Typography>
    ),
  },
  {
    field: 'remainingAnnualLeave',
    headerName: 'Kalan İzin',
    width: 100,
    renderCell: (params: GridRenderCellParams) => {
      const remaining = params.value ?? 0;
      const total = params.row.annualLeaveEntitlement ?? 0;
      return (
        <Chip
          label={`${remaining}/${total}`}
          size="small"
          color={remaining <= 2 ? 'error' : 'success'}
          variant="outlined"
        />
      );
    },
  },
  {
    field: 'password',
    headerName: 'Şifre',
    width: 90,
    sortable: false,
    renderCell: (params: GridRenderCellParams) => (
      <IconButton
        size="small"
        color="warning"
        title="Şifre Sıfırla"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onResetPassword(params.row);
        }}
      >
        <KeyIcon fontSize="small" />
      </IconButton>
    ),
  },
  {
    field: 'salary',
    headerName: 'Maaş',
    width: 110,
    renderCell: (params: GridRenderCellParams) => {
      const val = params.value;
      if (!val) return <Typography variant="caption" color="text.disabled">-</Typography>;
      return <Typography variant="body2" fontWeight={600}>{Number(val).toLocaleString('tr-TR')} ₺</Typography>;
    },
  },
  {
    field: 'actions',
    headerName: '',
    width: 100,
    sortable: false,
    renderCell: (params: GridRenderCellParams) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="small"
          color="success"
          title="İzin Ver"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onLeave(params.row);
          }}
        >
          <LeaveIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          title="Sil"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(params.row.id);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    ),
  },
];

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<ApiEmployee | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<ApiEmployee | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [resetResult, setResetResult] = useState<{ fullName: string; staffNumber: string; newPassword: string } | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Elemanlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSave = async (formData: { firstName: string; lastName: string; roles: string[]; phone: string; password: string; hireDate: string; salary?: number }) => {
    try {
      const maxNum = employees.reduce((max, e) => Math.max(max, Number(e.staffNumber) || 0), 1001);
      await staffApi.create({ ...formData, staffNumber: String(maxNum + 1) });
      fetchEmployees();
    } catch (err: unknown) {
      console.error('Eleman eklenemedi:', err);
      const axiosErr = err as { response?: { data?: { staffNumber?: string[]; error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.staffNumber?.[0] || axiosErr?.response?.data?.error || 'Eleman eklenemedi', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu elemanı silmek istediğinize emin misiniz?')) return;
    try {
      await staffApi.delete(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Eleman silinemedi:', err);
      setSnackbar({ open: true, message: 'Eleman silinemedi', severity: 'error' });
    }
  };

  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const emp = employees.find((e) => e.id === row.id);
    if (emp) {
      setDetailEmployee(emp);
      setDetailDialogOpen(true);
    }
  };

  const handleLeaveOpen = (emp: ApiEmployee) => {
    setLeaveTarget(emp);
    setLeaveDialogOpen(true);
  };

  const handleResetPassword = async (emp: ApiEmployee) => {
    if (!window.confirm(`${emp.fullName} için yeni şifre üretilsin mi? Eski şifre geçersiz olacak.`)) return;
    try {
      const result = await staffApi.resetPassword(emp.id);
      setResetResult({ fullName: result.fullName, staffNumber: result.staffNumber, newPassword: result.newPassword });
      fetchEmployees();
    } catch {
      setSnackbar({ open: true, message: 'Şifre sıfırlanamadı', severity: 'error' });
    }
  };

  const handleLeaveSave = async (data: {
    employeeId: number; leaveType: string; startDate: string; endDate: string;
    deductFromAnnual: boolean; note: string;
  }) => {
    try {
      await leavesApi.create({
        ...data,
        approvedById: user?.id,
      });
      fetchEmployees(); // İzin bilgileri güncellensin
    } catch (err: unknown) {
      console.error('İzin verilemedi:', err);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'İzin verilemedi', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Elemanlar yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Eleman Yönetimi"
        subtitle={`Toplam ${employees.length} eleman`}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setQrDialogOpen(true)}
            >
              Mesai QR Kodları
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Yeni Eleman
            </Button>
          </>
        }
      />

      <Box sx={{ mt: 2 }}>
        <DataTable
          rows={employees as unknown as { id: number; [key: string]: unknown }[]}
          columns={getColumns(handleDelete, handleLeaveOpen, handleResetPassword)}
          onRowClick={handleRowClick}
          searchable
          searchPlaceholder="Ad, soyad veya personel no ara..."
        />
      </Box>

      <EmployeeAddDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} />
      <AttendanceQRDialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        hotelName={user?.hotelName || 'GrandHotel'}
      />

      <EmployeeDetailDialog
        open={detailDialogOpen}
        onClose={() => { setDetailDialogOpen(false); setDetailEmployee(null); }}
        employee={detailEmployee}
        onSaved={fetchEmployees}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Şifre Sıfırlama Sonuç Dialog */}
      <Dialog open={!!resetResult} onClose={() => setResetResult(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Şifre</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{resetResult?.fullName}</strong> ({resetResult?.staffNumber}) için yeni şifre üretildi.
          </Typography>
          <Box sx={{
            p: 3, bgcolor: '#f0f9ff', border: '2px dashed #3b82f6',
            borderRadius: 2, textAlign: 'center', mb: 2,
          }}>
            <Typography variant="caption" color="text.secondary">YENİ ŞİFRE</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'monospace', color: '#1e40af', letterSpacing: 4 }}>
              {resetResult?.newPassword}
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
            Bu şifre bir daha gösterilmeyecek. Mutlaka not edin veya çalışana iletin.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              if (resetResult) navigator.clipboard.writeText(resetResult.newPassword).catch(() => {});
              setResetResult(null);
            }}
          >
            Kopyala ve Kapat
          </Button>
        </DialogActions>
      </Dialog>

      <LeaveDialog
        open={leaveDialogOpen}
        onClose={() => { setLeaveDialogOpen(false); setLeaveTarget(null); }}
        onSave={handleLeaveSave}
        employee={leaveTarget ? {
          id: leaveTarget.id,
          fullName: leaveTarget.fullName,
          hasWeeklyLeaveThisWeek: leaveTarget.hasWeeklyLeaveThisWeek,
          remainingAnnualLeave: leaveTarget.remainingAnnualLeave,
          annualLeaveEntitlement: leaveTarget.annualLeaveEntitlement,
        } : null}
      />
    </div>
  );
};

export default EmployeeList;

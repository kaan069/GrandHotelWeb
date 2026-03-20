/**
 * EmployeeList - Eleman Yönetimi Sayfası
 *
 * Patron/müdür personel listesini görür, yeni eleman ekleyebilir ve izin verebilir.
 * Veriler backend API'den çekilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Box, Chip, IconButton, Stack, CircularProgress, Typography } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EventAvailable as LeaveIcon,
} from '@mui/icons-material';

import { GridRenderCellParams } from '@mui/x-data-grid';
import { PageHeader, DataTable } from '../../components/common';
import EmployeeAddDialog from '../../components/employees/EmployeeAddDialog';
import LeaveDialog from '../../components/employees/LeaveDialog';
import { ROLE_LABELS } from '../../utils/constants';
import { getYearsOfService } from '../../utils/leaveCalculator';
import { staffApi, leavesApi } from '../../api/services';
import type { ApiEmployee } from '../../api/services';
import useAuth from '../../hooks/useAuth';

const getColumns = (onDelete: (id: number) => void, onLeave: (emp: ApiEmployee) => void) => [
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
    width: 70,
    renderCell: (params: GridRenderCellParams) => (
      <Chip label={params.value} size="small" sx={{ fontFamily: 'monospace', fontWeight: 600 }} />
    ),
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
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<ApiEmployee | null>(null);

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

  const handleSave = async (formData: { firstName: string; lastName: string; roles: string[]; phone: string; password: string; hireDate: string }) => {
    try {
      const maxNum = employees.reduce((max, e) => Math.max(max, Number(e.staffNumber) || 0), 1001);
      await staffApi.create({ ...formData, staffNumber: String(maxNum + 1) });
      fetchEmployees();
    } catch (err: any) {
      console.error('Eleman eklenemedi:', err);
      alert(err?.response?.data?.staffNumber?.[0] || err?.response?.data?.error || 'Eleman eklenemedi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu elemanı silmek istediğinize emin misiniz?')) return;
    try {
      await staffApi.delete(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Eleman silinemedi:', err);
      alert('Eleman silinemedi');
    }
  };

  const handleLeaveOpen = (emp: ApiEmployee) => {
    setLeaveTarget(emp);
    setLeaveDialogOpen(true);
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
    } catch (err: any) {
      console.error('İzin verilemedi:', err);
      alert(err?.response?.data?.error || 'İzin verilemedi');
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Yeni Eleman
          </Button>
        }
      />

      <Box sx={{ mt: 2 }}>
        <DataTable
          rows={employees as unknown as { id: number; [key: string]: unknown }[]}
          columns={getColumns(handleDelete, handleLeaveOpen)}
          searchable
          searchPlaceholder="Ad, soyad veya personel no ara..."
        />
      </Box>

      <EmployeeAddDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} />

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

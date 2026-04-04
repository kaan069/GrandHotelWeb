/**
 * KBS Kayıt Listesi Sayfası
 *
 * KBS'ye bildirilen misafirlerin listesini gösterir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable } from '../../components/common';
import { kbsApi } from '../../api/services';
import type { ApiKbsRecord } from '../../api/services';

const STATUS_LABELS: Record<string, string> = {
  checked_in: 'Bildirildi',
  checked_out: 'Çıkış Verildi',
  failed: 'Hata',
};

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  checked_in: 'success',
  checked_out: 'default',
  failed: 'error',
};

const SYSTEM_LABELS: Record<string, string> = {
  egm: 'EGM',
  jandarma: 'Jandarma',
};

const SYSTEM_COLORS: Record<string, 'primary' | 'secondary'> = {
  egm: 'primary',
  jandarma: 'secondary',
};

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'roomNumber', headerName: 'Oda', width: 80, align: 'center' as const, headerAlign: 'center' as const },
  { field: 'guestName', headerName: 'Misafir', width: 200, flex: 1 },
  { field: 'tcNo', headerName: 'TC No', width: 140 },
  {
    field: 'systemType',
    headerName: 'Sistem',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={SYSTEM_LABELS[params.value] || params.value || '-'}
        size="small"
        color={SYSTEM_COLORS[params.value] || 'default'}
        variant="filled"
      />
    ),
  },
  {
    field: 'status',
    headerName: 'Durum',
    width: 130,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={STATUS_LABELS[params.value] || params.value}
        size="small"
        color={STATUS_COLORS[params.value] || 'default'}
        variant="outlined"
      />
    ),
  },
  { field: 'kbsReference', headerName: 'KBS Referans', width: 180 },
  {
    field: 'sentAt',
    headerName: 'Bildirim Tarihi',
    width: 170,
    valueGetter: (value: string) => value ? new Date(value).toLocaleString('tr-TR') : '-',
  },
  {
    field: 'checkoutAt',
    headerName: 'Çıkış Tarihi',
    width: 170,
    valueGetter: (value: string | null) => value ? new Date(value).toLocaleString('tr-TR') : '-',
  },
];

const KbsRecords: React.FC = () => {
  const [records, setRecords] = useState<ApiKbsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kbsApi.getRecords(statusFilter ? { status: statusFilter } : undefined);
      setRecords(data);
    } catch (err) {
      console.error('KBS kayıtları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div>
      <PageHeader
        title="KBS Kayıtları"
        subtitle={`${records.length} kayıt`}
      />

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        {[
          { value: '', label: 'Tümü' },
          { value: 'checked_in', label: 'Bildirildi' },
          { value: 'checked_out', label: 'Çıkış Verildi' },
        ].map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            variant={statusFilter === f.value ? 'filled' : 'outlined'}
            color={statusFilter === f.value ? 'primary' : 'default'}
            onClick={() => setStatusFilter(f.value)}
            size="small"
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }} color="text.secondary">KBS kayıtları yükleniyor...</Typography>
        </Box>
      ) : (
        <DataTable
          rows={records as unknown as Array<{ id: string | number; [key: string]: unknown }>}
          columns={columns}
          searchable
          searchPlaceholder="Misafir adı veya oda numarası ara..."
        />
      )}
    </div>
  );
};

export default KbsRecords;

/**
 * Firma / acente "Borçlu" listesi sütunları — cari defter (backend apps/accounting/party.py)
 *
 * Cari Bakiye: Σ borç − Σ alacak. Açık Borç: tahsil edilmemiş borç. Avans: kullanılmamış alacak.
 * Konaklayan Açık Hesap: check-in'li rezervasyonların folio bakiyesi (henüz cariye aktarılmadı).
 */

import React from 'react';
import { Chip } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { formatCurrency } from '../../utils/formatters';

export const buildCariDebtorColumns = (nameHeader: string, withCommission = false): GridColDef[] => [
  { field: 'id', headerName: 'ID', width: 60, align: 'center', headerAlign: 'center' },
  {
    field: 'name', headerName: nameHeader, width: 200, flex: 1,
    renderCell: (p: GridRenderCellParams) => <strong style={{ color: '#1565C0' }}>{p.value}</strong>,
  },
  {
    field: 'taxNumber', headerName: 'Vergi No', width: 130,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  ...(withCommission ? [{
    field: 'commissionRate', headerName: 'Komisyon', width: 100, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => `%${Number(p.value || 0)}`,
  } as GridColDef] : []),
  {
    field: 'balance', headerName: 'Cari Bakiye', width: 140, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => (
      <strong style={{ color: '#EF4444' }}>{formatCurrency(Number(p.value))}</strong>
    ),
  },
  {
    field: 'openDebit', headerName: 'Açık Borç', width: 130, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => formatCurrency(Number(p.value)),
  },
  {
    field: 'unallocatedCredit', headerName: 'Avans', width: 110, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => (Number(p.value) > 0
      ? <span style={{ color: '#22C55E' }}>{formatCurrency(Number(p.value))}</span>
      : '-'),
  },
  {
    field: 'openCount', headerName: 'Açık Kayıt', width: 90, align: 'center', headerAlign: 'center',
  },
  {
    field: 'inHouseBalance', headerName: 'Konaklayan Açık Hesap', width: 170, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => (Number(p.value) !== 0 ? formatCurrency(Number(p.value)) : '-'),
  },
  {
    field: 'activeReservations', headerName: 'Konaklayan', width: 100, align: 'center', headerAlign: 'center',
    renderCell: (p: GridRenderCellParams) => (p.value > 0 ? <Chip label={p.value} size="small" color="info" /> : '0'),
  },
];

/**
 * CommissionReport - Komisyon Raporu
 *
 * Garson/personel satış komisyonlarını tarih aralığı ve personel bazında gösterir.
 * Toplamlar ve personel özeti backend'de tüm kayıtlar üzerinden hesaplanır;
 * detay tablosu en fazla 500 satırdır (kırpılırsa uyarı gösterilir).
 * Mobil karşılığı: personelin kendi kazancı (EarningsScreen) + yönetim ekranı.
 *
 * Erişim: patron, müdür, restoran müdürü, muhasebe (backend CanViewCommissions)
 * API: commissionApi.getList → GET /api/commission/list/
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Paid as PaidIcon,
  PointOfSale as SalesIcon,
  ReceiptLong as CountIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';

import { PageHeader, StatCard, DataTable } from '../../components/common';
import { commissionApi, CommissionReport as CommissionReportData } from '../../api/services';
import { getApiErrorMessage } from '../../utils/apiError';

const money = (v: string | number) => `${Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;

const isoDate = (d: Date) => d.toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 1)); };

const columns: GridColDef[] = [
  { field: 'date', headerName: 'Tarih', width: 110, valueGetter: (v: string) => new Date(v).toLocaleDateString('tr-TR') },
  { field: 'employeeName', headerName: 'Personel', flex: 1, minWidth: 160 },
  { field: 'tabNo', headerName: 'Adisyon', width: 110 },
  { field: 'tableNumber', headerName: 'Masa', width: 90 },
  { field: 'tabTotal', headerName: 'Satış', width: 130, align: 'right', headerAlign: 'right', valueGetter: (v: string) => money(v) },
  { field: 'commissionRate', headerName: 'Oran', width: 80, align: 'right', headerAlign: 'right', valueGetter: (v: string) => `%${Number(v)}` },
  { field: 'commissionAmount', headerName: 'Komisyon', width: 130, align: 'right', headerAlign: 'right', valueGetter: (v: string) => money(v) },
];

const CommissionReport: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(isoDate(new Date()));
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [report, setReport] = useState<CommissionReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await commissionApi.getList({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        employeeId: employeeId || undefined,
      }));
    } catch (err) {
      setReport(null);
      setError(getApiErrorMessage(err, 'Komisyon raporu yüklenemedi'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, employeeId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div>
      <PageHeader title="Komisyon Raporu" subtitle="Personel satış komisyonları" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
          <TextField label="Başlangıç" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Bitiş" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField
            select
            label="Personel"
            size="small"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {(report?.byEmployee || []).map((e) => (
              <MenuItem key={e.employeeId} value={e.employeeId}>{e.employeeName}</MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Toplam Satış" value={money(report?.totalSales || 0)} icon={<SalesIcon />} color="primary" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Toplam Komisyon" value={money(report?.totalCommission || 0)} icon={<PaidIcon />} color="success" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Adisyon" value={report?.count ?? 0} icon={<CountIcon />} color="info" loading={loading} />
        </Grid>
      </Grid>

      {report && report.byEmployee.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Personel Özeti</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Personel</TableCell>
                    <TableCell align="right">Adisyon</TableCell>
                    <TableCell align="right">Satış</TableCell>
                    <TableCell align="right">Komisyon</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.byEmployee.map((row) => (
                    <TableRow key={row.employeeId} hover>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right">{money(row.totalSales)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{money(row.totalCommission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {report?.truncated && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Detay tablosunda en yeni 500 kayıt gösteriliyor; yukarıdaki toplamlar tüm kayıtları kapsar. Daha dar bir tarih aralığı seçebilirsiniz.
        </Alert>
      )}

      <DataTable
        rows={(report?.items || []) as unknown as Array<{ id: number; [key: string]: unknown }>}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};

export default CommissionReport;

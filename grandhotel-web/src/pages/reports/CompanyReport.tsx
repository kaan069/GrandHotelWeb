/**
 * CompanyReport - Firma Raporu Sayfası
 *
 * Seçilen firmanın konaklama geçmişi ve folio detayları.
 * API: reportsApi.company(id, filters)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Autocomplete,
} from '@mui/material';
import { companiesApi, reportsApi } from '../../api/services';

const FOLIO_CATEGORY_LABELS: Record<string, string> = {
  room_charge: 'Oda Ücreti',
  minibar: 'Minibar',
  restaurant: 'Restoran',
  service: 'Ekstra Hizmet',
  discount: 'İndirim',
  payment: 'Ödeme',
};

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Rezerve',
  checked_in: 'Konaklıyor',
  checked_out: 'Çıkış Yapıldı',
  cancelled: 'İptal',
};

const CompanyReport: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    companiesApi.getAll().then((data) => setCompanies(data as any[])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCompany) { setReport(null); return; }
    setLoading(true);
    const filters: any = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    reportsApi.company(selectedCompany.id, filters)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCompany, dateFrom, dateTo]);

  const summary = report?.summary || {};

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Firma Raporu</Typography>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Autocomplete
          options={companies}
          getOptionLabel={(c: any) => c.name}
          onChange={(_, val) => setSelectedCompany(val)}
          renderInput={(params) => <TextField {...params} label="Firma Seçin" size="small" sx={{ minWidth: 250 }} />}
        />
        <TextField type="date" size="small" label="Başlangıç" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="Bitiş" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Box>

      {!selectedCompany && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          Rapor görmek için bir firma seçin
        </Typography>
      )}

      {loading && <Typography>Yükleniyor...</Typography>}

      {report && !loading && (
        <>
          {/* Özet Kartları */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Konaklama</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.totalReservations || 0}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Misafir</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.guestCount || 0}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Toplam Tutar</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {(summary.totalAmount || 0).toLocaleString('tr-TR')} ₺
                </Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Ödenen</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {(summary.paidAmount || 0).toLocaleString('tr-TR')} ₺
                </Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Bakiye</Typography>
                <Typography variant="h6" fontWeight={700} color={(summary.balance || 0) > 0 ? 'error.main' : 'success.main'}>
                  {(summary.balance || 0).toLocaleString('tr-TR')} ₺
                </Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          {/* Konaklama Geçmişi */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Konaklama Geçmişi
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Durum</TableCell>
                  <TableCell>Oda</TableCell>
                  <TableCell>Misafirler</TableCell>
                  <TableCell>Giriş</TableCell>
                  <TableCell>Çıkış</TableCell>
                  <TableCell align="right">Toplam</TableCell>
                  <TableCell align="right">Ödenen</TableCell>
                  <TableCell align="right">Bakiye</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(report.reservations || []).map((r: any) => {
                  const total = parseFloat(r.totalAmount || 0);
                  const paid = parseFloat(r.paidAmount || 0);
                  const balance = total - paid;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Chip label={STATUS_LABELS[r.status] || r.status} size="small"
                          color={r.status === 'checked_in' ? 'error' : r.status === 'checked_out' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell><strong>{r.roomNumber}</strong></TableCell>
                      <TableCell>
                        {(r.stays || []).map((s: any) => s.guestName).join(', ') || '-'}
                      </TableCell>
                      <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleDateString('tr-TR') : '-'}</TableCell>
                      <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleDateString('tr-TR') : '-'}</TableCell>
                      <TableCell align="right">{total.toLocaleString('tr-TR')} ₺</TableCell>
                      <TableCell align="right">{paid.toLocaleString('tr-TR')} ₺</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${balance.toLocaleString('tr-TR')} ₺`}
                          size="small"
                          color={balance > 0 ? 'error' : 'success'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!report.reservations || report.reservations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Konaklama kaydı bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default CompanyReport;

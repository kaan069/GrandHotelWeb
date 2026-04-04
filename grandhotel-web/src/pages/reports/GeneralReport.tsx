/**
 * GeneralReport - Genel Rapor Sayfası
 *
 * Ay/tarih aralığı seçimi ile detaylı ciro, satış sayıları,
 * firma/bireysel dağılımı, oda tipi dağılımı, folio kategori dağılımı.
 * API: kazancApi.advancedReport(filters)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { kazancApi } from '../../api/services';
import { FOLIO_CATEGORY_LABELS, BED_TYPE_LABELS } from '../../utils/constants';

interface GeneralReportSummary {
  totalRevenue: number;
  totalPayments: number;
  totalBalance: number;
  byCompany: Array<{ name: string; revenue: number }>;
  byCategory: Record<string, number>;
  byBedType: Record<string, number>;
}

interface GeneralReportSalesCounts {
  companyReservations: number;
  individualReservations: number;
  uniqueRooms: number;
  uniqueGuests: number;
  byBedType: Record<string, number>;
}

interface GeneralReportData {
  summary: GeneralReportSummary;
  salesCounts: GeneralReportSalesCounts;
  reservationCount: number;
}

const MONTHS = [
  { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
  { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' },
  { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
  { value: '07', label: 'Temmuz' }, { value: '08', label: 'Ağustos' },
  { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' },
  { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' },
];

const StatCard: React.FC<{
  title: string; value: string | number; subtitle?: string; color: string; icon?: React.ReactNode;
}> = ({ title, value, subtitle, color, icon }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ textAlign: 'center', py: 2 }}>
      {icon && <Box sx={{ color, mb: 0.5 }}>{icon}</Box>}
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </CardContent>
  </Card>
);

const GeneralReport: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [data, setData] = useState<GeneralReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const categoryMap: Record<string, string | undefined> = {
    all: undefined,
    hotel: 'room_charge',
    restaurant: 'restaurant',
    minibar: 'minibar',
    service: 'service',
  };

  // Ay seçimi değişince tarih aralığını hesapla
  useEffect(() => {
    if (!dateFrom && !dateTo) {
      const y = parseInt(selectedYear);
      const m = parseInt(selectedMonth);
      const start = `${y}-${selectedMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${y}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      setLoading(true);
      kazancApi.advancedReport({ dateFrom: start, dateTo: end, includeDebtors: true, categories: categoryMap[categoryFilter] })
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMonth, selectedYear, categoryFilter]);

  // Tarih aralığı değişince
  useEffect(() => {
    if (dateFrom && dateTo) {
      setLoading(true);
      kazancApi.advancedReport({ dateFrom, dateTo, includeDebtors: true, categories: categoryMap[categoryFilter] })
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [dateFrom, dateTo, categoryFilter]);

  const summary = data?.summary ?? { totalRevenue: 0, totalPayments: 0, totalBalance: 0, byCompany: [], byCategory: {}, byBedType: {} };
  const sales = data?.salesCounts ?? { companyReservations: 0, individualReservations: 0, uniqueRooms: 0, uniqueGuests: 0, byBedType: {} };
  const byCompany = summary.byCompany || [];
  const byCategory = summary.byCategory || {};
  const byBedTypeRevenue = summary.byBedType || {};
  const byBedTypeCount = sales.byBedType || {};

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Genel Rapor</Typography>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField select size="small" label="Ay" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setDateFrom(''); setDateTo(''); }} sx={{ width: 130 }}>
          {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Yıl" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setDateFrom(''); setDateTo(''); }} sx={{ width: 100 }}>
          {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <Divider orientation="vertical" flexItem />
        <TextField type="date" size="small" label="veya Başlangıç" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="Bitiş" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Divider orientation="vertical" flexItem />
        <TextField
          select size="small" label="Gelir Kaynağı" value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ width: 160 }}
        >
          <MenuItem value="all">Tüm Kazançlar</MenuItem>
          <MenuItem value="hotel">Otel (Oda Ücreti)</MenuItem>
          <MenuItem value="restaurant">Kafe / Restoran</MenuItem>
          <MenuItem value="minibar">Minibar</MenuItem>
          <MenuItem value="service">Ekstra Hizmet</MenuItem>
        </TextField>
      </Box>

      {loading && <Typography>Yükleniyor...</Typography>}

      {data && !loading && (
        <>
          {/* Ciro Kartları */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Ciro Özeti</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title="Toplam Gelir" value={`${(summary.totalRevenue || 0).toLocaleString('tr-TR')} ₺`} color="#2E7D32" icon={<MoneyIcon />} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title="Toplam Tahsilat" value={`${(summary.totalPayments || 0).toLocaleString('tr-TR')} ₺`} color="#1565C0" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title="Bakiye" value={`${(summary.totalBalance || 0).toLocaleString('tr-TR')} ₺`} color={summary.totalBalance > 0 ? '#C62828' : '#2E7D32'} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title="Konaklama Sayısı" value={data.reservationCount || 0} color="#6A1B9A" icon={<HotelIcon />} />
            </Grid>
          </Grid>

          {/* Satış Sayıları */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Satış Detayları</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard title="Firma Konaklama" value={sales.companyReservations || 0} color="#1565C0" icon={<BusinessIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard title="Bireysel Konaklama" value={sales.individualReservations || 0} color="#FF6F00" icon={<PersonIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard title="Farklı Oda" value={sales.uniqueRooms || 0} color="#6A1B9A" />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard title="Farklı Misafir" value={sales.uniqueGuests || 0} color="#00695C" icon={<PeopleIcon />} />
            </Grid>
          </Grid>

          {/* Oda Tipi Dağılımı */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Oda Tipi Dağılımı</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Oda Tipi</TableCell>
                  <TableCell align="right">Satış Adedi</TableCell>
                  <TableCell align="right">Gelir</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys({ ...byBedTypeCount, ...byBedTypeRevenue }).map((bt) => (
                  <TableRow key={bt}>
                    <TableCell>{BED_TYPE_LABELS[bt] || bt}</TableCell>
                    <TableCell align="right"><strong>{byBedTypeCount[bt] || 0}</strong></TableCell>
                    <TableCell align="right">{(byBedTypeRevenue[bt] || 0).toLocaleString('tr-TR')} ₺</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Firma Dağılımı */}
          {byCompany.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Firma / Bireysel Dağılımı</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Firma</TableCell>
                      <TableCell align="right">Gelir</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {byCompany.map((c: { name: string; revenue: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell align="right"><strong>{(c.revenue || 0).toLocaleString('tr-TR')} ₺</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Folio Kategori Dağılımı */}
          {Object.keys(byCategory).length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Folio Kategori Dağılımı</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(byCategory).map(([cat, amount]) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {FOLIO_CATEGORY_LABELS[cat] || cat}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {(amount as number).toLocaleString('tr-TR')} ₺
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default GeneralReport;

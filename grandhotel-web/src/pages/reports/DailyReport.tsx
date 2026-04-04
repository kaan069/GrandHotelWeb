/**
 * DailyReport - Günlük Özet Raporu
 *
 * Doluluk, folio gelir dağılımı, giriş-çıkış sayıları ve dolu oda detayları.
 * API: kazancApi.dailySummary(date)
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
} from '@mui/material';
import {
  Hotel as HotelIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { kazancApi } from '../../api/services';
import { FOLIO_CATEGORY_LABELS, BED_TYPE_LABELS } from '../../utils/constants';

interface DailyReportOccupancy {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  reservedRooms: number;
  dirtyRooms: number;
  occupancyRate: number;
  singleOccupied: number;
  doubleOccupied: number;
}

interface DailyReportRevenue {
  net: number;
  payments: number;
  balance: number;
}

interface DailyReportRoomDetail {
  roomNumber: string;
  bedType: string;
  guestName: string;
  companyName?: string;
  checkIn?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
}

interface DailyReportData {
  occupancy: DailyReportOccupancy;
  revenue: DailyReportRevenue;
  folioBreakdown: Record<string, number>;
  occupiedRoomDetails: DailyReportRoomDetail[];
  checkinCount: number;
  checkoutCount: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon?: React.ReactNode;
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

const DailyReport: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    kazancApi.dailySummary(date)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  if (loading || !data) {
    return <Box sx={{ p: 3 }}><Typography>Yükleniyor...</Typography></Box>;
  }

  const occ = data.occupancy ?? { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, reservedRooms: 0, dirtyRooms: 0, occupancyRate: 0, singleOccupied: 0, doubleOccupied: 0 };
  const rev = data.revenue ?? { net: 0, payments: 0, balance: 0 };
  const breakdown = data.folioBreakdown || {};
  const rooms = data.occupiedRoomDetails || [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Başlık + Tarih */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Günlük Özet Rapor</Typography>
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          sx={{ width: 180 }}
        />
      </Box>

      {/* Doluluk Kartları */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Doluluk</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Toplam Oda" value={occ.totalRooms || 0} color="#1565C0" icon={<HotelIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Dolu" value={occ.occupiedRooms || 0} color="#C62828" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Müsait" value={occ.availableRooms || 0} color="#2E7D32" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Rezerve" value={occ.reservedRooms || 0} color="#1565C0" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard title="Kirli" value={occ.dirtyRooms || 0} color="#795548" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            title="Doluluk Oranı"
            value={`%${occ.occupancyRate || 0}`}
            subtitle={`Tek: ${occ.singleOccupied || 0} · Çift: ${occ.doubleOccupied || 0}`}
            color="#6A1B9A"
            icon={<TrendingIcon />}
          />
        </Grid>
      </Grid>

      {/* Gelir Kartları */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Gelir Özeti</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard title="Net Gelir" value={`${(rev.net || 0).toLocaleString('tr-TR')} ₺`} color="#2E7D32" icon={<MoneyIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard title="Tahsilat" value={`${(rev.payments || 0).toLocaleString('tr-TR')} ₺`} color="#1565C0" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard title="Bakiye" value={`${(rev.balance || 0).toLocaleString('tr-TR')} ₺`} color={rev.balance > 0 ? '#C62828' : '#2E7D32'} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StatCard
            title="Giriş / Çıkış"
            value={`${data.checkinCount || 0} / ${data.checkoutCount || 0}`}
            color="#FF6F00"
            icon={<PeopleIcon />}
          />
        </Grid>
      </Grid>

      {/* Folio Kategori Dağılımı */}
      {Object.keys(breakdown).length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Folio Kategori Dağılımı</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(breakdown).map(([cat, amount]) => (
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

      {/* Dolu Oda Tablosu */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Dolu Odalar ({rooms.length})
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Oda</TableCell>
              <TableCell>Tip</TableCell>
              <TableCell>Misafir</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Giriş</TableCell>
              <TableCell align="right">Toplam</TableCell>
              <TableCell align="right">Ödenen</TableCell>
              <TableCell align="right">Bakiye</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((r, i) => (
              <TableRow key={i}>
                <TableCell><strong>{r.roomNumber}</strong></TableCell>
                <TableCell>{BED_TYPE_LABELS[r.bedType] || r.bedType}</TableCell>
                <TableCell>{r.guestName}</TableCell>
                <TableCell>{r.companyName || '-'}</TableCell>
                <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell align="right">{r.totalAmount.toLocaleString('tr-TR')} ₺</TableCell>
                <TableCell align="right">{r.paidAmount.toLocaleString('tr-TR')} ₺</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${r.balance.toLocaleString('tr-TR')} ₺`}
                    size="small"
                    color={r.balance > 0 ? 'error' : 'success'}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Dolu oda bulunmuyor
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DailyReport;

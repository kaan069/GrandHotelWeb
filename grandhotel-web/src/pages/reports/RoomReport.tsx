/**
 * RoomReport - Oda Raporu Sayfası
 *
 * Seçilen odanın konaklama geçmişi ve folio detayları.
 * API: reportsApi.room(id, filters)
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
import { roomsApi, reportsApi } from '../../api/services';

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

const RoomReport: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    roomsApi.getAll().then((data) => setRooms(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRoom) { setReport(null); return; }
    setLoading(true);
    const filters: any = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    reportsApi.room(selectedRoom.id, filters)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRoom, dateFrom, dateTo]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Oda Raporu</Typography>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Autocomplete
          options={rooms}
          getOptionLabel={(r: any) => `${r.roomNumber} - Kat ${r.floor}`}
          onChange={(_, val) => setSelectedRoom(val)}
          renderInput={(params) => <TextField {...params} label="Oda Seçin" size="small" sx={{ minWidth: 200 }} />}
        />
        <TextField type="date" size="small" label="Başlangıç" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="Bitiş" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Box>

      {!selectedRoom && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          Rapor görmek için bir oda seçin
        </Typography>
      )}

      {loading && <Typography>Yükleniyor...</Typography>}

      {report && !loading && (
        <>
          {/* Özet */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Toplam Konaklama</Typography>
                <Typography variant="h5" fontWeight={700}>{report.summary?.totalReservations || 0}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Toplam Gelir</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {(report.summary?.totalRevenue || 0).toLocaleString('tr-TR')} ₺
                </Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card><CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Durum</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {report.summary?.isCurrentlyOccupied ? 'Dolu' : 'Boş'}
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
                  <TableCell>Misafirler</TableCell>
                  <TableCell>Firma</TableCell>
                  <TableCell>Giriş</TableCell>
                  <TableCell>Çıkış</TableCell>
                  <TableCell>Not</TableCell>
                  <TableCell align="right">Toplam</TableCell>
                  <TableCell align="right">Ödenen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(report.reservations || []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Chip label={STATUS_LABELS[r.status] || r.status} size="small"
                        color={r.status === 'checked_in' ? 'error' : r.status === 'checked_out' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {(r.stays || []).map((s: any) => s.guestName).join(', ') || '-'}
                    </TableCell>
                    <TableCell>{r.companyName || '-'}</TableCell>
                    <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleDateString('tr-TR') : '-'}</TableCell>
                    <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleDateString('tr-TR') : '-'}</TableCell>
                    <TableCell>{r.notes || '-'}</TableCell>
                    <TableCell align="right">{parseFloat(r.totalAmount || 0).toLocaleString('tr-TR')} ₺</TableCell>
                    <TableCell align="right">{parseFloat(r.paidAmount || 0).toLocaleString('tr-TR')} ₺</TableCell>
                  </TableRow>
                ))}
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

export default RoomReport;

/**
 * NightAuditReport - Gün Sonu Raporları
 *
 * Mesai devir kayıtlarını tarih bazlı listeler.
 * Her devir kaydının satış, oda ve kasa bilgilerini gösterir.
 * API: shiftApi.getAll()
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  NightsStay as NightsStayIcon,
  CreditCard as CardIcon,
  Payments as CashIcon,
  AttachMoney as TotalIcon,
  MeetingRoom as RoomIcon,
  Hotel as OccupiedIcon,
  DoorFront as AvailableIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';

import { PageHeader, StatCard } from '../../components/common';
import { ShiftHandover } from '../../utils/constants';
import { shiftApi } from '../../api/services';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number): string => {
  return `${Number(amount).toLocaleString('tr-TR')} ₺`;
};

const NightAuditReport: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedShift, setSelectedShift] = useState<ShiftHandover | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: 'closed' };
      if (dateFilter) params.date = dateFilter;
      const data = await shiftApi.getAll(params);
      setShifts(data);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Özet istatistikler
  const totalCardSales = shifts.reduce((sum, s) => sum + Number(s.cardSales), 0);
  const totalCashSales = shifts.reduce((sum, s) => sum + Number(s.cashSales), 0);
  const totalSales = shifts.reduce((sum, s) => sum + Number(s.totalSales), 0);
  const totalRoomsSold = shifts.reduce((sum, s) => sum + s.roomsSold, 0);

  // Tarihe göre grupla
  const groupedByDate = shifts.reduce<Record<string, ShiftHandover[]>>((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Gün Sonu Raporları"
        subtitle="Mesai devir kayıtlarını ve gün sonu istatistiklerini görüntüleyin"
      />

      {/* Filtre */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
          <NightsStayIcon color="primary" />
          <TextField
            label="Tarih Filtresi"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
          {dateFilter && (
            <Button size="small" onClick={() => setDateFilter('')}>
              Temizle
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {shifts.length} kayıt
          </Typography>
        </CardContent>
      </Card>

      {/* Özet istatistikler */}
      {shifts.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Kart Satışı" value={formatCurrency(totalCardSales)} icon={<CardIcon />} color="primary" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Nakit Satışı" value={formatCurrency(totalCashSales)} icon={<CashIcon />} color="success" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Toplam Satış" value={formatCurrency(totalSales)} icon={<TotalIcon />} color="secondary" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Satılan Oda" value={totalRoomsSold} icon={<RoomIcon />} color="info" />
          </Grid>
        </Grid>
      )}

      {/* Kayıtlar */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <NightsStayIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {dateFilter ? 'Bu tarihte kayıt bulunamadı.' : 'Henüz gün sonu kaydı bulunmuyor.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            {Object.entries(groupedByDate).map(([date, dateShifts]) => (
              <Box key={date} sx={{ mb: 3 }}>
                <Chip
                  label={formatDate(date)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1, fontWeight: 600 }}
                />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Devreden</TableCell>
                        <TableCell>Devralan</TableCell>
                        <TableCell>Başlangıç</TableCell>
                        <TableCell>Bitiş</TableCell>
                        <TableCell align="right">Kart</TableCell>
                        <TableCell align="right">Nakit</TableCell>
                        <TableCell align="right">Toplam</TableCell>
                        <TableCell align="right">Oda</TableCell>
                        <TableCell align="center">Detay</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dateShifts.map((shift) => (
                        <TableRow
                          key={shift.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => { setSelectedShift(shift); setDetailOpen(true); }}
                        >
                          <TableCell>{shift.fromUser}</TableCell>
                          <TableCell>{shift.toUser}</TableCell>
                          <TableCell>{formatTime(shift.startTime)}</TableCell>
                          <TableCell>{shift.endTime ? formatTime(shift.endTime) : '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(shift.cardSales)}</TableCell>
                          <TableCell align="right">{formatCurrency(shift.cashSales)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(shift.totalSales)}</TableCell>
                          <TableCell align="right">{shift.roomsSold}</TableCell>
                          <TableCell align="center">
                            <Button size="small">Görüntüle</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detay Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedShift && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapHorizIcon color="primary" />
              Gün Sonu Detayı — {formatDate(selectedShift.date)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Devreden</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedShift.fromUser}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Devralan</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedShift.toUser}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Başlangıç</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(selectedShift.startTime)} {formatTime(selectedShift.startTime)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Bitiş</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedShift.endTime
                      ? `${formatDate(selectedShift.endTime)} ${formatTime(selectedShift.endTime)}`
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Kasa Özeti</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <CardIcon color="primary" sx={{ fontSize: 28 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Kart Satışı</Typography>
                      <Typography variant="h6" fontWeight={700}>{formatCurrency(selectedShift.cardSales)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <CashIcon color="success" sx={{ fontSize: 28 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Nakit Satışı</Typography>
                      <Typography variant="h6" fontWeight={700}>{formatCurrency(selectedShift.cashSales)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <TotalIcon color="secondary" sx={{ fontSize: 28 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Toplam Satış</Typography>
                      <Typography variant="h6" fontWeight={700}>{formatCurrency(selectedShift.totalSales)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <RoomIcon color="info" sx={{ fontSize: 28 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Satılan Oda</Typography>
                      <Typography variant="h6" fontWeight={700}>{selectedShift.roomsSold}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {(selectedShift.roomsOccupied !== undefined) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Oda Durumu</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <OccupiedIcon color="warning" sx={{ fontSize: 28 }} />
                          <Typography variant="caption" display="block" color="text.secondary">Dolu Oda</Typography>
                          <Typography variant="h6" fontWeight={700}>{selectedShift.roomsOccupied}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <AvailableIcon color="success" sx={{ fontSize: 28 }} />
                          <Typography variant="caption" display="block" color="text.secondary">Boş Oda</Typography>
                          <Typography variant="h6" fontWeight={700}>{selectedShift.roomsAvailable}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {selectedShift.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Notlar</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedShift.notes}</Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)} color="inherit">Kapat</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default NightAuditReport;

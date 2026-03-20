/**
 * ShiftHandover Sayfası - Mesai Devir İşlemleri
 *
 * Resepsiyon personeli mesai devir kayıtlarını görüntüler ve yönetir.
 * Aktif devri kapatabilir, geçmiş devirlerin detaylarını görebilir.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  CreditCard as CardIcon,
  Payments as CashIcon,
  AttachMoney as TotalIcon,
  MeetingRoom as RoomIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

import { PageHeader, StatCard } from '../../components/common';
import { ShiftHandover as ShiftHandoverType } from '../../utils/constants';
import { loadShifts, closeShift, getActiveShift } from '../../utils/shiftStorage';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('tr-TR')} ₺`;
};

const ShiftHandover: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftHandoverType[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftHandoverType | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftHandoverType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setShifts(loadShifts());
    setActiveShift(getActiveShift());
  };

  /** Mesaiyi kapat */
  const handleCloseShift = () => {
    if (activeShift) {
      closeShift(activeShift.id);
      refreshData();
    }
  };

  /** Geçmiş devir detayını aç */
  const handleOpenDetail = (shift: ShiftHandoverType) => {
    setSelectedShift(shift);
    setDetailOpen(true);
  };

  const closedShifts = shifts
    .filter((s) => s.status === 'closed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Tarihe göre grupla
  const groupedByDate = closedShifts.reduce<Record<string, ShiftHandoverType[]>>((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Mesai Devir İşlemleri"
        subtitle="Mesai devir kayıtlarını görüntüleyin ve yönetin"
      />

      {/* Aktif Mesai */}
      {activeShift && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'success.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHorizIcon color="success" />
                Aktif Mesai
                <Chip label="Devam Ediyor" color="success" size="small" />
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseShift}
                startIcon={<CheckIcon />}
              >
                Mesaiyi Kapat
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Devreden</Typography>
                  <Typography variant="body1" fontWeight={600}>{activeShift.fromUser}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Devralan</Typography>
                  <Typography variant="body1" fontWeight={600}>{activeShift.toUser}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Başlangıç</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(activeShift.startTime)} {formatTime(activeShift.startTime)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tarih</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatDate(activeShift.date)}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Aktif mesai satış özeti */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard
                  title="Kart Satışı"
                  value={formatCurrency(activeShift.cardSales)}
                  icon={<CardIcon />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard
                  title="Nakit Satışı"
                  value={formatCurrency(activeShift.cashSales)}
                  icon={<CashIcon />}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard
                  title="Toplam Satış"
                  value={formatCurrency(activeShift.totalSales)}
                  icon={<TotalIcon />}
                  color="secondary"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard
                  title="Satılan Oda"
                  value={activeShift.roomsSold}
                  icon={<RoomIcon />}
                  color="info"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Aktif mesai yoksa bilgi */}
      {!activeShift && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SwapHorizIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Aktif mesai devri bulunmuyor. Header'daki "Mesai Devret" butonunu kullanarak yeni bir devir başlatabilirsiniz.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Geçmiş Devirler */}
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon color="primary" />
            Geçmiş Devirler
          </Typography>

          {Object.keys(groupedByDate).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Henüz geçmiş devir kaydı bulunmuyor.
            </Typography>
          ) : (
            Object.entries(groupedByDate).map(([date, dateShifts]) => (
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
                        <TableCell align="right">Toplam Satış</TableCell>
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
                          onClick={() => handleOpenDetail(shift)}
                        >
                          <TableCell>{shift.fromUser}</TableCell>
                          <TableCell>{shift.toUser}</TableCell>
                          <TableCell>{formatTime(shift.startTime)}</TableCell>
                          <TableCell>{shift.endTime ? formatTime(shift.endTime) : '-'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(shift.totalSales)}
                          </TableCell>
                          <TableCell align="right">{shift.roomsSold}</TableCell>
                          <TableCell align="center">
                            <Button size="small" onClick={() => handleOpenDetail(shift)}>
                              Görüntüle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Detay Popup */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedShift && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapHorizIcon color="primary" />
              Mesai Devir Detayı - {formatDate(selectedShift.date)}
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
                      : 'Devam ediyor'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Satış Özeti</Typography>
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

export default ShiftHandover;

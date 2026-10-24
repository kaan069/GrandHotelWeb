/**
 * ShiftHandover Sayfası - Mesai Devir İşlemleri
 *
 * Mesai devir kayıtlarını görüntüler ve yönetir.
 * Kart / nakit / diğer tahsilat elle girilmez: backend mesai süresince alınan folio ödemeleri
 * ve cari tahsilatlarını ödeme yöntemine göre toplar (staff/views.py shift_summary).
 * Aktif mesaide şu ana kadarki özet ("live") gösterilir; kapanışta aynı değerler kaydedilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  CreditCard as CardIcon,
  Payments as CashIcon,
  AttachMoney as TotalIcon,
  MeetingRoom as RoomIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Hotel as OccupiedIcon,
  DoorFront as AvailableIcon,
  AccountBalance as OtherIcon,
} from '@mui/icons-material';

import { PageHeader, ServerTablePagination } from '../../components/common';
import useServerTable from '../../hooks/useServerTable';
import { shiftApi } from '../../api/services';
import { ShiftHandover as ShiftHandoverType } from '../../utils/constants';
import { closeShift, getActiveShift } from '../../utils/shiftStorage';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number | string | undefined): string => {
  return `${(Number(amount) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
};

/** Satış özeti kartları (aktif mesai canlı özeti ve geçmiş mesai detayı) */
const SalesSummary: React.FC<{
  totalSales: number | string;
  cashSales: number | string;
  cardSales: number | string;
  otherSales?: number | string;
  roomsSold: number;
}> = ({ totalSales, cashSales, cardSales, otherSales, roomsSold }) => {
  const items = [
    { label: 'Toplam Satış', value: formatCurrency(totalSales), icon: <TotalIcon color="secondary" sx={{ fontSize: 28 }} /> },
    { label: 'Nakit Tahsilat', value: formatCurrency(cashSales), icon: <CashIcon color="success" sx={{ fontSize: 28 }} /> },
    { label: 'Kart Tahsilat', value: formatCurrency(cardSales), icon: <CardIcon color="primary" sx={{ fontSize: 28 }} /> },
    { label: 'Havale / Diğer', value: formatCurrency(otherSales), icon: <OtherIcon color="action" sx={{ fontSize: 28 }} /> },
    { label: 'Satılan Oda', value: String(roomsSold), icon: <RoomIcon color="info" sx={{ fontSize: 28 }} /> },
  ];
  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.label} size={{ xs: 6, md: 'grow' }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              {item.icon}
              <Typography variant="caption" display="block" color="text.secondary">{item.label}</Typography>
              <Typography variant="h6" fontWeight={700}>{item.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const ShiftHandover: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [activeShift, setActiveShift] = useState<ShiftHandoverType | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftHandoverType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  /* Geçmiş (kapanmış) mesailer sayfa sayfa, en yeni önce */
  const history = useServerTable((p) => shiftApi.getPage({ ...p, status: 'closed' }), [], 10);

  const refreshData = useCallback(async () => {
    try {
      setActiveShift(await getActiveShift());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setClosing(true);
    try {
      await closeShift(activeShift.id, closeNotes.trim() || undefined);
      setCloseDialogOpen(false);
      setCloseNotes('');
      showSuccess('Mesai kapatıldı');
      await refreshData();
      history.refresh();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Mesai kapatılamadı'));
    } finally {
      setClosing(false);
    }
  };

  /* Kapatma penceresi açılırken canlı özeti tazele (kaydedilecek tutarlar güncel görünsün) */
  const openCloseDialog = async () => {
    setCloseDialogOpen(true);
    const active = await getActiveShift();
    if (active) setActiveShift(active);
  };

  const handleOpenDetail = (shift: ShiftHandoverType) => {
    setSelectedShift(shift);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const closedShifts = history.rows;

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
                onClick={openCloseDialog}
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

            {activeShift.live && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
                  Mesai başından bu yana (ödeme yöntemine göre otomatik)
                </Typography>
                <SalesSummary {...activeShift.live} />
              </>
            )}
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
          {history.rowCount > 0 && <ServerTablePagination server={history.server} />}
        </CardContent>
      </Card>

      {/* Mesai Kapat Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mesaiyi Kapat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tutarlar mesai süresince alınan ödemelerden ve cari tahsilatlarından otomatik hesaplanır.
            Kasayı aşağıdaki nakit tutarla karşılaştırın.
          </Typography>
          {activeShift?.live && <SalesSummary {...activeShift.live} />}
          <TextField
            label="Not (opsiyonel)"
            fullWidth
            multiline
            rows={2}
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCloseShift} variant="contained" color="error" disabled={closing}>
            {closing ? <CircularProgress size={20} /> : 'Mesaiyi Kapat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detay Popup */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
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
              <SalesSummary
                totalSales={selectedShift.totalSales}
                cashSales={selectedShift.cashSales}
                cardSales={selectedShift.cardSales}
                otherSales={selectedShift.otherSales}
                roomsSold={selectedShift.roomsSold}
              />

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

export default ShiftHandover;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  ButtonGroup,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  Today as TodayIcon,
  Hotel as HotelIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { BED_TYPE_LABELS, RoomGuest } from '../../utils/constants';
import { reservationsApi } from '../../api/services';
import type { ApiReservation } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';

interface OccupancyRoom {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  price: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
}

interface OccupancyReportDialogProps {
  open: boolean;
  onClose: () => void;
  rooms: OccupancyRoom[];
  canViewFinancials: boolean;
}

interface RoomReportRow {
  roomNumber: string;
  bedType: string;
  guests: string;
  company: string;
  nightlyRate: number;
  totalCharge: number;
  totalPayment: number;
  balance: number;
  checkInDate?: string;
}

type ReportMode = 'current' | 'dateRange' | 'today';

const OccupancyReportDialog: React.FC<OccupancyReportDialogProps> = ({ open, onClose, rooms, canViewFinancials }) => {
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ReportMode>('current');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Tutarlar rezervasyon kaydından (backend refresh_totals): toplam = ücretler − indirim,
     ödenen = ödemeler + cariye aktarılan − cariye alacak yazılan → bakiye = folio bakiyesi */
  const fetchReservations = useCallback(async (filters: Parameters<typeof reservationsApi.getAll>[0]) => {
    setLoading(true);
    try {
      setReservations(await reservationsApi.getAll(filters));
    } catch (err) {
      console.error('Rapor verileri yüklenirken hata:', err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reportRows: RoomReportRow[] = useMemo(() => {
    const roomById = new Map(rooms.map((r) => [r.id, r]));
    return reservations
      .map((r) => {
        const room = roomById.get(r.roomId);
        const total = parseFloat(r.totalAmount) || 0;
        const paid = parseFloat(r.paidAmount) || 0;
        return {
          roomNumber: r.roomNumber,
          bedType: room ? (BED_TYPE_LABELS[room.bedType] || room.bedType) : '-',
          guests: r.guestNames || r.placeholderGuestName || '-',
          company: r.companyName || r.agencyName || '-',
          // Geçmiş konaklamada odanın bugünkü fiyatı yanıltıcı olur → sadece anlık raporda
          nightlyRate: mode === 'current' ? room?.price || 0 : 0,
          totalCharge: total,
          totalPayment: paid,
          balance: total - paid,
          checkInDate: r.checkIn,
        };
      })
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'tr', { numeric: true }));
  }, [reservations, rooms, mode]);

  /* Anlık rapor: dialog açılınca / moda dönünce konaklayanlar yüklenir */
  useEffect(() => {
    if (!open) {
      setReservations([]);
      return;
    }
    if (mode === 'current') {
      fetchReservations({ status: 'checked_in' });
    }
  }, [open, mode, fetchReservations]);

  const fetchDateRangeReport = (from: string, to: string) =>
    fetchReservations({ dateFrom: from, dateTo: to, status: 'checked_in,checked_out' });

  const handleSearch = () => {
    if (!dateFrom || !dateTo) return;
    setMode('dateRange');
    fetchDateRangeReport(dateFrom, dateTo);
  };

  const handleToday = () => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    setDateFrom(todayStr);
    setDateTo(todayStr);
    setMode('today');
    fetchDateRangeReport(todayStr, todayStr);
  };

  const handleCurrentMode = () => {
    setMode('current');
    setDateFrom('');
    setDateTo('');
  };

  const isDateMode = mode === 'dateRange' || mode === 'today';

  const totals = reportRows.reduce(
    (acc, row) => ({
      nightlyRate: acc.nightlyRate + row.nightlyRate,
      totalCharge: acc.totalCharge + row.totalCharge,
      totalPayment: acc.totalPayment + row.totalPayment,
      balance: acc.balance + row.balance,
    }),
    { nightlyRate: 0, totalCharge: 0, totalPayment: 0, balance: 0 }
  );

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const getSubtitle = () => {
    if (mode === 'today') return `Bugün giriş yapan odalar: ${reportRows.length}`;
    if (mode === 'dateRange') {
      const from = dayjs(dateFrom).format('DD.MM.YYYY');
      const to = dayjs(dateTo).format('DD.MM.YYYY');
      return `${from} - ${to} arası giriş yapan odalar: ${reportRows.length}`;
    }
    return `Dolu Oda: ${reportRows.length} / ${rooms.length}`;
  };

  const hasNoData = reportRows.length === 0;
  const noDataMessage = mode === 'current'
    ? 'Şu anda dolu oda bulunmuyor.'
    : mode === 'today'
      ? 'Bugün giriş yapan oda bulunmuyor.'
      : 'Seçilen tarih aralığında giriş yapan oda bulunmuyor.';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #occupancy-report, #occupancy-report * { visibility: visible !important; }
          #occupancy-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <DialogTitle className="no-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="info" />
            <Typography variant="h6" component="span">Konaklama Raporu</Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint}>
            Yazdır
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box id="occupancy-report">
          <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center' } }}>
            <Typography variant="h5" fontWeight={700}>GrandHotel - Konaklama Raporu</Typography>
            <Typography variant="body2" color="text.secondary">{today}</Typography>
          </Box>

          {/* Filtre Alanı */}
          <Box className="no-print" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <TextField
              type="date"
              size="small"
              label="Başlangıç"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              type="date"
              size="small"
              label="Bitiş"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!dateFrom || !dateTo}
            >
              Ara
            </Button>
            <ButtonGroup size="small" variant="outlined">
              <Button
                startIcon={<TodayIcon />}
                onClick={handleToday}
                variant={mode === 'today' ? 'contained' : 'outlined'}
              >
                Bugün
              </Button>
              <Button
                startIcon={<HotelIcon />}
                onClick={handleCurrentMode}
                variant={mode === 'current' ? 'contained' : 'outlined'}
              >
                Mevcut Konaklama
              </Button>
            </ButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Tarih: {today}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {getSubtitle()}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Rapor verileri yükleniyor...
              </Typography>
            </Box>
          ) : hasNoData && !loading ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {noDataMessage}
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Oda No</TableCell>
                    {isDateMode && <TableCell sx={{ fontWeight: 600 }}>Giriş Tarihi</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Yatak Tipi</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Konuklar</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Firma</TableCell>
                    {canViewFinancials && (
                      <>
                        {!isDateMode && <TableCell sx={{ fontWeight: 600 }} align="right">Gecelik Ücret</TableCell>}
                        <TableCell sx={{ fontWeight: 600 }} align="right">Ödenen</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Borç/Bakiye</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportRows.map((row, idx) => (
                    <TableRow key={`${row.roomNumber}-${idx}`}>
                      <TableCell>
                        <Chip label={row.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      {isDateMode && (
                        <TableCell>
                          {row.checkInDate ? dayjs(row.checkInDate).format('DD.MM.YYYY HH:mm') : '-'}
                        </TableCell>
                      )}
                      <TableCell>{row.bedType}</TableCell>
                      <TableCell>{row.guests}</TableCell>
                      <TableCell>{row.company}</TableCell>
                      {canViewFinancials && (
                        <>
                          {!isDateMode && <TableCell align="right">{formatCurrency(row.nightlyRate)}</TableCell>}
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            {formatCurrency(row.totalPayment)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 600, color: row.balance > 0 ? 'error.main' : 'success.main' }}
                          >
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {canViewFinancials && reportRows.length > 0 && (
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell colSpan={isDateMode ? 5 : 4} sx={{ fontWeight: 700 }}>TOPLAM</TableCell>
                      {!isDateMode && (
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(totals.nightlyRate)}
                        </TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(totals.totalPayment)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: totals.balance > 0 ? 'error.main' : 'success.main' }}
                      >
                        {formatCurrency(totals.balance)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="no-print">
        <Button onClick={onClose} color="inherit">Kapat</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Yazdır
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OccupancyReportDialog;

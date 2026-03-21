import React, { useState, useEffect, useCallback } from 'react';
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

import { ROOM_STATUS, BED_TYPE_LABELS, RoomGuest } from '../../utils/constants';
import { foliosApi, companiesApi, guestsApi, reservationsApi } from '../../api/services';
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
  const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUS.OCCUPIED);
  const [reportRows, setReportRows] = useState<RoomReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ReportMode>('current');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchCurrentReport = useCallback(async () => {
    if (occupiedRooms.length === 0) {
      setReportRows([]);
      return;
    }

    setLoading(true);
    try {
      const [companiesData, allGuestsData] = await Promise.all([
        companiesApi.getAll(),
        guestsApi.getAll(),
      ]);

      const rows: RoomReportRow[] = await Promise.all(
        occupiedRooms.map(async (room) => {
          const folios = await foliosApi.getForRoom(room.id);
          const guestNames = room.guests && room.guests.length > 0
            ? room.guests.map((g) => g.guestName).join(', ')
            : room.guestName || '-';

          let companyName = '-';
          if (room.guests && room.guests.length > 0) {
            for (const rg of room.guests) {
              const guest = allGuestsData.find((g) => g.id === rg.guestId);
              if (guest?.companyId) {
                const comp = companiesData.find((c) => c.id === guest.companyId);
                if (comp) { companyName = comp.name; break; }
              }
            }
          }

          const totalCharge = folios
            .filter((f) => f.category !== 'payment' && f.category !== 'discount')
            .reduce((sum, f) => sum + Number(f.amount), 0);
          const totalDiscount = folios
            .filter((f) => f.category === 'discount')
            .reduce((sum, f) => sum + Number(f.amount), 0);
          const totalPayment = folios
            .filter((f) => f.category === 'payment')
            .reduce((sum, f) => sum + Number(f.amount), 0);
          const balance = totalCharge - totalDiscount - totalPayment;

          return {
            roomNumber: room.roomNumber,
            bedType: BED_TYPE_LABELS[room.bedType] || room.bedType,
            guests: guestNames,
            company: companyName,
            nightlyRate: room.price,
            totalCharge: totalCharge - totalDiscount,
            totalPayment,
            balance,
          };
        })
      );

      setReportRows(rows);
    } catch (err) {
      console.error('Rapor verileri yüklenirken hata:', err);
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  }, [rooms]);

  const fetchDateRangeReport = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const reservations = await reservationsApi.getAll({
        dateFrom: from,
        dateTo: to,
        status: 'checked_in,checked_out',
      });

      if (reservations.length === 0) {
        setReportRows([]);
        return;
      }

      const details = await Promise.all(
        reservations.map((r) => reservationsApi.getById(r.id))
      );

      const rows: RoomReportRow[] = details.map((detail) => {
        const guestNames = detail.stays.map((s) => s.guestName).join(', ') || '-';

        const totalCharge = detail.folioItems
          .filter((f) => f.category !== 'payment' && f.category !== 'discount')
          .reduce((sum, f) => sum + Number(f.amount), 0);
        const totalDiscount = detail.folioItems
          .filter((f) => f.category === 'discount')
          .reduce((sum, f) => sum + Number(f.amount), 0);
        const totalPayment = detail.folioItems
          .filter((f) => f.category === 'payment')
          .reduce((sum, f) => sum + Number(f.amount), 0);
        const balance = totalCharge - totalDiscount - totalPayment;

        return {
          roomNumber: detail.roomNumber,
          bedType: BED_TYPE_LABELS[detail.roomNumber] || '-',
          guests: guestNames,
          company: detail.companyName || '-',
          nightlyRate: 0,
          totalCharge: totalCharge - totalDiscount,
          totalPayment,
          balance,
          checkInDate: detail.checkIn,
        };
      });

      setReportRows(rows);
    } catch (err) {
      console.error('Rapor verileri yüklenirken hata:', err);
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setReportRows([]);
      return;
    }

    if (mode === 'current') {
      fetchCurrentReport();
    }
  }, [open, mode, rooms, fetchCurrentReport]);

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
    return `Dolu Oda: ${occupiedRooms.length} / ${rooms.length}`;
  };

  const hasNoData = mode === 'current' ? occupiedRooms.length === 0 : reportRows.length === 0;
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

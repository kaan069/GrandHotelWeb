import React from 'react';
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
} from '@mui/material';
import {
  CleaningServices as CleaningIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

import { ROOM_STATUS_LABELS, BED_TYPE_LABELS, RoomGuest } from '../../utils/constants';

interface HousekeepingRoom {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  notes?: string;
}

interface HousekeepingReportDialogProps {
  open: boolean;
  onClose: () => void;
  rooms: HousekeepingRoom[];
}

const STATUS_ORDER: Record<string, number> = {
  dirty: 0,
  maintenance: 1,
  occupied: 2,
  available: 3,
  blocked: 4,
};

const STATUS_ROW_COLORS: Record<string, string> = {
  available: '#E8F5E9',
  occupied: '#FFEBEE',
  dirty: '#EFEBE9',
  maintenance: '#E3F2FD',
  blocked: '#ECEFF1',
};

const HousekeepingReportDialog: React.FC<HousekeepingReportDialogProps> = ({ open, onClose, rooms }) => {
  const sortedRooms = [...rooms].sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 99;
    const orderB = STATUS_ORDER[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.roomNumber.localeCompare(b.roomNumber, 'tr');
  });

  const statusCounts = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #housekeeping-report, #housekeeping-report * { visibility: visible !important; }
          #housekeeping-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <DialogTitle className="no-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CleaningIcon color="secondary" />
            <Typography variant="h6" component="span">Housekeeping Raporu</Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint}>
            Yazdır
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box id="housekeeping-report">
          <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center' } }}>
            <Typography variant="h5" fontWeight={700}>GrandHotel - Housekeeping Raporu</Typography>
            <Typography variant="body2" color="text.secondary">{today}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Tarih: {today}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {Object.entries(ROOM_STATUS_LABELS).map(([key, label]) => (
                <Chip
                  key={key}
                  label={`${label}: ${statusCounts[key] || 0}`}
                  size="small"
                  sx={{ bgcolor: STATUS_ROW_COLORS[key], fontWeight: 500 }}
                />
              ))}
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Oda No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Yatak Tipi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Konuk</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Not</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRooms.map((room) => (
                  <TableRow key={room.id} sx={{ bgcolor: STATUS_ROW_COLORS[room.status] || 'inherit' }}>
                    <TableCell>
                      <Chip label={room.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{room.floor}. Kat</TableCell>
                    <TableCell>{BED_TYPE_LABELS[room.bedType] || room.bedType}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ROOM_STATUS_LABELS[room.status] || room.status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {room.guests && room.guests.length > 0
                        ? room.guests.map((g) => g.guestName).join(', ')
                        : room.guestName || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: room.notes ? 'normal' : 'italic' }}>
                        {room.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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

export default HousekeepingReportDialog;

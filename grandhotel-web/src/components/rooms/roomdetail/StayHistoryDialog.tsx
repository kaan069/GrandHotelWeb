import React from 'react';
import {
  Typography,
  Button,
  Chip,
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
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';

import { StayHistory } from '../../../utils/constants';
import { formatDate, formatCurrency } from '../../../utils/formatters';

interface StayHistoryDialogProps {
  open: boolean;
  guestName: string;
  data: StayHistory[];
  onClose: () => void;
  onRowClick?: (reservationId: number) => void;
}

const StayHistoryDialog: React.FC<StayHistoryDialogProps> = ({ open, guestName, data, onClose, onRowClick }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        Konaklama Geçmişi - {guestName}
      </DialogTitle>
      <DialogContent>
        {data.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Oda</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giriş</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Çıkış</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gece</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tutar</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Ödenen</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Bakiye</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((stay) => {
                  const nights = Math.ceil(
                    (new Date(stay.checkOut).getTime() - new Date(stay.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const balance = stay.totalAmount - (stay.paidAmount || 0);
                  return (
                    <TableRow
                      key={stay.id}
                      hover={!!onRowClick}
                      onClick={() => onRowClick?.(stay.id)}
                      sx={{
                        bgcolor: balance > 0 ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                        cursor: onRowClick ? 'pointer' : 'default',
                      }}
                    >
                      <TableCell><Chip label={stay.roomNumber} size="small" variant="outlined" /></TableCell>
                      <TableCell>{formatDate(stay.checkIn)}</TableCell>
                      <TableCell>{formatDate(stay.checkOut)}</TableCell>
                      <TableCell>{nights}</TableCell>
                      <TableCell align="right">{formatCurrency(stay.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(stay.paidAmount || 0)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: balance > 0 ? 'error.main' : 'success.main', fontWeight: balance > 0 ? 700 : 400 }}
                      >
                        {formatCurrency(balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Bu misafirin konaklama geçmişi bulunmamaktadır.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StayHistoryDialog;

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
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
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { FolioItem, FOLIO_CATEGORY_LABELS } from '../../../utils/constants';

interface FolioDetailDialogProps {
  open: boolean;
  roomNumber: string;
  folios: FolioItem[];
  folioTotal: number;
  onClose: () => void;
  onFolioAddOpen: () => void;
  onFolioDelete: (folioId: number) => void;
  onPrint: () => void;
  onEmail: () => void;
}

const FolioDetailDialog: React.FC<FolioDetailDialogProps> = ({
  open,
  roomNumber,
  folios,
  folioTotal,
  onClose,
  onFolioAddOpen,
  onFolioDelete,
  onPrint,
  onEmail,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon color="primary" />
        Folio Detayları - Oda {roomNumber}
      </DialogTitle>
      <DialogContent dividers>
        {folios.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Açıklama</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {folios.map((folio) => (
                  <TableRow key={folio.id}>
                    <TableCell>
                      <Chip
                        label={FOLIO_CATEGORY_LABELS[folio.category] || folio.category}
                        size="small"
                        variant="outlined"
                        color={folio.category === 'payment' ? 'success' : folio.category === 'discount' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{folio.description || '-'}</TableCell>
                    <TableCell>{folio.date || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      {(folio.category === 'discount' || folio.category === 'payment' ? '-' : '')}
                      {folio.amount.toLocaleString('tr-TR')} ₺
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => onFolioDelete(folio.id)}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                    Toplam
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                    {folioTotal.toLocaleString('tr-TR')} ₺
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Henüz folio kalemi eklenmemiş.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onFolioAddOpen}>
          Folio Ekle
        </Button>
        <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={onPrint} disabled={folios.length === 0}>
          Yazdır
        </Button>
        <Button variant="outlined" size="small" startIcon={<PdfIcon />} onClick={onPrint} disabled={folios.length === 0}>
          PDF Yap
        </Button>
        <Button variant="outlined" size="small" startIcon={<EmailIcon />} onClick={onEmail} disabled={folios.length === 0}>
          Mail At
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolioDetailDialog;

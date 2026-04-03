import React, { useState } from 'react';
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
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';

import { FolioItem, FOLIO_CATEGORY_LABELS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/formatters';
import { tabsApi } from '../../../api/services';
import type { ApiTab } from '../../../api/services';

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

/** Açıklamadan adisyon no'sunu çıkar (varsa) */
const extractTabNo = (description: string): string | null => {
  const match = description.match(/Adisyon\s+(A-\d+)/);
  return match ? match[1] : null;
};

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tabDetail, setTabDetail] = useState<ApiTab | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  /** Adisyon satırına tıklayınca içeriğini yükle */
  const handleRowClick = async (folio: FolioItem) => {
    // Sadece restaurant/minibar kategorileri tıklanabilir (adisyon olan)
    if (!['restaurant', 'minibar'].includes(folio.category)) return;

    if (expandedId === folio.id) {
      setExpandedId(null);
      setTabDetail(null);
      return;
    }

    setExpandedId(folio.id);
    setTabDetail(null);

    // Açıklamadan adisyon no'sunu bul ve tab'ı yükle
    const tabNo = extractTabNo(folio.description);
    if (!tabNo) return;

    setLoadingTab(true);
    try {
      // Adisyon no ile arama — tabsApi'den tüm tab'ları çek ve filtrele
      const tabs = await tabsApi.getAll({});
      const found = tabs.find((t: ApiTab) => t.tabNo === tabNo);
      if (found) {
        const detail = await tabsApi.getById(found.id);
        setTabDetail(detail);
      }
    } catch {
      // Sessiz hata
    } finally {
      setLoadingTab(false);
    }
  };

  const isAdisyon = (category: string) => ['restaurant', 'minibar'].includes(category);

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
                  <TableCell sx={{ fontWeight: 600 }}>Tarih / Saat</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {folios.map((folio) => (
                  <React.Fragment key={folio.id}>
                    <TableRow
                      hover={isAdisyon(folio.category)}
                      sx={{
                        cursor: isAdisyon(folio.category) ? 'pointer' : 'default',
                        bgcolor: expandedId === folio.id ? 'action.selected' : undefined,
                      }}
                      onClick={() => handleRowClick(folio)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={FOLIO_CATEGORY_LABELS[folio.category] || folio.category}
                            size="small"
                            variant="outlined"
                            color={folio.category === 'payment' ? 'success' : folio.category === 'discount' ? 'warning' : 'default'}
                          />
                          {isAdisyon(folio.category) && (
                            expandedId === folio.id ? <CollapseIcon sx={{ fontSize: 16 }} /> : <ExpandIcon sx={{ fontSize: 16 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{folio.description || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {folio.createdAt ? formatDateTime(folio.createdAt) : (folio.date || '-')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {(folio.category === 'discount' || folio.category === 'payment' ? '-' : '')}
                        {folio.amount.toLocaleString('tr-TR')} ₺
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onFolioDelete(folio.id); }}>
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Adisyon detayı — genişleyen satır */}
                    {isAdisyon(folio.category) && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0, borderBottom: expandedId === folio.id ? undefined : 'none' }}>
                          <Collapse in={expandedId === folio.id} unmountOnExit>
                            <Box sx={{ py: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 1, my: 0.5 }}>
                              {loadingTab ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                  <CircularProgress size={20} />
                                </Box>
                              ) : tabDetail?.items && tabDetail.items.length > 0 ? (
                                <>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    {tabDetail.tabNo} — {tabDetail.items.length} kalem
                                  </Typography>
                                  {tabDetail.items.map((item) => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                                      <Typography variant="body2">
                                        {item.quantity}x {item.description}
                                      </Typography>
                                      <Typography variant="body2" fontWeight={600}>
                                        {parseFloat(item.totalPrice).toLocaleString('tr-TR')} ₺
                                      </Typography>
                                    </Box>
                                  ))}
                                </>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Adisyon detayı bulunamadı
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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

/**
 * PastReservationDialog — Geçmiş Rezervasyon Detay Dialogu
 *
 * Konaklama Geçmişi tablosundan bir rezervasyona tıklandığında açılır.
 * O rezervasyonun TÜM bilgilerini sekmeli olarak gösterir:
 *   - Genel: tarih, oda, misafirler, firma, toplam/ödenen/bakiye
 *   - Folio: tüm folio kalemleri (oda ücreti, minibar, restoran, ödeme, indirim)
 *   - Adisyonlar: bu rezervasyona bağlı tüm açılmış adisyonlar (kalemleriyle)
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import {
  History as HistoryIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';

import { reservationsApi, tabsApi } from '../../../api/services';
import type { ApiReservationDetail, ApiTab } from '../../../api/services';
import { FOLIO_CATEGORY_LABELS } from '../../../utils/constants';
import { formatDate, formatDateTime, formatCurrency } from '../../../utils/formatters';

interface PastReservationDialogProps {
  open: boolean;
  reservationId: number | null;
  onClose: () => void;
}

const PastReservationDialog: React.FC<PastReservationDialogProps> = ({
  open,
  reservationId,
  onClose,
}) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ApiReservationDetail | null>(null);
  const [tabs, setTabs] = useState<ApiTab[]>([]);

  useEffect(() => {
    if (!open || !reservationId) return;
    setTab(0);
    setLoading(true);
    setDetail(null);
    setTabs([]);
    Promise.all([
      reservationsApi.getById(reservationId),
      tabsApi.getAll({ reservationId }),
    ])
      .then(([res, t]) => {
        setDetail(res);
        setTabs(t || []);
      })
      .catch((err) => console.error('Geçmiş rezervasyon yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, [open, reservationId]);

  // Folio toplamlarını hesapla
  const totals = React.useMemo(() => {
    if (!detail) return { charges: 0, discounts: 0, payments: 0, balance: 0 };
    const folios = detail.folioItems || [];
    const charges = folios
      .filter((f) => !['payment', 'discount'].includes(f.category))
      .reduce((s, f) => s + Number(f.amount), 0);
    const discounts = folios
      .filter((f) => f.category === 'discount')
      .reduce((s, f) => s + Number(f.amount), 0);
    const payments = folios
      .filter((f) => f.category === 'payment')
      .reduce((s, f) => s + Number(f.amount), 0);
    return {
      charges,
      discounts,
      payments,
      balance: charges - discounts - payments,
    };
  }, [detail]);

  const nights = React.useMemo(() => {
    if (!detail?.checkIn || !detail?.checkOut) return 0;
    const cin = new Date(detail.checkIn).getTime();
    const cout = new Date(detail.checkOut).getTime();
    return Math.max(0, Math.ceil((cout - cin) / 86400000));
  }, [detail]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        Geçmiş Rezervasyon
        {detail && (
          <>
            <Chip label={`Oda ${detail.roomNumber}`} size="small" variant="outlined" sx={{ ml: 1 }} />
            <Chip
              label={detail.status === 'checked_out' ? 'Çıkış Yapıldı' : detail.status}
              size="small"
              color={detail.status === 'checked_out' ? 'default' : 'primary'}
              sx={{ ml: 0.5 }}
            />
          </>
        )}
      </DialogTitle>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && detail && (
        <>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab icon={<InfoIcon fontSize="small" />} iconPosition="start" label="Genel Bilgi" />
            <Tab icon={<ReceiptIcon fontSize="small" />} iconPosition="start" label={`Folio (${detail.folioItems?.length || 0})`} />
            <Tab icon={<RestaurantIcon fontSize="small" />} iconPosition="start" label={`Adisyonlar (${tabs.length})`} />
          </Tabs>

          <DialogContent dividers sx={{ minHeight: 320 }}>
            {/* === GENEL BİLGİ === */}
            {tab === 0 && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tarihler</Typography>
                  <Typography variant="body1">
                    <strong>{formatDate(detail.checkIn)}</strong> → <strong>{detail.checkOut ? formatDate(detail.checkOut) : '-'}</strong>
                    {nights > 0 && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({nights} gece)
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {detail.companyName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Firma</Typography>
                    <Typography variant="body1">{detail.companyName}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">Misafirler ({detail.stays?.length || 0})</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    {(detail.stays || []).map((s) => (
                      <Chip
                        key={s.id}
                        label={s.guestName}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {(!detail.stays || detail.stays.length === 0) && (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </Stack>
                </Box>

                {detail.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Notlar</Typography>
                    <Typography variant="body2">{detail.notes}</Typography>
                  </Box>
                )}

                {detail.createdByStaff && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">İşlem Yapan</Typography>
                    <Typography variant="body2">{detail.createdByStaff}</Typography>
                  </Box>
                )}

                <Divider />

                {/* Mali Özet */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 140, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Toplam Ücret</Typography>
                    <Typography variant="h6" fontWeight={700}>{formatCurrency(totals.charges)}</Typography>
                  </Box>
                  {totals.discounts > 0 && (
                    <Box sx={{ flex: 1, minWidth: 140, p: 1.5, bgcolor: '#fff7ed', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">İndirim</Typography>
                      <Typography variant="h6" fontWeight={700} color="warning.main">-{formatCurrency(totals.discounts)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 140, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Ödenen</Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">{formatCurrency(totals.payments)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 140, p: 1.5, bgcolor: totals.balance > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Bakiye</Typography>
                    <Typography variant="h6" fontWeight={700} color={totals.balance > 0 ? 'error.main' : 'success.main'}>
                      {formatCurrency(totals.balance)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}

            {/* === FOLIO === */}
            {tab === 1 && (
              <>
                {detail.folioItems && detail.folioItems.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Açıklama</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Tarih / Saat</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.folioItems.map((folio) => (
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
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {folio.createdAt ? formatDateTime(folio.createdAt) : (folio.date || '-')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                              {(folio.category === 'discount' || folio.category === 'payment' ? '-' : '')}
                              {Number(folio.amount).toLocaleString('tr-TR')} ₺
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Bakiye</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: totals.balance > 0 ? 'error.main' : 'success.main' }}>
                            {formatCurrency(totals.balance)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Bu rezervasyona ait folio kalemi yok.</Alert>
                )}
              </>
            )}

            {/* === ADİSYONLAR === */}
            {tab === 2 && (
              <>
                {tabs.length > 0 ? (
                  <Stack spacing={2}>
                    {tabs.map((t) => (
                      <Box key={t.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={t.tabNo} size="small" color="primary" variant="outlined" />
                            <Chip
                              label={t.status === 'paid' ? 'Ödendi' : t.status === 'closed' ? 'Kapandı' : t.status === 'open' ? 'Açık' : t.status}
                              size="small"
                              color={t.status === 'paid' ? 'success' : t.status === 'open' ? 'warning' : 'default'}
                            />
                            {t.servicePoint && (
                              <Typography variant="caption" color="text.secondary">{t.servicePoint}</Typography>
                            )}
                          </Box>
                          <Typography variant="body2" fontWeight={700}>
                            {Number(t.totalAmount).toLocaleString('tr-TR')} ₺
                          </Typography>
                        </Box>
                        {t.openedAt && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Açılış: {formatDateTime(t.openedAt)}
                            {t.closedAt && ` · Kapanış: ${formatDateTime(t.closedAt)}`}
                          </Typography>
                        )}
                        {t.items && t.items.length > 0 && (
                          <Box sx={{ mt: 1, pl: 1, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                            {t.items.map((item) => (
                              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                                <Typography variant="body2">
                                  {item.quantity}x {item.description}
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {Number(item.totalPrice).toLocaleString('tr-TR')} ₺
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">Bu rezervasyona ait adisyon yok.</Alert>
                )}
              </>
            )}
          </DialogContent>
        </>
      )}

      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PastReservationDialog;

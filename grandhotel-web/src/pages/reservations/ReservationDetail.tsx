/**
 * Rezervasyon Detay Sayfası
 *
 * /reservations/:id rotası ile açılır.
 * Rezervasyon bilgileri, misafirler, folio kalemleri gösterilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Login as CheckInIcon,
  Cancel as CancelIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { reservationsApi, roomsApi, companiesApi } from '../../api/services';
import type { ApiReservationDetail, ApiRoom, ApiCompany } from '../../api/services';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { FOLIO_CATEGORY_LABELS } from '../../utils/constants';
import ReservationEditDialog from '../../components/reservations/ReservationEditDialog';

/* ==================== STATUS HELPERS ==================== */

const STATUS_CONFIG: Record<string, { label: string; color: 'info' | 'success' | 'default' | 'error' }> = {
  reserved: { label: 'Rezerve', color: 'info' },
  checked_in: { label: 'Konaklamada', color: 'success' },
  checked_out: { label: 'Çıkış Yapıldı', color: 'default' },
  cancelled: { label: 'İptal', color: 'error' },
};

/* ==================== COMPONENT ==================== */

const ReservationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<ApiReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; action: () => void }>({
    open: false, title: '', action: () => {},
  });

  const loadReservation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await reservationsApi.getById(Number(id));
      setReservation(data);
      setError('');
    } catch {
      setError('Rezervasyon bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  /* Actions */

  const handleCheckIn = async () => {
    if (!reservation) return;
    setActionLoading(true);
    try {
      await reservationsApi.checkIn(reservation.id);
      setSnackbar({ open: true, message: 'Check-in yapıldı.', severity: 'success' });
      loadReservation();
    } catch {
      setSnackbar({ open: true, message: 'Check-in yapılamadı.', severity: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, title: '', action: () => {} });
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    setActionLoading(true);
    try {
      await reservationsApi.cancel(reservation.id);
      setSnackbar({ open: true, message: 'Rezervasyon iptal edildi.', severity: 'success' });
      loadReservation();
    } catch {
      setSnackbar({ open: true, message: 'İptal işlemi başarısız.', severity: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, title: '', action: () => {} });
    }
  };

  const handleRevertCheckin = async () => {
    if (!reservation) return;
    setActionLoading(true);
    try {
      await reservationsApi.revertCheckin(reservation.id);
      setSnackbar({ open: true, message: 'Check-in geri alındı.', severity: 'success' });
      loadReservation();
    } catch {
      setSnackbar({ open: true, message: 'Geri alma başarısız.', severity: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, title: '', action: () => {} });
    }
  };

  const handleEditOpen = async () => {
    try {
      const [r, c] = await Promise.all([roomsApi.getAll(), companiesApi.getAll()]);
      setRooms(r);
      setCompanies(c);
      setEditOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Veriler yüklenemedi.', severity: 'error' });
    }
  };

  const handleEditSave = () => {
    setEditOpen(false);
    loadReservation();
    setSnackbar({ open: true, message: 'Rezervasyon güncellendi.', severity: 'success' });
  };

  /* Hesaplamalar */
  const totalAmount = reservation ? parseFloat(reservation.totalAmount) || 0 : 0;
  const paidAmount = reservation ? parseFloat(reservation.paidAmount) || 0 : 0;
  const balance = totalAmount - paidAmount;

  const nights = reservation && reservation.checkIn && reservation.checkOut
    ? Math.max(1, Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 86400000))
    : '-';

  const statusConf = STATUS_CONFIG[reservation?.status || ''] || { label: reservation?.status, color: 'default' as const };

  /* ==================== RENDER ==================== */

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !reservation) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reservations')} sx={{ mb: 2 }}>
          Geri
        </Button>
        <Alert severity="error">{error || 'Rezervasyon bulunamadı.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reservations')} size="small">
          Geri
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Rezervasyon #{reservation.id}
        </Typography>
        <Chip label={statusConf.label} color={statusConf.color} />

        {/* Action Buttons */}
        {reservation.status === 'reserved' && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckInIcon />}
              disabled={actionLoading}
              onClick={() => setConfirmDialog({ open: true, title: 'Check-in yapmak istiyor musunuz?', action: handleCheckIn })}
              size="small"
            >
              Check-in
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              disabled={actionLoading}
              onClick={() => setConfirmDialog({ open: true, title: 'Rezervasyonu iptal etmek istiyor musunuz?', action: handleCancel })}
              size="small"
            >
              İptal
            </Button>
          </>
        )}
        {reservation.status === 'checked_in' && (
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            disabled={actionLoading}
            onClick={() => setConfirmDialog({ open: true, title: 'Check-in geri almak istiyor musunuz?', action: handleRevertCheckin })}
            size="small"
          >
            Check-in Geri Al
          </Button>
        )}
        {(reservation.status === 'reserved' || reservation.status === 'checked_in') && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEditOpen} size="small">
            Düzenle
          </Button>
        )}
      </Box>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Konaklama Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InfoRow label="Oda" value={`${reservation.roomNumber}`} />
              <InfoRow label="Giriş" value={formatDateTime(reservation.checkIn)} />
              <InfoRow label="Çıkış" value={reservation.checkOut ? formatDateTime(reservation.checkOut) : '-'} />
              <InfoRow label="Gece" value={String(nights)} />
              <InfoRow label="Misafir(ler)" value={reservation.guestNames || '-'} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Detaylar
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InfoRow label="Firma" value={reservation.companyName || 'Bireysel'} />
              <InfoRow label="Oluşturan" value={reservation.createdByStaff || '-'} />
              <InfoRow label="Notlar" value={reservation.notes || '-'} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Finansal Özet */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Toplam</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(totalAmount)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Ödenen</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">{formatCurrency(paidAmount)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Bakiye</Typography>
              <Typography variant="h6" fontWeight={700} color={balance > 0 ? 'error.main' : 'text.primary'}>
                {formatCurrency(balance)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Misafirler */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Misafirler ({reservation.stays?.length || 0})
          </Typography>
          {reservation.stays && reservation.stays.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Misafir</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Telefon</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Giriş</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Çıkış</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservation.stays.map((stay) => (
                    <TableRow key={stay.id}>
                      <TableCell>{stay.guestName}</TableCell>
                      <TableCell>{stay.phone || '-'}</TableCell>
                      <TableCell>{formatDateTime(stay.checkIn)}</TableCell>
                      <TableCell>{stay.checkOut ? formatDateTime(stay.checkOut) : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={stay.isActive ? 'Aktif' : 'Çıkış'}
                          size="small"
                          color={stay.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">Henüz misafir kaydı yok.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Folio Kalemleri */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Hesap Kalemleri ({reservation.folioItems?.length || 0})
          </Typography>
          {reservation.folioItems && reservation.folioItems.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Açıklama</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Tutar</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tarih</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservation.folioItems.map((item) => {
                    const amt = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{FOLIO_CATEGORY_LABELS[item.category] || item.category}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right" sx={{ color: amt < 0 ? 'success.main' : 'text.primary' }}>
                          {formatCurrency(amt)}
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">Henüz hesap kalemi yok.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editOpen && reservation && (
        <ReservationEditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          reservation={reservation}
          rooms={rooms.map(r => ({ id: r.id, roomNumber: r.roomNumber, status: r.status }))}
          companies={companies}
          onSave={handleEditSave}
        />
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: '', action: () => {} })}>
        <DialogTitle>Onay</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.title}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: '', action: () => {} })}>Vazgeç</Button>
          <Button variant="contained" onClick={confirmDialog.action} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/* ==================== YARDIMCI ==================== */

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default ReservationDetail;

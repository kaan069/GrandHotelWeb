/**
 * Misafir Detay Sayfasi
 *
 * /guests/:id rotasi ile acilir.
 * Misafir bilgileri, konaklama gecmisi ve folio ozeti gosterilir.
 * API: guestsApi.getAll() -> id ile filtrele, guestsApi.stayHistory(id), reportsApi.guest(id)
 */

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { guestsApi, reportsApi } from '../../api/services';
import { formatDate, formatCurrency, formatPhone } from '../../utils/formatters';
import type { Guest, StayHistory } from '../../utils/constants';

interface GuestReportSummary {
  totalAmount: number;
  paidAmount: number;
  balance: number;
  totalReservations: number;
}

interface GuestReportData {
  summary: GuestReportSummary;
}

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Rezerve',
  checked_in: 'Konakliyor',
  checked_out: 'Cikis Yapildi',
  cancelled: 'Iptal',
};

const GuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [report, setReport] = useState<GuestReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const guestId = Number(id);
    setLoading(true);
    setError(null);

    Promise.all([
      guestsApi.getAll(),
      guestsApi.stayHistory(guestId),
      reportsApi.guest(guestId).catch(() => null),
    ])
      .then(([allGuests, stays, reportData]) => {
        const found = (allGuests as Guest[]).find((g) => g.id === guestId);
        if (!found) {
          setError('Misafir bulunamadi.');
          return;
        }
        setGuest(found);
        setStayHistory(stays as unknown as StayHistory[]);
        setReport(reportData);
      })
      .catch((err) => {
        console.error('Misafir detayi yuklenirken hata:', err);
        setError('Veriler yuklenirken bir hata olustu.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* Ozet hesaplamalari */
  const totalSpent = stayHistory.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = stayHistory.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalDebt = totalSpent - totalPaid;
  const totalNights = stayHistory.reduce((sum, s) => {
    if (!s.checkOut) return sum;
    const diffTime = new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime();
    return sum + Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  }, 0);

  /* Loading */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  /* Error */
  if (error || !guest) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/guests')} sx={{ mb: 2 }}>
          Misafir Listesi
        </Button>
        <Alert severity="error">{error || 'Misafir bulunamadi.'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${guest.firstName} ${guest.lastName}`}
        subtitle="Misafir Detayi"
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/guests')}
          >
            Listeye Don
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        {/* Sol - Kisisel Bilgiler */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Kisisel Bilgiler
                </Typography>
              </Box>

              <InfoRow label="TC Kimlik" value={guest.tcNo} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Telefon" value={formatPhone(guest.phone)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="E-posta" value={guest.email || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Kayit Tarihi" value={formatDate(guest.createdAt)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Durum"
                value={
                  guest.isBlocked ? (
                    <Chip label="Engelli" size="small" color="error" />
                  ) : (
                    <Chip label="Aktif" size="small" color="success" variant="outlined" />
                  )
                }
              />

              {/* Ozet Istatistikler */}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WalletIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Konaklama Ozeti
                </Typography>
              </Box>
              <InfoRow label="Toplam Konaklama" value={`${stayHistory.length} kez`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Gece" value={`${totalNights} gece`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Harcama" value={formatCurrency(totalSpent)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Odeme" value={formatCurrency(totalPaid)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Bakiye"
                value={
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={totalDebt > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(totalDebt)}
                  </Typography>
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sag - Konaklama Gecmisi */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Konaklama Gecmisi
                </Typography>
              </Box>

              {stayHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Oda</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giris</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Cikis</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Gece</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Firma</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Tutar</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Odenen</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Bakiye</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stayHistory.map((stay) => {
                        const nights = stay.checkOut
                          ? Math.max(
                              Math.ceil(
                                (new Date(stay.checkOut).getTime() - new Date(stay.checkIn).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ),
                              0
                            )
                          : '-';
                        const balance = stay.totalAmount - (stay.paidAmount || 0);
                        return (
                          <TableRow
                            key={stay.id}
                            hover
                            sx={{
                              bgcolor: balance > 0 ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                            }}
                          >
                            <TableCell>
                              <Chip label={stay.roomNumber} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{formatDate(stay.checkIn)}</TableCell>
                            <TableCell>{stay.checkOut ? formatDate(stay.checkOut) : <Chip label="Konaklıyor" size="small" color="info" />}</TableCell>
                            <TableCell>{nights}</TableCell>
                            <TableCell>{stay.companyName || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.totalAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.paidAmount || 0)}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={balance > 0 ? 'error.main' : 'success.main'}
                                fontWeight={balance > 0 ? 700 : 400}
                              >
                                {formatCurrency(balance)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Bu misafirin konaklama gecmisi bulunmuyor.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Folio Ozeti (rapor verisi varsa) */}
          {report && report.summary && (
            <Card sx={{ mt: 2.5 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Folio Ozeti
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Toplam Tutar</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {(report.summary.totalAmount || 0).toLocaleString('tr-TR')} TL
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Odenen</Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {(report.summary.paidAmount || 0).toLocaleString('tr-TR')} TL
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Bakiye</Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={(report.summary.balance || 0) > 0 ? 'error.main' : 'success.main'}
                      >
                        {(report.summary.balance || 0).toLocaleString('tr-TR')} TL
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Konaklama Sayisi</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {report.summary.totalReservations || stayHistory.length}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

/** Bilgi satiri yardimci bileseni */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default GuestDetail;

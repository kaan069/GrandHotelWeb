import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Chip,
} from '@mui/material';
import {
  TravelExplore as TravelExploreIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import { InvoiceCreateDialog } from '../invoices';
import type { Agency } from '../../utils/constants';
import { agenciesApi } from '../../api/services';
import { formatDate, formatCurrency, formatPhone } from '../../utils/formatters';

interface AgencyReservationRow {
  id: number;
  roomNumber: string;
  guestNames: string;
  checkIn: string;
  checkOut: string | null;
  totalAmount: string;
  paidAmount: string;
  status: string;
  isActive: boolean;
  agencyReservationCode: string;
}

interface AgencyDetailContentProps {
  agency: Agency;
  onReservationClick?: (reservationId: number) => void;
}

const AgencyDetailContent: React.FC<AgencyDetailContentProps> = ({ agency, onReservationClick }) => {
  const [reservations, setReservations] = useState<AgencyReservationRow[]>([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const data = await agenciesApi.getReservations(agency.id);
      setReservations(data);
    } catch (err) {
      console.error('Acente rezervasyonları yüklenirken hata:', err);
    }
  }, [agency.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const totalRevenue = reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const totalPaid = reservations.reduce((sum, r) => sum + Number(r.paidAmount), 0);
  const totalDebt = totalRevenue - totalPaid;
  const commissionRate = Number(agency.commissionRate || 0);
  const commissionAmount = (totalRevenue * commissionRate) / 100;

  return (
    <Box>
      {/* Acente Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TravelExploreIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
          {agency.name}
        </Typography>
        <Chip label={`%${commissionRate} Komisyon`} color="info" size="small" />
        <Button
          variant="contained"
          color="warning"
          size="small"
          startIcon={<ReceiptIcon />}
          onClick={() => setInvoiceDialogOpen(true)}
        >
          Fatura Kes
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {/* Sol - Acente Bilgileri */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Acente Bilgileri
              </Typography>
              <InfoRow label="Vergi No" value={agency.taxNumber || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Yetkili" value={agency.contactPerson || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Telefon" value={agency.phone ? formatPhone(agency.phone) : '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="E-posta" value={agency.email || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Adres" value={agency.address || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Komisyon Oranı" value={`%${commissionRate}`} />

              {/* Özet */}
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Ciro Özeti
              </Typography>
              <InfoRow label="Toplam Rezervasyon" value={`${reservations.length} adet`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Ciro" value={formatCurrency(totalRevenue)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Ödenen" value={formatCurrency(totalPaid)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Toplam Borç"
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
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Acente Komisyonu"
                value={
                  <Typography variant="body2" fontWeight={700} color="info.main">
                    {formatCurrency(commissionAmount)}
                  </Typography>
                }
              />

              {agency.notes && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Notlar
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {agency.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ - Rezervasyonlar */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ fontSize: 20 }} />
                Acenteden Gelen Rezervasyonlar
              </Typography>

              {reservations.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Rez. Kodu</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Misafir</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Oda</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giriş</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Çıkış</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Tutar</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Ödenen</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Bakiye</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reservations.map((r) => {
                        const balance = Number(r.totalAmount) - Number(r.paidAmount);
                        return (
                          <TableRow
                            key={r.id}
                            hover
                            sx={{
                              cursor: onReservationClick ? 'pointer' : 'default',
                              bgcolor: balance > 0 ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                            }}
                            onClick={() => onReservationClick?.(r.id)}
                          >
                            <TableCell>
                              {r.agencyReservationCode ? (
                                <Chip label={r.agencyReservationCode} size="small" color="info" variant="outlined" />
                              ) : '-'}
                            </TableCell>
                            <TableCell>{r.guestNames || '-'}</TableCell>
                            <TableCell>
                              <Chip label={r.roomNumber} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{r.checkIn ? formatDate(r.checkIn) : '-'}</TableCell>
                            <TableCell>{r.checkOut ? formatDate(r.checkOut) : '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(Number(r.totalAmount))}</TableCell>
                            <TableCell align="right">{formatCurrency(Number(r.paidAmount))}</TableCell>
                            <TableCell align="right" sx={{ color: balance > 0 ? 'error.main' : 'success.main', fontWeight: balance > 0 ? 700 : 400 }}>
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
                  Bu acenteden gelen rezervasyon yok.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fatura Oluşturma Dialog */}
      <InvoiceCreateDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        defaultType="sales"
        customerType="company"
        customerName={agency.name}
        taxNumber={agency.taxNumber ?? undefined}
        address={agency.address ?? undefined}
      />
    </Box>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default AgencyDetailContent;

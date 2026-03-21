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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Business as BusinessIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import { FormField } from '../forms';
import { InvoiceCreateDialog } from '../invoices';
import { Company, Guest, StayHistory } from '../../utils/constants';
import { companiesApi, guestsApi, reservationsApi } from '../../api/services';
import { formatDate, formatCurrency, formatPhone } from '../../utils/formatters';

interface GuestFormData {
  tcNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

const emptyGuestForm: GuestFormData = {
  tcNo: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
};

interface CompanyDetailContentProps {
  company: Company;
  onStayClick: (stay: StayHistory) => void;
}

const CompanyDetailContent: React.FC<CompanyDetailContentProps> = ({ company, onStayClick }) => {
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [companyGuests, setCompanyGuests] = useState<Guest[]>([]);

  /* Müşteri ekleme dialog */
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestFormData>(emptyGuestForm);
  const [guestErrors, setGuestErrors] = useState<Partial<GuestFormData>>({});
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const guestsData = await companiesApi.getGuests(company.id);
      const historyData = await reservationsApi.getAll({ companyId: company.id });

      setCompanyGuests(guestsData.map((g) => ({
        id: g.id,
        tcNo: g.tcNo,
        firstName: g.firstName,
        lastName: g.lastName,
        phone: g.phone,
        email: g.email ?? undefined,
        companyId: g.companyId ?? undefined,
        isBlocked: g.isBlocked,
        createdAt: g.createdAt ?? '',
      })));
      setStayHistory(historyData.map((r) => ({
        id: r.id,
        guestName: r.guestNames || '',
        roomNumber: r.roomNumber,
        checkIn: r.checkIn,
        checkOut: r.checkOut || '',
        totalAmount: Number(r.totalAmount),
        paidAmount: Number(r.paidAmount),
        companyName: r.companyName || undefined,
      })));
    } catch (err) {
      console.error('Firma verileri yüklenirken hata:', err);
    }
  }, [company.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const totalRevenue = stayHistory.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = stayHistory.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalDebt = totalRevenue - totalPaid;
  const totalNights = stayHistory.reduce((sum, s) => {
    const diffTime = new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime();
    return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, 0);

  const handleGuestFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestForm((prev) => ({ ...prev, [name]: value }));
    if (guestErrors[name as keyof GuestFormData]) {
      setGuestErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddGuest = async () => {
    const errors: Partial<GuestFormData> = {};
    if (!guestForm.firstName.trim()) errors.firstName = 'Ad zorunlu';
    if (!guestForm.lastName.trim()) errors.lastName = 'Soyad zorunlu';
    if (!guestForm.tcNo.trim()) errors.tcNo = 'TC Kimlik No zorunlu';
    if (!guestForm.phone.trim()) errors.phone = 'Telefon zorunlu';
    if (Object.keys(errors).length > 0) {
      setGuestErrors(errors);
      return;
    }

    try {
      await guestsApi.create({
        tcNo: guestForm.tcNo.trim(),
        firstName: guestForm.firstName.trim(),
        lastName: guestForm.lastName.trim(),
        phone: guestForm.phone.trim(),
        email: guestForm.email.trim() || undefined,
        companyId: company.id,
      });

      setGuestForm(emptyGuestForm);
      setGuestErrors({});
      setAddGuestOpen(false);
      refreshData();
    } catch (err) {
      console.error('Misafir eklenirken hata:', err);
    }
  };

  const handleRemoveGuestFromCompany = async (guestId: number) => {
    try {
      await guestsApi.update(guestId, { companyId: null });
      refreshData();
    } catch (err) {
      console.error('Misafir firmadan çıkarılırken hata:', err);
    }
  };

  return (
    <Box>
      {/* Firma Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <BusinessIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
          {company.name}
        </Typography>
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
        {/* Sol - Firma Bilgileri */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Firma Bilgileri
              </Typography>
              <InfoRow label="Vergi No" value={company.taxNumber || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Telefon" value={company.phone ? formatPhone(company.phone) : '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="E-posta" value={company.email || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Adres" value={company.address || '-'} />

              {/* Özet */}
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Konaklama Özeti
              </Typography>
              <InfoRow label="Kayıtlı Müşteri" value={`${companyGuests.length} kişi`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Konaklama" value={`${stayHistory.length} kez`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Gece" value={`${totalNights} gece`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Gelir" value={formatCurrency(totalRevenue)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Ödeme" value={formatCurrency(totalPaid)} />
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

              {/* Firmaya Bağlı Müşteriler */}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                  Müşteriler ({companyGuests.length})
                </Typography>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setAddGuestOpen(true)}
                  title="Müşteri Ekle"
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Box>

              {companyGuests.length > 0 ? (
                companyGuests.map((g) => (
                  <Box
                    key={g.id}
                    sx={{
                      py: 0.8,
                      px: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {g.firstName} {g.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatPhone(g.phone)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveGuestFromCompany(g.id)}
                      title="Firmadan Çıkar"
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Bu firmaya bağlı müşteri yok.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ - Konaklama Geçmişi */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ fontSize: 20 }} />
                Konaklama Geçmişi
              </Typography>

              {stayHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Misafir</TableCell>
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
                      {stayHistory.map((stay) => {
                        const nights = Math.ceil(
                          (new Date(stay.checkOut).getTime() - new Date(stay.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const balance = stay.totalAmount - (stay.paidAmount || 0);
                        return (
                          <TableRow
                            key={stay.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              bgcolor: balance > 0 ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                            }}
                            onClick={() => onStayClick(stay)}
                          >
                            <TableCell>{stay.guestName}</TableCell>
                            <TableCell>
                              <Chip label={stay.roomNumber} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{formatDate(stay.checkIn)}</TableCell>
                            <TableCell>{formatDate(stay.checkOut)}</TableCell>
                            <TableCell>{nights}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.totalAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.paidAmount || 0)}</TableCell>
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
                  Bu firmanın konaklama geçmişi bulunmuyor.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Müşteri Ekleme Dialog */}
      <Dialog
        open={addGuestOpen}
        onClose={() => setAddGuestOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          {company.name} - Müşteri Ekle
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormField
              label="TC Kimlik No"
              name="tcNo"
              value={guestForm.tcNo}
              onChange={handleGuestFormChange}
              placeholder="11 haneli TC kimlik numarası"
              required
              error={guestErrors.tcNo}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Ad"
                  name="firstName"
                  value={guestForm.firstName}
                  onChange={handleGuestFormChange}
                  placeholder="Müşteri adı"
                  required
                  error={guestErrors.firstName}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Soyad"
                  name="lastName"
                  value={guestForm.lastName}
                  onChange={handleGuestFormChange}
                  placeholder="Müşteri soyadı"
                  required
                  error={guestErrors.lastName}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Telefon"
                  name="phone"
                  value={guestForm.phone}
                  onChange={handleGuestFormChange}
                  placeholder="0532 123 45 67"
                  required
                  error={guestErrors.phone}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="E-posta"
                  name="email"
                  value={guestForm.email}
                  onChange={handleGuestFormChange}
                  placeholder="ornek@email.com"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGuestOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleAddGuest} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Fatura Oluşturma Dialog */}
      <InvoiceCreateDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        defaultType="sales"
        customerType="company"
        customerName={company.name}
        taxNumber={company.taxNumber}
        address={company.address}
        companyId={company.id}
      />
    </Box>
  );
};

/** Bilgi satırı yardımcı bileşeni */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default CompanyDetailContent;

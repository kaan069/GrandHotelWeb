/**
 * Konaklama Detay Bileşeni (Geçmiş Konaklama Görünümü)
 *
 * RoomDetailContent tarzında tasarlanmıştır.
 * Geçmiş konaklama verilerini oda detay ekranı formatında gösterir.
 * Yazdır ve e-posta gönder seçenekleri sunar.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import { StayHistory, FolioItem, FOLIO_CATEGORY_LABELS } from '../../utils/constants';
import { foliosApi } from '../../api/services';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface StayDetailContentProps {
  stay: StayHistory;
}

const StayDetailContent: React.FC<StayDetailContentProps> = ({ stay }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [folios, setFolios] = useState<FolioItem[]>([]);

  const nights = Math.ceil(
    (new Date(stay.checkOut).getTime() - new Date(stay.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const nightlyRate = nights > 0 ? stay.totalAmount / nights : stay.totalAmount;
  const balance = stay.totalAmount - (stay.paidAmount || 0);

  useEffect(() => {
    const fetchFolios = async () => {
      try {
        // stay.id is the reservation id
        const data = await foliosApi.getForReservation(stay.id);
        setFolios(data.map((f) => ({
          id: f.id,
          reservationId: f.reservationId,
          category: f.category,
          description: f.description,
          amount: Number(f.amount),
          date: f.date,
          guestId: f.guestId ?? undefined,
          createdBy: f.createdBy ?? undefined,
        })));
      } catch (err) {
        console.error('Folio verileri yüklenirken hata:', err);
        setFolios([]);
      }
    };
    fetchFolios();
  }, [stay.id]);

  const folioTotal = folios.reduce((sum, f) => {
    if (f.category === 'discount') return sum - f.amount;
    if (f.category === 'payment') return sum - f.amount;
    return sum + f.amount;
  }, 0);

  /** Yazdır */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Konaklama Detayı - ${stay.guestName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1565C0; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #1565C0; margin: 0 0 4px 0; font-size: 22px; }
          .header p { color: #666; margin: 0; font-size: 13px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: 600; font-size: 15px; color: #1565C0; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          td:first-child { color: #666; width: 40%; }
          td:last-child { font-weight: 500; }
          .total { font-size: 16px; font-weight: 700; color: #1565C0; text-align: right; margin-top: 16px; }
          .footer { text-align: center; color: #999; font-size: 11px; margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GrandHotel PMS</h1>
          <p>Konaklama Detay Belgesi</p>
        </div>
        <div class="section">
          <div class="section-title">Misafir Bilgileri</div>
          <table>
            <tr><td>Misafir Adı</td><td>${stay.guestName}</td></tr>
            ${stay.companyName ? `<tr><td>Firma</td><td>${stay.companyName}</td></tr>` : ''}
          </table>
        </div>
        <div class="section">
          <div class="section-title">Konaklama Bilgileri</div>
          <table>
            <tr><td>Oda Numarası</td><td>${stay.roomNumber}</td></tr>
            <tr><td>Giriş Tarihi</td><td>${formatDate(stay.checkIn)}</td></tr>
            <tr><td>Çıkış Tarihi</td><td>${formatDate(stay.checkOut)}</td></tr>
            <tr><td>Toplam Gece</td><td>${nights} gece</td></tr>
            <tr><td>Gecelik Ücret</td><td>${formatCurrency(nightlyRate)}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Ücret Bilgileri</div>
          <table>
            <tr><td>Toplam Tutar</td><td>${formatCurrency(stay.totalAmount)}</td></tr>
            <tr><td>Ödenen</td><td>${formatCurrency(stay.paidAmount || 0)}</td></tr>
            <tr><td>Bakiye</td><td style="color: ${balance > 0 ? '#d32f2f' : '#2e7d32'}; font-weight: 700">${formatCurrency(balance)}</td></tr>
          </table>
        </div>
        <div class="footer">
          Bu belge GrandHotel PMS tarafından ${formatDate(new Date().toISOString())} tarihinde oluşturulmuştur.
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  /** E-posta gönder */
  const handleEmail = () => {
    const subject = encodeURIComponent(`Konaklama Detayı - ${stay.guestName} - Oda ${stay.roomNumber}`);
    const body = encodeURIComponent(
      `Konaklama Detayı\n` +
      `${'='.repeat(30)}\n\n` +
      `Misafir: ${stay.guestName}\n` +
      `${stay.companyName ? `Firma: ${stay.companyName}\n` : ''}` +
      `Oda: ${stay.roomNumber}\n` +
      `Giriş: ${formatDate(stay.checkIn)}\n` +
      `Çıkış: ${formatDate(stay.checkOut)}\n` +
      `Gece: ${nights}\n` +
      `Gecelik Ücret: ${formatCurrency(nightlyRate)}\n` +
      `Toplam Tutar: ${formatCurrency(stay.totalAmount)}\n` +
      `Ödenen: ${formatCurrency(stay.paidAmount || 0)}\n` +
      `Bakiye: ${formatCurrency(balance)}\n\n` +
      `---\nGrandHotel PMS`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Box ref={printRef}>
      {/* === Üst Başlık + Aksiyonlar (RoomDetailContent tarzı) === */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HotelIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Oda {stay.roomNumber}
          </Typography>
          <Chip
            icon={<HistoryIcon sx={{ fontSize: 14 }} />}
            label="Geçmiş Konaklama"
            size="small"
            color="default"
            variant="outlined"
          />
          <Chip
            label={`${formatDate(stay.checkIn)} — ${formatDate(stay.checkOut)}`}
            size="small"
            variant="outlined"
            color="info"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint}>
            Yazdır
          </Button>
          <Button variant="outlined" size="small" startIcon={<EmailIcon />} onClick={handleEmail}>
            E-posta Gönder
          </Button>
        </Box>
      </Box>

      {/* === Ana İçerik: RoomDetailContent benzeri 2 sütun === */}
      <Grid container spacing={2.5}>
        {/* Sol Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Misafir Bilgileri */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 20 }} color="primary" />
                Misafir Bilgileri
              </Typography>
              <InfoRow label="Misafir" value={stay.guestName} />
              {stay.companyName && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow
                    label="Firma"
                    value={
                      <Chip
                        icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                        label={stay.companyName}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Konaklama Bilgileri */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 20 }} color="primary" />
                Konaklama Bilgileri
              </Typography>
              <InfoRow label="Oda Numarası" value={<Chip label={stay.roomNumber} size="small" variant="outlined" />} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Giriş Tarihi" value={formatDate(stay.checkIn)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Çıkış Tarihi" value={formatDate(stay.checkOut)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Toplam Gece" value={`${nights} gece`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Gecelik Ücret" value={formatCurrency(nightlyRate)} />
            </CardContent>
          </Card>

          {/* Ücret Özeti */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon sx={{ fontSize: 20 }} color="primary" />
                Ücret Bilgileri
              </Typography>
              <InfoRow label="Gecelik Ücret" value={formatCurrency(nightlyRate)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Gece Sayısı" value={`${nights} gece`} />
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>Toplam Tutar</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  {formatCurrency(stay.totalAmount)}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Ödenen" value={formatCurrency(stay.paidAmount || 0)} />
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Bakiye</Typography>
                <Chip
                  label={formatCurrency(balance)}
                  size="small"
                  color={balance > 0 ? 'error' : 'success'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Panel */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Folio Kayıtları */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon sx={{ fontSize: 20 }} color="primary" />
                  Folio Kayıtları
                </Typography>
                {folios.length > 0 && (
                  <Chip
                    label={`Toplam: ${formatCurrency(folioTotal)}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              {folios.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Açıklama</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
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
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          Toplam
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {folioTotal.toLocaleString('tr-TR')} ₺
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Bu konaklamaya ait folio kaydı bulunmamaktadır.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

/** Bilgi satırı yardımcı bileşeni */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default StayDetailContent;

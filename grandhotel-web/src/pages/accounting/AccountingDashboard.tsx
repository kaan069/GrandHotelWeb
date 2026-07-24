import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { accountingApi, AccountingSummary } from '../../api/services';

const fmt = (v: string | number) =>
  Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

const StatCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={800} color={color}>{fmt(value)}</Typography>
    </CardContent>
  </Card>
);

const AccountingDashboard: React.FC = () => {
  const nav = useNavigate();
  const [data, setData] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingApi.summary()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>Muhasebe Paneli</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Toplam Borç (bize borçlular)" value={data?.openDebit || '0'} color="error.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Toplam Alacak" value={data?.openCredit || '0'} color="success.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Net Alacak" value={data?.netReceivable || '0'} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Bu Ay Gelir" value={data?.monthIncome || '0'} color="success.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Bu Ay Gider" value={data?.monthExpense || '0'} color="error.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard label="Bu Ay Net" value={data?.monthNet || '0'} /></Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1 }}>Hızlı Erişim</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="outlined" onClick={() => nav('/guests/debtors')}>Borçlular / Alacaklılar</Button>
        <Button variant="outlined" onClick={() => nav('/muhasebe/sahis-cari')}>Şahıs Carileri</Button>
        <Button variant="outlined" onClick={() => nav('/muhasebe/gelir-gider')}>Gelir-Gider</Button>
        <Button variant="outlined" onClick={() => nav('/guests/companies')}>Firma Carileri</Button>
        <Button variant="outlined" onClick={() => nav('/guests/agencies')}>Acente Carileri</Button>
        <Button variant="outlined" onClick={() => nav('/invoices/sales')}>Faturalar</Button>
        <Button variant="outlined" onClick={() => nav('/reports/general')}>Raporlar</Button>
      </Stack>
    </Box>
  );
};

export default AccountingDashboard;

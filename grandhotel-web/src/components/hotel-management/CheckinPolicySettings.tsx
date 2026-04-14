/**
 * CheckinPolicySettings — Check-in Ödeme Politikası
 *
 * Otel Yönetimi sayfasında gösterilir.
 * İki switch:
 *   1. require_payment_at_checkin: Ödeme alınmadan check-in yapılamaz
 *   2. company_exempt_from_checkin_payment: Şirket müşterilerini bu kuraldan muaf tut
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Box,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { hotelApi } from '../../api/services';

const CheckinPolicySettings: React.FC = () => {
  const [requirePayment, setRequirePayment] = useState(false);
  const [companyExempt, setCompanyExempt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    hotelApi.get()
      .then((data) => {
        setRequirePayment(data.requirePaymentAtCheckin || false);
        setCompanyExempt(data.companyExemptFromCheckinPayment || false);
      })
      .catch(() => setSnackbar({ open: true, message: 'Ayarlar yüklenemedi', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hotelApi.update({
        requirePaymentAtCheckin: requirePayment,
        companyExemptFromCheckinPayment: companyExempt,
      });
      setSnackbar({ open: true, message: 'Ayarlar kaydedildi', severity: 'success' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Kaydetme başarısız', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PaymentIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Check-in Ödeme Politikası
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Misafir check-in yaparken ödeme zorunluluğu kuralları.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Switch 1: Ödeme Zorunlu */}
          <FormControlLabel
            control={
              <Switch
                checked={requirePayment}
                onChange={(e) => setRequirePayment(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Check-in Öncesi Ödeme Zorunlu
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Açık olduğunda misafir ödeme yapmadan check-in yapılamaz. Bakiye olan rezervasyonlar reddedilir.
                </Typography>
              </Box>
            }
          />

          {/* Switch 2: Şirket Muafiyeti — sadece switch 1 açıksa anlamlı */}
          <FormControlLabel
            control={
              <Switch
                checked={companyExempt}
                onChange={(e) => setCompanyExempt(e.target.checked)}
                color="success"
                disabled={!requirePayment}
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600} color={!requirePayment ? 'text.disabled' : 'inherit'}>
                  Şirket Müşterilerini Muaf Tut
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Açık olduğunda firmaya bağlı misafirler ödeme yapmadan da check-in yapabilir (faturalama firmaya).
                </Typography>
              </Box>
            }
          />

          {/* Bilgilendirme kutusu */}
          {requirePayment && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Etkin Kural:</strong> {companyExempt
                  ? 'Bireysel misafirler ödeme yapmadan check-in yapamaz. Şirket müşterileri muaf tutulur.'
                  : 'Tüm misafirler ödeme yapmadan check-in yapamaz.'}
              </Typography>
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ alignSelf: 'flex-start' }}
          >
            Kaydet
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default CheckinPolicySettings;

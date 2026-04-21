/**
 * ParasutIntegration — Paraşüt e-Fatura Entegrasyon Ayarları
 *
 * Otel patron/müdürü Paraşüt API bilgilerini buradan girer.
 * Bilgiler kaydedilince e-fatura/e-arşiv kesme aktif olur.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Link as LinkIcon,
  BoltOutlined as TestIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { FormField } from '../../components/forms';
import { invoicesApi } from '../../api/services';

interface ParasutSettings {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
  accountId: string;
  isActive: boolean;
}

const EMPTY_SETTINGS: ParasutSettings = {
  clientId: '',
  clientSecret: '',
  username: '',
  password: '',
  companyId: '',
  accountId: '',
  isActive: false,
};

const ParasutIntegration: React.FC = () => {
  const [settings, setSettings] = useState<ParasutSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.getParasutSettings();
      setSettings(data);
    } catch {
      setSettings(EMPTY_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await invoicesApi.updateParasutSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string> }; message?: string };
      const detail = Object.values(e?.response?.data || {})[0];
      setError(detail || e?.message || 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await invoicesApi.testParasutSettings({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        username: settings.username,
        password: settings.password,
        companyId: settings.companyId,
        accountId: settings.accountId,
      });
      setTestResult(result);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { success?: boolean; message?: string } }; message?: string };
      setTestResult({
        success: false,
        message: e?.response?.data?.message || e?.message || 'Bağlantı testi başarısız.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleChange = (field: keyof ParasutSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    // Credential değişince önceki test sonucu geçersiz — temizle
    if (field !== 'isActive' && field !== 'accountId') {
      setTestResult(null);
    }
  };

  const allFieldsFilled = settings.clientId && settings.clientSecret
    && settings.username && settings.password && settings.companyId;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Paraşüt Entegrasyonu"
        subtitle="e-Fatura ve e-Arşiv fatura kesimi için Paraşüt API ayarlarını yapılandırın"
      />

      {/* Durum Kartı */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ReceiptIcon sx={{ fontSize: 40, color: settings.isActive ? 'success.main' : 'text.disabled' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  e-Fatura Entegrasyonu
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {settings.isActive ? (
                    <Chip icon={<CheckIcon />} label="Aktif" color="success" size="small" />
                  ) : (
                    <Chip icon={<CancelIcon />} label="Pasif" color="default" size="small" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {settings.isActive
                      ? 'Faturalar Paraşüt üzerinden kesilecek'
                      : 'Paraşüt entegrasyonu kapalı — faturalar mock modda çalışır'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  disabled={!allFieldsFilled}
                />
              }
              label={settings.isActive ? 'Aktif' : 'Pasif'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Bilgi */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          Paraşüt hesabınızı <strong>parasut.com</strong> adresinden oluşturabilirsiniz.
          Hesap oluşturduktan sonra <strong>Ayarlar → API Erişimi</strong> bölümünden
          Client ID ve Client Secret bilgilerinizi alın.
          Company ID'nizi adres çubuğunuzdan görebilirsiniz (parasut.com/<strong>123456</strong>/...).
        </Typography>
      </Alert>

      {/* API Bilgileri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="primary" />
            API Bağlantı Bilgileri
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Client ID"
                name="clientId"
                value={settings.clientId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('clientId', e.target.value)}
                placeholder="Paraşüt Client ID"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Client Secret"
                name="clientSecret"
                type={showSecret ? 'text' : 'password'}
                value={settings.clientSecret}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('clientSecret', e.target.value)}
                placeholder="Paraşüt Client Secret"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Kullanıcı Adı (E-posta)"
                name="username"
                value={settings.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)}
                placeholder="parasut@oteliniz.com"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Şifre"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={settings.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)}
                placeholder="Paraşüt hesap şifresi"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Company ID (Şirket No)"
                name="companyId"
                value={settings.companyId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('companyId', e.target.value)}
                placeholder="123456"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Hesap ID (Opsiyonel)"
                name="accountId"
                value={settings.accountId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('accountId', e.target.value)}
                placeholder="Ödeme hesabı ID"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Sonucu */}
      {testResult && (
        <Alert
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message}
        </Alert>
      )}

      {/* Aksiyon Butonları */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
        {saved && (
          <Alert severity="success" sx={{ py: 0 }}>Ayarlar kaydedildi</Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>
        )}
        <Button
          variant="outlined"
          color="info"
          startIcon={testing ? <CircularProgress size={18} color="inherit" /> : <TestIcon />}
          onClick={handleTest}
          disabled={testing || saving || !allFieldsFilled}
          size="large"
        >
          Bağlantı Testi
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || testing}
          size="large"
        >
          Kaydet
        </Button>
      </Box>
    </div>
  );
};

export default ParasutIntegration;

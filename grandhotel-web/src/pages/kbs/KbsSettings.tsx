/**
 * KBS Ayarları Sayfası
 *
 * EGM veya Jandarma sistemi seçimi ve KBS bağlantı bilgilerinin yönetimi.
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
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { FormField } from '../../components/forms';
import { kbsApi } from '../../api/services';
import type { ApiKbsSettings } from '../../api/services';

type SystemType = 'egm' | 'jandarma';

const DEFAULT_URLS: Record<SystemType, string> = {
  egm: 'https://kbs.egm.gov.tr/ws/tesis2',
  jandarma: 'http://uyg.jandarma.tsk.tr/KBS_Tesis/webservis/kbsup.asmx',
};

const EMPTY_SETTINGS: ApiKbsSettings = {
  systemType: 'egm',
  facilityCode: '',
  username: '',
  password: '',
  serviceUrl: DEFAULT_URLS.egm,
  isActive: false,
};

const KbsSettings: React.FC = () => {
  const [settings, setSettings] = useState<ApiKbsSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await kbsApi.getSettings();
      setSettings({
        ...EMPTY_SETTINGS,
        ...data,
        serviceUrl: data.serviceUrl || DEFAULT_URLS[data.systemType || 'egm'],
      });
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
      await kbsApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ApiKbsSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSystemChange = (_: React.MouseEvent<HTMLElement>, newSystem: SystemType | null) => {
    if (!newSystem) return;
    setSettings((prev) => ({
      ...prev,
      systemType: newSystem,
      serviceUrl: DEFAULT_URLS[newSystem],
    }));
  };

  const allFieldsFilled = settings.facilityCode && settings.username && settings.password && settings.serviceUrl;

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
        title="KBS Ayarları"
        subtitle="Kimlik Bildirim Sistemi bağlantı ayarlarını yapılandırın"
      />

      {/* Durum Kartı */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BadgeIcon sx={{ fontSize: 40, color: settings.isActive ? 'success.main' : 'text.disabled' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  KBS Entegrasyonu
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {settings.isActive ? (
                    <Chip icon={<CheckIcon />} label="Aktif" color="success" size="small" />
                  ) : (
                    <Chip icon={<CancelIcon />} label="Pasif" color="default" size="small" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {settings.isActive
                      ? 'Misafir bildirimleri otomatik olarak yapılacak'
                      : 'KBS entegrasyonu kapalı'}
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

      {/* Bildirimler */}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Ayarlar başarıyla kaydedildi.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Sistem Seçimi */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Sistem Seçimi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tesisinizin bağlı olduğu kolluk kuvvetini seçin. Servis URL'si otomatik olarak doldurulacaktır.
          </Typography>

          <ToggleButtonGroup
            value={settings.systemType}
            exclusive
            onChange={handleSystemChange}
            sx={{ mb: 1 }}
          >
            <ToggleButton
              value="egm"
              sx={{
                px: 4,
                py: 1.5,
                gap: 1,
                '&.Mui-selected': { backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } },
              }}
            >
              <SecurityIcon />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>EGM (Emniyet)</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Emniyet Genel Müdürlüğü</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton
              value="jandarma"
              sx={{
                px: 4,
                py: 1.5,
                gap: 1,
                '&.Mui-selected': { backgroundColor: 'success.main', color: 'white', '&:hover': { backgroundColor: 'success.dark' } },
              }}
            >
              <ShieldIcon />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>Jandarma</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Jandarma Genel Komutanlığı</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Bağlantı Bilgileri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Bağlantı Bilgileri
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Tesis Kodu"
                name="facilityCode"
                value={settings.facilityCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('facilityCode', e.target.value)}
                placeholder="Örn: 12345"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Kullanıcı Adı"
                name="username"
                value={settings.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)}
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
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormField
                label="Servis URL"
                name="serviceUrl"
                value={settings.serviceUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('serviceUrl', e.target.value)}
                helperText="Sistem seçimine göre otomatik doldurulur, gerekirse manuel düzenleyebilirsiniz"
                required
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Kaydet Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ px: 4 }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
    </div>
  );
};

export default KbsSettings;

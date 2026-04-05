/**
 * CommissionSettings — Komisyon Ayarları Bölümü
 *
 * Otel Yönetimi sayfasında gösterilir.
 * Patron/müdür komisyon sistemini açıp kapatabilir,
 * minimum tutar ve komisyon oranını belirleyebilir.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Box,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  TrendingUp as CommissionIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { commissionApi } from '../../api/services';
import type { CommissionSettingsData } from '../../api/services';

const CommissionSettings: React.FC = () => {
  const [settings, setSettings] = useState<CommissionSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    commissionApi.getSettings()
      .then(setSettings)
      .catch(() => setSnackbar({ open: true, message: 'Komisyon ayarları yüklenemedi', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await commissionApi.updateSettings(settings);
      setSettings(updated);
      setSnackbar({ open: true, message: 'Komisyon ayarları kaydedildi', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Kaydetme başarısız', severity: 'error' });
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

  if (!settings) return null;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CommissionIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Komisyon Ayarları
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Garson/barista masalara servis yaptığında komisyon kazanabilir. Bu sistemi buradan yönetin.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Aktif/Pasif */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.isActive}
                onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Komisyon Sistemi {settings.isActive ? 'Aktif' : 'Pasif'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Kapatırsanız ödeme yapıldığında komisyon hesaplanmaz
                </Typography>
              </Box>
            }
          />

          {/* Ayarlar — sadece aktifse göster */}
          {settings.isActive && (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Minimum Masa Tutarı"
                type="number"
                value={settings.minAmount}
                onChange={(e) => setSettings({ ...settings, minAmount: e.target.value })}
                helperText="Bu tutarın altındaki masalardan komisyon hesaplanmaz"
                InputProps={{
                  endAdornment: <InputAdornment position="end">₺</InputAdornment>,
                }}
                sx={{ width: 250 }}
              />
              <TextField
                label="Komisyon Oranı"
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
                helperText="Masa toplam tutarı üzerinden hesaplanır"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                sx={{ width: 200 }}
              />
            </Box>
          )}

          {/* Örnek hesaplama */}
          {settings.isActive && (
            <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 2, border: '1px solid #bae6fd' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Örnek:</strong> Garson bir masaya servis yaptı, masa toplamı{' '}
                {Number(settings.minAmount) > 0 ? `${Number(settings.minAmount).toLocaleString('tr-TR')} ₺'nin üzerinde, mesela ` : ''}
                2.000 ₺ oldu →{' '}
                Garson <strong>{(2000 * Number(settings.commissionRate) / 100).toLocaleString('tr-TR')} ₺</strong> komisyon kazanır.
              </Typography>
            </Box>
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

export default CommissionSettings;

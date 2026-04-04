/**
 * Ayarlar Sayfasi
 *
 * 1. Sifre degistir (mevcut sifre, yeni sifre, onay)
 * 2. Bildirim ayarlari (placeholder switch'ler)
 * 3. Uygulama bilgisi (versiyon, otel adi)
 *
 * Sifre degistirme: staffApi.update(id, { password }) ile PATCH
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { staffApi } from '../../api/services';
import useAuth from '../../hooks/useAuth';

const Settings: React.FC = () => {
  const { user } = useAuth();

  /* Sifre degistirme state */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /* Bildirim ayarlari (placeholder) */
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [shiftReminders, setShiftReminders] = useState(false);

  /** Sifre degistirme islemi */
  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tum alanlari doldurun.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Yeni sifre en az 4 karakter olmalidir.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni sifre ve onay uyusmuyor.');
      return;
    }

    if (!user) {
      setPasswordError('Oturum bilgisi bulunamadi.');
      return;
    }

    setPasswordLoading(true);
    try {
      await staffApi.update(user.id, {
        currentPassword,
        password: newPassword,
      });
      setPasswordSuccess('Sifreniz basariyla degistirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; currentPassword?: string[]; password?: string[] } } };
      const message =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.currentPassword?.[0] ||
        axiosErr?.response?.data?.password?.[0] ||
        'Sifre degistirilirken bir hata olustu.';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Ayarlar" subtitle="Hesap ve uygulama ayarlari" />

      <Grid container spacing={3} sx={{ maxWidth: 900 }}>
        {/* Bolum 1: Sifre Degistir */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Sifre Degistir
                </Typography>
              </Box>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess(null)}>
                  {passwordSuccess}
                </Alert>
              )}
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
                  {passwordError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Mevcut Sifre"
                    size="small"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Yeni Sifre"
                    size="small"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Yeni Sifre (Tekrar)"
                    size="small"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  startIcon={passwordLoading ? <CircularProgress size={16} /> : <LockIcon />}
                >
                  {passwordLoading ? 'Degistiriliyor...' : 'Sifreyi Degistir'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bolum 2: Bildirim Ayarlari */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationsIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Bildirim Ayarlari
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Bu ayarlar yakin zamanda aktif edilecektir.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                }
                label="E-posta bildirimleri"
              />
              <Divider sx={{ my: 0.5 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                }
                label="Anlık bildirimler (push)"
              />
              <Divider sx={{ my: 0.5 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={shiftReminders}
                    onChange={(e) => setShiftReminders(e.target.checked)}
                  />
                }
                label="Vardiya hatirlatmalari"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Bolum 3: Uygulama Bilgisi */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="primary" sx={{ fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Uygulama Bilgisi
                </Typography>
              </Box>

              <InfoRow label="Uygulama" value="GrandHotel PMS" />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Versiyon" value="1.0.0" />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Otel" value={user?.hotelName || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Kullanici" value={user ? `${user.firstName} ${user.lastName}` : '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Rol" value={user?.roles?.join(', ') || user?.role || '-'} />
            </CardContent>
          </Card>
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

export default Settings;

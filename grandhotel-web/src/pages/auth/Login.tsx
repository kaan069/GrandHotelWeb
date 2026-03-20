/**
 * Login Sayfası
 *
 * Kullanıcı giriş ekranı.
 * Şube Kodu + Personel Numarası + Şifre ile giriş yapılır.
 * Başarılı girişten sonra dashboard'a yönlendirilir.
 *
 * Mock test: Şube: 001, Numara: 1001-1007, Şifre: 1234
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';

import { FormField } from '../../components/forms';
import useAuth from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

interface LoginFormData {
  branchCode: string;
  staffNumber: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  /* Form state */
  const [formData, setFormData] = useState<LoginFormData>({
    branchCode: '',
    staffNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Login öncesi gidilmeye çalışılan sayfa (varsa oraya yönlendir) */
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  /** Form alanı değişikliğini işle */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  /** Giriş formunu gönder */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.branchCode, formData.staffNumber, formData.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F0F4F8',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo ve başlık */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '1.75rem',
                mb: 0.5,
              }}
            >
              {APP_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personel Giriş
            </Typography>
          </Box>

          {/* Hata mesajı */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Giriş formu */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Şube Kodu */}
              <FormField
                label="Şube Kodu"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                placeholder="Örn: 001"
              />

              {/* Personel Numarası */}
              <FormField
                label="Personel Numarası"
                name="staffNumber"
                value={formData.staffNumber}
                onChange={handleChange}
                placeholder="Örn: 1001"
              />

              {/* Şifre */}
              <FormField
                label="Şifre"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Şifrenizi girin"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Giriş butonu */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{ mt: 1, py: 1.5 }}
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </Box>
          </form>

          {/* Alt bilgi */}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 4 }}
          >
            {APP_NAME} &copy; {new Date().getFullYear()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

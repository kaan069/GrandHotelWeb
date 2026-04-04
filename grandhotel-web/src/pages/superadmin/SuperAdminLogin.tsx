/**
 * SuperAdmin Login Sayfasi
 *
 * Superadmin paneline erisim icin sifre girisi.
 * Basarili giriste superadmin_token localStorage'a kaydedilir.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  TextField,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const SuperAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/hotel/superadmin/login/`, { password });
      const { token } = response.data;
      localStorage.setItem('superadmin_token', token);
      navigate('/superadmin', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Giris yapilamadi. Sifrenizi kontrol edin.');
      }
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
        bgcolor: '#1A1A2E',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Baslik */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AdminIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
            >
              SuperAdmin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Yonetim paneline erisim icin sifrenizi girin
            </Typography>
          </Box>

          {/* Hata mesaji */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="SuperAdmin Sifresi"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Sifrenizi girin"
                fullWidth
                autoFocus
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading || !password}
                startIcon={<AdminIcon />}
                sx={{ mt: 1, py: 1.5 }}
              >
                {loading ? 'Giris Yapiliyor...' : 'Giris Yap'}
              </Button>
            </Box>
          </form>

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 4 }}
          >
            GrandHotel SuperAdmin &copy; {new Date().getFullYear()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SuperAdminLogin;

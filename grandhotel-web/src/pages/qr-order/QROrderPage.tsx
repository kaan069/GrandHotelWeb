/**
 * QR Sipariş Sayfası (Public — Auth yok)
 *
 * Müşteri QR kod okutarak menüden sipariş verir.
 * Mobil uyumlu, hızlı yüklenen, minimal tasarım.
 *
 * URL: /qr-order/:token
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Badge,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import { qrApi } from '../../api/services';
import type { ApiQRMenu } from '../../api/services';

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface OrderStatusItem {
  quantity: number;
  description: string;
  status: string;
}

interface OrderStatus {
  tabNo?: string;
  totalAmount?: string;
  items?: OrderStatusItem[];
}

const QROrderPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [menu, setMenu] = useState<ApiQRMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestName, setGuestName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState<{ tabNo: string; totalAmount: string } | null>(null);

  /* Status polling */
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  /** Menüyü yükle */
  useEffect(() => {
    if (!token) return;
    qrApi.getMenu(token)
      .then((data) => {
        setMenu(data);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      })
      .catch(() => setError('Geçersiz QR kod veya menü yüklenemedi'))
      .finally(() => setLoading(false));
  }, [token]);

  /** Sepete ekle */
  const addToCart = (item: { id: number; name: string; price: string }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: parseFloat(item.price), quantity: 1, notes: '' }];
    });
  };

  /** Sepetten çıkar */
  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItemId !== menuItemId);
    });
  };

  /** Sipariş gönder */
  const handleSubmit = async () => {
    if (!token || cart.length === 0) return;
    setSubmitting(true);
    try {
      const result = await qrApi.placeOrder(token, {
        guestName: guestName || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          notes: c.notes,
        })),
      });
      setOrderResult(result);
      setOrderSuccess(true);
      setCart([]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Sipariş gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  /** Sipariş durumu */
  const checkStatus = async () => {
    if (!token) return;
    try {
      const data = await qrApi.getStatus(token);
      setOrderStatus(data);
      setShowStatus(true);
    } catch {
      setError('Durum kontrol edilemedi');
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !menu) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>Hata</Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  if (orderSuccess) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <CheckIcon sx={{ fontSize: 80, color: '#22c55e', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>Sipariş Alındı!</Typography>
        {orderResult && (
          <>
            <Typography variant="h6" color="text.secondary">
              Adisyon No: {orderResult.tabNo}
            </Typography>
            <Typography variant="h5" fontWeight={600} color="primary" sx={{ mt: 1 }}>
              Toplam: {parseFloat(orderResult.totalAmount).toFixed(2)} ₺
            </Typography>
          </>
        )}
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Siparişiniz mutfağa iletildi. Kısa sürede hazırlanacak.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button variant="contained" onClick={() => setOrderSuccess(false)}>
            Yeni Sipariş
          </Button>
          <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={checkStatus}>
            Durumu Kontrol Et
          </Button>
        </Box>
      </Box>
    );
  }

  const currentCategory = menu?.categories.find((c) => c.id === selectedCategory);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: cart.length > 0 ? 10 : 2 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', p: 2, boxShadow: 1, position: 'sticky', top: 0, zIndex: 10 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center">
          {menu?.table.serviceArea}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Masa {menu?.table.tableNumber}
        </Typography>
      </Box>

      {/* Kategori Tabs */}
      <Box sx={{ display: 'flex', gap: 1, p: 1.5, overflowX: 'auto', bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        {menu?.categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => setSelectedCategory(cat.id)}
            color={selectedCategory === cat.id ? 'primary' : 'default'}
            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>

      {/* Ürün Listesi */}
      <Box sx={{ p: 1.5 }}>
        <Grid container spacing={1.5}>
          {currentCategory?.items.map((item) => {
            const inCart = cart.find((c) => c.menuItemId === item.id);
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                <Card variant="outlined" sx={{ borderColor: inCart ? '#3b82f6' : '#e2e8f0' }}>
                  <CardContent sx={{ pb: '8px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                      )}
                      <Typography variant="h6" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                        {parseFloat(item.price).toFixed(2)} ₺
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {inCart ? (
                        <>
                          <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                            <RemoveIcon />
                          </IconButton>
                          <Typography fontWeight={700} sx={{ minWidth: 24, textAlign: 'center' }}>
                            {inCart.quantity}
                          </Typography>
                          <IconButton size="small" color="primary" onClick={() => addToCart(item)}>
                            <AddIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton color="primary" onClick={() => addToCart(item)}>
                          <AddIcon />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Sepet Bar (Sticky bottom) */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'white',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            p: 2,
            zIndex: 20,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Badge badgeContent={cartCount} color="primary">
              <CartIcon />
            </Badge>
            <Typography variant="h6" fontWeight={700}>
              {cartTotal.toFixed(2)} ₺
            </Typography>
          </Box>
          <TextField
            placeholder="İsminiz (opsiyonel)"
            size="small"
            fullWidth
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem' }}
          >
            {submitting ? 'Gönderiliyor...' : `Sipariş Ver (${cartTotal.toFixed(2)} ₺)`}
          </Button>
        </Box>
      )}

      {/* Sipariş Durumu Dialog */}
      {showStatus && orderStatus && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Card sx={{ width: '100%', maxWidth: 400, maxHeight: '80vh', overflow: 'auto' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Sipariş Durumu</Typography>
                <Button size="small" onClick={() => setShowStatus(false)}>Kapat</Button>
              </Box>
              {orderStatus.tabNo && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Adisyon: {orderStatus.tabNo} · Toplam: {orderStatus.totalAmount} ₺
                </Typography>
              )}
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {orderStatus.items?.map((item, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${item.quantity}x ${item.description}`}
                      secondary={
                        <Chip
                          label={
                            item.status === 'pending' ? 'Bekliyor' :
                            item.status === 'preparing' ? 'Hazırlanıyor' :
                            item.status === 'ready' ? 'Hazır!' :
                            item.status === 'served' ? 'Servis Edildi' : item.status
                          }
                          size="small"
                          color={
                            item.status === 'ready' ? 'success' :
                            item.status === 'preparing' ? 'warning' : 'default'
                          }
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" onClick={checkStatus} sx={{ mt: 1 }}>
                Yenile
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default QROrderPage;

/**
 * QR Oda Servisi Sipariş Sayfası (Public — Auth yok)
 *
 * Müşteri odasındaki QR kodu okutarak menüden sipariş verir.
 * Sipariş mutfağa düşer ve oda folio'suna otomatik eklenir.
 *
 * URL: /qr-room/:roomNumber
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
  IconButton,
  Typography,
  Badge,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  RoomService as RoomServiceIcon,
  CheckCircle as CheckIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { qrApi } from '../../api/services';

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface MenuCategory {
  id: number;
  name: string;
  items: Array<{ id: number; name: string; price: string; description: string; isAvailable: boolean }>;
}

const QRRoomOrderPage: React.FC = () => {
  const { roomNumber } = useParams<{ roomNumber: string }>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [roomInfo, setRoomInfo] = useState<{ roomNumber: string; guestName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState<{ tabNo: string; totalAmount: string; message: string } | null>(null);

  useEffect(() => {
    if (!roomNumber) return;
    qrApi.getRoomMenu(roomNumber)
      .then((data: Record<string, unknown>) => {
        const cats = (data.categories || []) as MenuCategory[];
        setCategories(cats);
        setRoomInfo({
          roomNumber: (data.roomNumber as string) || roomNumber || '',
          guestName: (data.guestName as string) || '',
        });
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      })
      .catch(() => setError('Geçersiz oda numarası veya aktif konaklama bulunamadı'))
      .finally(() => setLoading(false));
  }, [roomNumber]);

  const addToCart = (item: { id: number; name: string; price: string }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: parseFloat(item.price), quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter((c) => c.menuItemId !== menuItemId);
    });
  };

  const handleSubmit = async () => {
    if (!roomNumber || cart.length === 0) return;
    setSubmitting(true);
    try {
      const result = await qrApi.placeRoomOrder(roomNumber, {
        items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes })),
      });
      setOrderResult(result as { tabNo: string; totalAmount: string; message: string });
      setOrderSuccess(true);
      setCart([]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr?.response?.data?.error || 'Sipariş gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const currentItems = categories.find((c) => c.id === selectedCategory)?.items || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>{error}</Alert>
      </Box>
    );
  }

  // Sipariş başarılı
  if (orderSuccess && orderResult) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 400, borderRadius: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Siparişiniz Alındı!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {orderResult.message || 'Siparişiniz mutfağa iletildi. Odanıza getirilecektir.'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Adisyon No</Typography>
              <Typography variant="body2" fontWeight={700}>{orderResult.tabNo}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Oda</Typography>
              <Typography variant="body2" fontWeight={700}>{roomInfo?.roomNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Toplam</Typography>
              <Typography variant="body2" fontWeight={700}>{parseFloat(orderResult.totalAmount).toLocaleString('tr-TR')} ₺</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Tutar oda hesabınıza yansıtılmıştır.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              onClick={() => { setOrderSuccess(false); setOrderResult(null); }}
            >
              Yeni Sipariş Ver
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: cart.length > 0 ? 10 : 2 }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#1565C0', color: '#fff', p: 2, textAlign: 'center' }}>
        <HotelIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700}>Oda Servisi</Typography>
        {roomInfo && (
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Oda {roomInfo.roomNumber} {roomInfo.guestName ? `— ${roomInfo.guestName}` : ''}
          </Typography>
        )}
      </Box>

      {/* Kategori filtreleri */}
      <Box sx={{ display: 'flex', gap: 1, p: 1.5, overflowX: 'auto', bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => setSelectedCategory(cat.id)}
            color={selectedCategory === cat.id ? 'primary' : 'default'}
            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Ürün listesi */}
      <Box sx={{ p: 1.5 }}>
        {currentItems.filter(i => i.isAvailable !== false).map((item) => {
          const inCart = cart.find((c) => c.menuItemId === item.id);
          return (
            <Card key={item.id} sx={{ mb: 1, borderRadius: 2 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={600}>{item.name}</Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                  )}
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {parseFloat(item.price).toLocaleString('tr-TR')} ₺
                  </Typography>
                </Box>
                {inCart ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography fontWeight={700}>{inCart.quantity}</Typography>
                    <IconButton size="small" color="primary" onClick={() => addToCart(item)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton color="primary" onClick={() => addToCart(item)}>
                    <AddIcon />
                  </IconButton>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Sepet — sabit alt bar */}
      {cart.length > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          bgcolor: '#fff', borderTop: '2px solid #e2e8f0',
          p: 2, display: 'flex', alignItems: 'center', gap: 2,
          zIndex: 100,
        }}>
          <Badge badgeContent={cartCount} color="primary">
            <CartIcon color="action" />
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700}>
              {cartTotal.toLocaleString('tr-TR')} ₺
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cartCount} ürün
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <RoomServiceIcon />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            Odama Servis Et
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default QRRoomOrderPage;

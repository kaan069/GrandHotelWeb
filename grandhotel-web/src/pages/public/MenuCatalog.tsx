/**
 * Müşteri Tarafı Menü Kataloğu — /menu/:branchCode
 *
 * QR kodla açılır. Müşteri menüyü tarar, sepete ekler, oda numarası ve
 * adını seçer, kart ödeme adımını geçer (UI sadece — iyzico sonra),
 * sipariş mutfak ekranına düşer.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  RestaurantMenu as MenuIcon,
  Restaurant as PlateIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  CreditCard as CardIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import { menuApi } from '../../api/services';
import type {
  ApiCatalogResponse,
  ApiCatalogItem,
  ApiCatalogRoom,
} from '../../api/services';
import { formatCurrency } from '../../utils/formatters';

interface CartLine {
  item: ApiCatalogItem;
  quantity: number;
}

const MenuCatalog: React.FC = () => {
  const { branchCode } = useParams<{ branchCode: string }>();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('t') || undefined;
  const [data, setData] = useState<ApiCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  /* Sepet */
  const [cart, setCart] = useState<CartLine[]>([]);

  /* Ürün detay */
  const [detailItem, setDetailItem] = useState<ApiCatalogItem | null>(null);

  /* Sipariş dialog */
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(0); // 0: cart, 1: oda+isim, 2: ödeme, 3: başarı
  const [rooms, setRooms] = useState<ApiCatalogRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ tabNo: string; total: string } | null>(null);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    setLoading(true);
    menuApi
      .getCatalog(branchCode, accessToken)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        if (res.categories.length > 0) setActiveCategoryId(res.categories[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.status === 403 ? 'noaccess' : 'Menü bulunamadı.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchCode, accessToken]);

  /* Sepet hesaplamaları */
  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + Number(l.item.price) * l.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity, 0),
    [cart],
  );

  /* Sepete ekle / arttır / azalt */
  const addToCart = (item: ApiCatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const decrement = (id: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((l) => l.item.id !== id));
  };

  const cartQty = (id: number) => cart.find((l) => l.item.id === id)?.quantity ?? 0;

  /* Sipariş akışı */
  const openOrderDialog = () => {
    setOrderStep(0);
    setOrderError(null);
    setOrderDialogOpen(true);
  };

  const closeOrderDialog = () => {
    setOrderDialogOpen(false);
    if (orderResult) {
      // Başarılıysa sepeti temizle ve formu sıfırla
      setCart([]);
      setSelectedRoom('');
      setCustomerName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardHolder('');
      setOrderResult(null);
      setOrderStep(0);
    }
  };

  const goToRoomStep = async () => {
    if (!branchCode) return;
    setRoomsLoading(true);
    setOrderError(null);
    try {
      const list = await menuApi.getCatalogRooms(branchCode, accessToken);
      setRooms(list);
      setOrderStep(1);
    } catch {
      setOrderError('Odalar yüklenemedi.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const goToPaymentStep = () => {
    if (!selectedRoom) {
      setOrderError('Lütfen oda numaranızı seçin.');
      return;
    }
    if (!customerName.trim()) {
      setOrderError('Lütfen adınızı girin.');
      return;
    }
    setOrderError(null);
    setOrderStep(2);
  };

  const submitOrder = async () => {
    if (!branchCode) return;
    // Kart bilgileri minimum dolu olsun (UI doğrulama, ödeme yok)
    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim() || !cardHolder.trim()) {
      setOrderError('Lütfen kart bilgilerini eksiksiz girin.');
      return;
    }
    setSubmitting(true);
    setOrderError(null);
    try {
      const res = await menuApi.placeCatalogOrder(branchCode, {
        roomNumber: selectedRoom,
        customerName: customerName.trim(),
        items: cart.map((l) => ({
          menuItemId: l.item.id,
          quantity: l.quantity,
        })),
      }, accessToken);
      setOrderResult({ tabNo: res.tabNo, total: res.totalAmount });
      setOrderStep(3);
    } catch (e: any) {
      setOrderError(e?.response?.data?.error || 'Sipariş gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToCategory = (catId: number) => {
    setActiveCategoryId(catId);
    const el = sectionRefs.current[catId];
    if (el) {
      const yOffset = -80;
      const top = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const themeBg = useMemo(
    () => 'linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 200px)',
    [],
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeBg,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    const isAccessDenied = error === 'noaccess';
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeBg,
          p: 3,
        }}
      >
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 360 }}>
          <MenuIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {isAccessDenied ? 'Erişim Engellendi' : 'Menü Bulunamadı'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAccessDenied
              ? 'Menüye sadece QR kodu okutarak erişebilirsiniz. Lütfen restoranda/otelde bulunan QR kodunu okutun.'
              : 'Bu QR kodu artık geçerli değil ya da otel kayıtlı değil.'}
          </Typography>
        </Card>
      </Box>
    );
  }

  const { hotel, categories } = data;
  const isEmpty = categories.length === 0;
  const serviceClosed = hotel.serviceOpen === false;

  return (
    <Box sx={{ minHeight: '100vh', background: themeBg, pb: cart.length ? 12 : 6 }}>
      {/* Hero */}
      <Box
        sx={{
          py: { xs: 4, sm: 5 },
          px: 2,
          textAlign: 'center',
          color: '#3E2C1C',
        }}
      >
        {hotel.logoUrl ? (
          <Box
            component="img"
            src={hotel.logoUrl}
            alt={hotel.name}
            sx={{
              height: { xs: 64, sm: 80 },
              maxWidth: '70%',
              objectFit: 'contain',
              mb: 1.5,
            }}
          />
        ) : (
          <MenuIcon sx={{ fontSize: 56, color: '#B89968', mb: 1 }} />
        )}
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          {hotel.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#8B7355', mt: 0.5 }}>
          Menü
        </Typography>
      </Box>

      {/* Servis kapalı uyarı bandı */}
      {serviceClosed && (
        <Box
          sx={{
            bgcolor: '#C0392B',
            color: '#FFF',
            py: 1.5,
            px: 2,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(192, 57, 43, 0.3)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Şu an sipariş alınmıyor — Lütfen daha sonra tekrar deneyin
          </Typography>
        </Box>
      )}

      {/* Sticky kategori navigasyonu */}
      {!isEmpty && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1.5,
            px: 2,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ display: 'inline-flex' }}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                onClick={() => scrollToCategory(cat.id)}
                sx={{
                  fontWeight: 600,
                  px: 0.5,
                  cursor: 'pointer',
                  backgroundColor:
                    activeCategoryId === cat.id ? '#3E2C1C' : '#F5EFE6',
                  color: activeCategoryId === cat.id ? '#FFF' : '#3E2C1C',
                  '&:hover': {
                    backgroundColor:
                      activeCategoryId === cat.id ? '#3E2C1C' : '#E8DFD0',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Container maxWidth="md" sx={{ pt: 3 }}>
        {isEmpty ? (
          <Card sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <PlateIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6">Menü Hazırlanıyor</Typography>
            <Typography variant="body2" color="text.secondary">
              Menümüz çok yakında burada olacak.
            </Typography>
          </Card>
        ) : (
          categories.map((cat) => (
            <Box
              key={cat.id}
              ref={(el: HTMLDivElement | null) => {
                sectionRefs.current[cat.id] = el;
              }}
              sx={{ mb: 5, scrollMarginTop: 80 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#3E2C1C',
                  mb: 2,
                  pb: 1,
                  borderBottom: '2px solid #B89968',
                  display: 'inline-block',
                }}
              >
                {cat.name}
              </Typography>

              <Stack spacing={2}>
                {cat.items.map((item) => {
                  const qty = cartQty(item.id);
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setDetailItem(item)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(60, 40, 20, 0.08)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(60, 40, 20, 0.15)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 110, sm: 140 },
                          minHeight: { xs: 110, sm: 140 },
                          flexShrink: 0,
                          background: item.imageUrl
                            ? `url(${item.imageUrl}) center/cover no-repeat`
                            : 'linear-gradient(135deg, #F5EFE6 0%, #E8DFD0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!item.imageUrl && (
                          <PlateIcon
                            sx={{ fontSize: 36, color: '#B89968', opacity: 0.6 }}
                          />
                        )}
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          p: { xs: 1.5, sm: 2 },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minWidth: 0,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: '#3E2C1C',
                              lineHeight: 1.3,
                              mb: 0.5,
                            }}
                          >
                            {item.name}
                          </Typography>
                          {item.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: { xs: 12, sm: 13 },
                              }}
                            >
                              {item.description}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1,
                          }}
                        >
                          <Chip
                            label={formatCurrency(Number(item.price))}
                            sx={{
                              fontWeight: 700,
                              backgroundColor: '#3E2C1C',
                              color: '#FFF',
                            }}
                          />
                          {qty === 0 ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                              disabled={serviceClosed}
                              sx={{
                                backgroundColor: '#B89968',
                                '&:hover': { backgroundColor: '#9A8155' },
                                fontWeight: 700,
                              }}
                            >
                              Ekle
                            </Button>
                          ) : (
                            <Stack
                              direction="row"
                              alignItems="center"
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                bgcolor: '#3E2C1C',
                                borderRadius: 999,
                                color: '#FFF',
                                opacity: serviceClosed ? 0.5 : 1,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); decrement(item.id); }}
                                sx={{ color: '#FFF' }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                                {qty}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                disabled={serviceClosed}
                                sx={{ color: '#FFF', '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' } }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          ))
        )}
      </Container>

      {/* Sepet FAB */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#3E2C1C',
            color: '#FFF',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
            zIndex: 20,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge badgeContent={cartCount} color="warning">
              <CartIcon />
            </Badge>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Toplam
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {formatCurrency(cartTotal)}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={openOrderDialog}
            disabled={serviceClosed}
            sx={{
              bgcolor: '#B89968',
              '&:hover': { bgcolor: '#9A8155' },
              fontWeight: 700,
              px: 3,
            }}
          >
            {serviceClosed ? 'Servis Kapalı' : 'Sipariş Ver'}
          </Button>
        </Box>
      )}

      {/* Sipariş dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={submitting ? undefined : closeOrderDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {orderStep === 0 && 'Sepetiniz'}
          {orderStep === 1 && 'Oda Bilgisi'}
          {orderStep === 2 && 'Ödeme'}
          {orderStep === 3 && 'Sipariş Alındı'}
        </DialogTitle>

        {orderStep < 3 && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Stepper activeStep={orderStep} alternativeLabel>
              <Step><StepLabel>Sepet</StepLabel></Step>
              <Step><StepLabel>Oda</StepLabel></Step>
              <Step><StepLabel>Ödeme</StepLabel></Step>
            </Stepper>
          </Box>
        )}

        <DialogContent>
          {/* 0: Sepet */}
          {orderStep === 0 && (
            <Stack spacing={1.5}>
              {cart.map((line) => (
                <Box
                  key={line.item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {line.item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(Number(line.item.price))} × {line.quantity}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center">
                    <IconButton size="small" onClick={() => decrement(line.item.id)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                      {line.quantity}
                    </Typography>
                    <IconButton size="small" onClick={() => addToCart(line.item)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeFromCart(line.item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 700 }}>
                    {formatCurrency(Number(line.item.price) * line.quantity)}
                  </Typography>
                </Box>
              ))}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Toplam
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2C1C' }}>
                  {formatCurrency(cartTotal)}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* 1: Oda + isim */}
          {orderStep === 1 && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {rooms.length === 0 ? (
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FFF7E6',
                  border: '1px solid #F5D08A',
                  color: '#7A5A00',
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Şu an aktif misafir bulunmuyor
                  </Typography>
                  <Typography variant="body2">
                    Sipariş verebilmek için odanın resepsiyondan check-in yapılmış olması gerekir.
                    Lütfen resepsiyona danışın.
                  </Typography>
                </Box>
              ) : (
                <TextField
                  select
                  label="Oda Numarası"
                  fullWidth
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: { style: { maxHeight: 320 } },
                    },
                  }}
                  helperText="Lütfen kaldığınız odayı seçin."
                >
                  {rooms.map((r) => (
                    <MenuItem key={r.roomNumber} value={r.roomNumber}>
                      Oda {r.roomNumber}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                label="Adınız Soyadınız"
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={rooms.length === 0}
              />
            </Stack>
          )}

          {/* 2: Ödeme */}
          {orderStep === 2 && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#3E2C1C' }}>
                <CardIcon />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Kredi Kartı Bilgileri
                </Typography>
              </Box>
              <TextField
                label="Kart Üzerindeki İsim"
                fullWidth
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
              />
              <TextField
                label="Kart Numarası"
                fullWidth
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, '').slice(0, 19))}
                placeholder="0000 0000 0000 0000"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Son Kul. Tar. (AA/YY)"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                  placeholder="12/27"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Ödenecek
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2C1C' }}>
                  {formatCurrency(cartTotal)}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* 3: Başarı */}
          {orderStep === 3 && orderResult && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckIcon sx={{ fontSize: 72, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Siparişiniz alındı
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adisyon No: <strong>{orderResult.tabNo}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mutfağımıza iletildi. En kısa sürede odanıza getirilecek.
              </Typography>
            </Box>
          )}

          {orderError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {orderError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {orderStep === 0 && (
            <>
              <Button onClick={closeOrderDialog} color="inherit">İptal</Button>
              <Button
                variant="contained"
                onClick={goToRoomStep}
                disabled={cart.length === 0 || roomsLoading}
                sx={{ bgcolor: '#3E2C1C', '&:hover': { bgcolor: '#2D1F12' } }}
              >
                {roomsLoading ? <CircularProgress size={20} sx={{ color: '#FFF' }} /> : 'Devam Et'}
              </Button>
            </>
          )}
          {orderStep === 1 && (
            <>
              <Button onClick={() => setOrderStep(0)} color="inherit">Geri</Button>
              <Button
                variant="contained"
                onClick={goToPaymentStep}
                disabled={rooms.length === 0}
                sx={{ bgcolor: '#3E2C1C', '&:hover': { bgcolor: '#2D1F12' } }}
              >
                Devam Et
              </Button>
            </>
          )}
          {orderStep === 2 && (
            <>
              <Button onClick={() => setOrderStep(1)} color="inherit" disabled={submitting}>
                Geri
              </Button>
              <Button
                variant="contained"
                onClick={submitOrder}
                disabled={submitting}
                sx={{ bgcolor: '#3E2C1C', '&:hover': { bgcolor: '#2D1F12' } }}
              >
                {submitting ? <CircularProgress size={20} sx={{ color: '#FFF' }} /> : 'Öde ve Sipariş Ver'}
              </Button>
            </>
          )}
          {orderStep === 3 && (
            <Button
              variant="contained"
              onClick={closeOrderDialog}
              fullWidth
              sx={{ bgcolor: '#3E2C1C', '&:hover': { bgcolor: '#2D1F12' } }}
            >
              Kapat
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Ürün detay dialog */}
      <Dialog
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {detailItem && (() => {
          const qty = cartQty(detailItem.id);
          return (
            <>
              {/* Büyük resim */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  background: detailItem.imageUrl
                    ? `url(${detailItem.imageUrl}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #F5EFE6 0%, #E8DFD0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {!detailItem.imageUrl && (
                  <PlateIcon sx={{ fontSize: 80, color: '#B89968', opacity: 0.6 }} />
                )}
                <IconButton
                  onClick={() => setDetailItem(null)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: '#FFF' },
                    color: '#3E2C1C',
                  }}
                  size="small"
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#3E2C1C', flex: 1 }}>
                    {detailItem.name}
                  </Typography>
                  <Chip
                    label={formatCurrency(Number(detailItem.price))}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#3E2C1C',
                      color: '#FFF',
                      fontSize: '1rem',
                      height: 36,
                    }}
                  />
                </Box>
                {detailItem.description ? (
                  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {detailItem.description}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    Bu ürün için açıklama eklenmemiş.
                  </Typography>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2, bgcolor: '#FAF7F2' }}>
                {qty === 0 ? (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => addToCart(detailItem)}
                    disabled={serviceClosed}
                    sx={{
                      bgcolor: '#3E2C1C',
                      '&:hover': { bgcolor: '#2D1F12' },
                      fontWeight: 700,
                      py: 1.2,
                    }}
                  >
                    {serviceClosed
                      ? 'Şu an sipariş alınmıyor'
                      : `Sepete Ekle — ${formatCurrency(Number(detailItem.price))}`}
                  </Button>
                ) : (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ width: '100%' }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{ bgcolor: '#3E2C1C', borderRadius: 999, color: '#FFF', opacity: serviceClosed ? 0.5 : 1 }}
                    >
                      <IconButton size="medium" onClick={() => decrement(detailItem.id)} sx={{ color: '#FFF' }}>
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
                        {qty}
                      </Typography>
                      <IconButton
                        size="medium"
                        onClick={() => addToCart(detailItem)}
                        disabled={serviceClosed}
                        sx={{ color: '#FFF', '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' } }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Stack>
                    <Typography sx={{ fontWeight: 700, color: '#3E2C1C', fontSize: '1.1rem' }}>
                      {formatCurrency(Number(detailItem.price) * qty)}
                    </Typography>
                  </Stack>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default MenuCatalog;

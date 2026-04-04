/**
 * HotelInfoSection Bileşeni
 *
 * Otel bilgileri formu: ad, adres, telefon, email, vergi no, belgeler ve görseller.
 * Veriler backend API'den çekilir ve güncellenir.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

import { hotelApi } from '../../api/services';
import type { ApiHotel, ApiHotelDocument, ApiHotelImage } from '../../api/services';
import { FormField } from '../forms';

const STATUS_CONFIG: Record<string, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Onay Bekleniyor', color: 'warning' },
  approved: { label: 'Onaylandı', color: 'success' },
  rejected: { label: 'Reddedildi', color: 'error' },
};

const HotelInfoSection: React.FC = () => {
  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', taxNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const docInputRef = useRef<HTMLInputElement>(null);
  const [docUploadType, setDocUploadType] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hotelApi.get()
      .then((data) => {
        setHotel(data);
        setForm({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          taxNumber: data.taxNumber || '',
        });
      })
      .catch((err) => console.error('Otel bilgileri yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await hotelApi.update(form);
      setHotel(updated);
      setSaved(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Kayıt başarısız', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* Belge yükleme */
  const handleDocUpload = (type: string) => {
    setDocUploadType(type);
    docInputRef.current?.click();
  };

  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docUploadType) return;
    try {
      const doc = await hotelApi.uploadDocument(file, docUploadType);
      setHotel((prev) => {
        if (!prev) return prev;
        const fieldMap: Record<string, string> = {
          business_license: 'businessLicense',
          tax_certificate: 'taxCertificate',
          tourism_license: 'tourismLicense',
        };
        return { ...prev, [fieldMap[docUploadType]]: doc };
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Belge yüklenemedi', severity: 'error' });
    }
    e.target.value = '';
  };

  const handleDocDelete = async (doc: ApiHotelDocument, field: string) => {
    try {
      await hotelApi.deleteDocument(doc.id);
      setHotel((prev) => prev ? { ...prev, [field]: null } : prev);
    } catch (err: unknown) {
      setSnackbar({ open: true, message: 'Belge silinemedi', severity: 'error' });
    }
  };

  /* Görsel yükleme */
  const handleImageUpload = () => {
    imgInputRef.current?.click();
  };

  const validateImageSize = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 1920 || img.height < 1080) {
          setSnackbar({ open: true, message: `Görsel en az 1920x1080 piksel olmalıdır. Yüklenen: ${img.width}x${img.height}`, severity: 'warning' });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => { resolve(false); };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = await validateImageSize(file);
    if (!valid) { e.target.value = ''; return; }
    try {
      const img = await hotelApi.uploadImage(file);
      setHotel((prev) => prev ? { ...prev, images: [...prev.images, img] } : prev);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'Görsel yüklenemedi', severity: 'error' });
    }
    e.target.value = '';
  };

  const handleImageDelete = async (img: ApiHotelImage) => {
    try {
      await hotelApi.deleteImage(img.id);
      setHotel((prev) => prev ? { ...prev, images: prev.images.filter((i) => i.id !== img.id) } : prev);
    } catch (err: unknown) {
      setSnackbar({ open: true, message: 'Görsel silinemedi', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  const statusConf = STATUS_CONFIG[hotel?.status || 'pending'];

  const renderDocField = (label: string, doc: ApiHotelDocument | null, type: string, field: string) => (
    <Box>
      <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>{label}</Typography>
      {doc ? (
        <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.name}
          </Typography>
          <IconButton size="small" color="error" onClick={() => handleDocDelete(doc, field)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Paper>
      ) : (
        <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => handleDocUpload(type)} fullWidth>
          Yükle
        </Button>
      )}
    </Box>
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>Otel Bilgileri</Typography>
          {statusConf && (
            <Box>
              <Chip label={statusConf.label} color={statusConf.color} size="small" />
              {hotel?.status === 'rejected' && hotel.rejectionReason && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  {hotel.rejectionReason}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField label="Otel Adı" name="name" value={form.name} onChange={handleChange} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField label="Toplam Oda Sayısı" name="roomCount" value={hotel?.roomCount || 0} onChange={() => {}} disabled helperText="Otomatik hesaplanır" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField label="Telefon" name="phone" value={form.phone} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField label="E-posta" name="email" value={form.email} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField label="Vergi Numarası" name="taxNumber" value={form.taxNumber} onChange={handleChange} />
          </Grid>
          <Grid size={12}>
            <FormField label="Adres" name="address" value={form.address} onChange={handleChange} multiline rows={3} />
          </Grid>

          {/* Belgeler */}
          <Grid size={{ xs: 12, md: 4 }}>
            {renderDocField('İşletme Belgesi', hotel?.businessLicense || null, 'business_license', 'businessLicense')}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderDocField('Vergi Levhası', hotel?.taxCertificate || null, 'tax_certificate', 'taxCertificate')}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {renderDocField('Turizm İşletme Belgesi', hotel?.tourismLicense || null, 'tourism_license', 'tourismLicense')}
          </Grid>

          {/* Görseller */}
          <Grid size={12}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              <ImageIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Otel Görselleri
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Minimum 1920x1080 piksel (16:9 oran). Online kanal için kullanılacaktır.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {(hotel?.images || []).map((img) => (
                <Paper key={img.id} variant="outlined" sx={{ position: 'relative', width: 120, height: 90, overflow: 'hidden', borderRadius: 1 }}>
                  <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    onClick={() => handleImageDelete(img)}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Paper>
              ))}
              <Button variant="outlined" sx={{ width: 120, height: 90, borderStyle: 'dashed' }} onClick={handleImageUpload}>
                <UploadIcon />
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Gizli file input'lar */}
        <input ref={docInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocFileSelect} />
        <input ref={imgInputRef} type="file" hidden accept="image/*" onChange={handleImageFileSelect} />

        {/* Kaydet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
            Kaydet
          </Button>
          {saved && <Alert severity="success" sx={{ py: 0 }}>Bilgiler kaydedildi</Alert>}
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default HotelInfoSection;

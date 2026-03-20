/**
 * ChannelRoomTypeDialog Bileşeni
 *
 * Online kanal için oda tipi ekleme/düzenleme dialog'u.
 * Oda tipi seçimi, oda sayısı, kontenjan, özellikler, fiyat ve görseller.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

import {
  ChannelRoomConfig,
  ChannelRoomType,
  ChannelRoomImage,
  CHANNEL_ROOM_TYPE_LABELS,
  ROOM_FEATURES,
  CHANNEL_EXTRA_FEATURES,
} from '../../utils/constants';
import { FormField } from '../forms';
import ImageUpload from '../forms/ImageUpload';

interface FormData {
  roomType: ChannelRoomType | '';
  totalRooms: string;
  openQuota: string;
  pricePerNight: string;
  validUntil: string;
  description: string;
  features: string[];
  images: ChannelRoomImage[];
}

const INITIAL_FORM: FormData = {
  roomType: '',
  totalRooms: '',
  openQuota: '',
  pricePerNight: '',
  validUntil: '',
  description: '',
  features: [],
  images: [],
};

interface ChannelRoomTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<ChannelRoomConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: ChannelRoomConfig;
}

const ALL_FEATURES = [...ROOM_FEATURES, ...CHANNEL_EXTRA_FEATURES];

const ChannelRoomTypeDialog: React.FC<ChannelRoomTypeDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open && initialData) {
      setForm({
        roomType: initialData.roomType,
        totalRooms: String(initialData.totalRooms),
        openQuota: String(initialData.openQuota),
        pricePerNight: String(initialData.pricePerNight),
        validUntil: initialData.validUntil || '',
        description: initialData.description,
        features: [...initialData.features],
        images: [...initialData.images],
      });
    } else if (open) {
      setForm({ ...INITIAL_FORM, features: [], images: [] });
    }
    setErrors({});
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleFeature = (value: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(value)
        ? prev.features.filter((f) => f !== value)
        : [...prev.features, value],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.roomType) newErrors.roomType = 'Oda tipi seçin';
    if (!form.totalRooms || Number(form.totalRooms) <= 0) newErrors.totalRooms = 'Geçerli bir sayı girin';
    if (!form.openQuota || Number(form.openQuota) <= 0) newErrors.openQuota = 'Geçerli bir sayı girin';
    if (Number(form.openQuota) > Number(form.totalRooms)) newErrors.openQuota = 'Kontenjan toplam odadan fazla olamaz';
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) newErrors.pricePerNight = 'Geçerli bir fiyat girin';
    if (!form.validUntil) newErrors.validUntil = 'Geçerlilik tarihi zorunlu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      roomType: form.roomType as ChannelRoomType,
      totalRooms: Number(form.totalRooms),
      openQuota: Number(form.openQuota),
      pricePerNight: Number(form.pricePerNight),
      validUntil: form.validUntil,
      reservationsOpen: true,
      description: form.description,
      features: form.features,
      images: form.images,
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HotelIcon color="primary" />
          <Typography variant="h6" component="span">
            {isEdit ? 'Oda Tipini Düzenle' : 'Oda Tipi Ekle'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2.5}>
          {/* Oda Tipi */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Oda Tipi"
              name="roomType"
              value={form.roomType}
              onChange={handleChange}
              error={errors.roomType}
              select
              required
            >
              {Object.entries(CHANNEL_ROOM_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </FormField>
          </Grid>

          {/* Gecelik Fiyat */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Gecelik Fiyat (₺)"
              name="pricePerNight"
              value={form.pricePerNight}
              onChange={handleChange}
              error={errors.pricePerNight}
              type="number"
              required
              placeholder="Örn: 3000"
            />
          </Grid>

          {/* Toplam Oda */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Bu tipten kaç odanız var?"
              name="totalRooms"
              value={form.totalRooms}
              onChange={handleChange}
              error={errors.totalRooms}
              type="number"
              required
              placeholder="Örn: 20"
            />
          </Grid>

          {/* Kontenjan */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Kaç kontenjan açmak istersiniz?"
              name="openQuota"
              value={form.openQuota}
              onChange={handleChange}
              error={errors.openQuota}
              type="number"
              required
              placeholder="Örn: 5"
              helperText={form.totalRooms ? `Maksimum: ${form.totalRooms}` : undefined}
            />
          </Grid>

          {/* Geçerlilik Tarihi */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Bu fiyat ve kontenjan ne zamana kadar geçerli?"
              name="validUntil"
              value={form.validUntil}
              onChange={handleChange}
              error={errors.validUntil}
              type="date"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }} />

          {/* Açıklama */}
          <Grid size={12}>
            <FormField
              label="Açıklama"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Bu oda tipi hakkında kısa açıklama..."
            />
          </Grid>

          {/* Özellikler */}
          <Grid size={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Oda Özellikleri
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
              {ALL_FEATURES.map((feature) => (
                <FormControlLabel
                  key={feature.value}
                  control={
                    <Checkbox
                      checked={form.features.includes(feature.value)}
                      onChange={() => toggleFeature(feature.value)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{feature.label}</Typography>}
                  sx={{ width: { xs: '50%', sm: '33%', md: '25%' }, m: 0 }}
                />
              ))}
            </Box>
          </Grid>

          {/* Görseller */}
          <Grid size={12}>
            <ImageUpload
              images={form.images}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
              maxImages={5}
              label="Oda Tipi Görselleri"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Güncelle' : 'Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChannelRoomTypeDialog;

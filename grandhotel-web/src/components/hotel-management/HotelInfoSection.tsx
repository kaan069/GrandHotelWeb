/**
 * HotelInfoSection Bileşeni
 *
 * Otel bilgileri formu: ad, adres, oda sayısı, belgeler ve görseller.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, Grid, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

import { HotelInfo, HotelImage, HotelDocument } from '../../utils/constants';
import { loadHotelInfo, saveHotelInfo } from '../../utils/hotelStorage';
import { FormField } from '../forms';
import ImageUpload from '../forms/ImageUpload';
import DocumentUpload from '../forms/DocumentUpload';

/** localStorage'dan oda sayısını yükle */
const ROOMS_STORAGE_KEY = 'grandhotel_rooms';
const getRoomCount = (): number => {
  try {
    const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (saved) return JSON.parse(saved).length;
  } catch { /* boş */ }
  return 0;
};

const HotelInfoSection: React.FC = () => {
  const [info, setInfo] = useState<HotelInfo>(loadHotelInfo);
  const [saved, setSaved] = useState(false);

  const roomCount = useMemo(() => getRoomCount(), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleDocumentChange = (field: 'businessLicense' | 'taxCertificate' | 'tourismLicense') =>
    (doc: HotelDocument | undefined) => {
      setInfo((prev) => ({ ...prev, [field]: doc }));
      setSaved(false);
    };

  const handleImagesChange = (images: { id: number; name: string; data: string }[]) => {
    const hotelImages: HotelImage[] = images.map((img) => ({
      ...img,
      uploadedAt: (img as HotelImage).uploadedAt || new Date().toISOString(),
    }));
    setInfo((prev) => ({ ...prev, images: hotelImages }));
    setSaved(false);
  };

  const handleSave = () => {
    saveHotelInfo({ ...info, updatedAt: new Date().toISOString() });
    setSaved(true);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Otel Bilgileri
        </Typography>

        <Grid container spacing={2.5}>
          {/* Otel Adı */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Otel Adı"
              name="name"
              value={info.name}
              onChange={handleChange}
              placeholder="Örn: Grand Hotel"
              required
            />
          </Grid>

          {/* Oda Sayısı */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              label="Toplam Oda Sayısı"
              name="roomCount"
              value={roomCount}
              onChange={() => {}}
              disabled
              helperText="Oda yönetiminden otomatik hesaplanır"
            />
          </Grid>

          {/* Adres */}
          <Grid size={12}>
            <FormField
              label="Adres"
              name="address"
              value={info.address}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Otel adresi..."
            />
          </Grid>

          {/* Belgeler */}
          <Grid size={{ xs: 12, md: 4 }}>
            <DocumentUpload
              label="İşletme Belgesi"
              document={info.businessLicense}
              onChange={handleDocumentChange('businessLicense')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DocumentUpload
              label="Vergi Levhası"
              document={info.taxCertificate}
              onChange={handleDocumentChange('taxCertificate')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DocumentUpload
              label="Turizm İşletme Belgesi"
              document={info.tourismLicense}
              onChange={handleDocumentChange('tourismLicense')}
            />
          </Grid>

          {/* Görseller */}
          <Grid size={12}>
            <ImageUpload
              images={info.images}
              onChange={handleImagesChange}
              maxImages={10}
              label="Otel Görselleri"
            />
          </Grid>
        </Grid>

        {/* Kaydet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Kaydet
          </Button>

          {saved && (
            <Alert severity="success" sx={{ py: 0 }}>
              Bilgiler kaydedildi
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HotelInfoSection;

/**
 * RoomAddDialog Bileşeni
 *
 * Yeni oda eklemek için popup (dialog) formu.
 * Oda numarası, yatak düzeni, kat, kapasite, manzara ve fiyat bilgileri alınır.
 * Yatak düzeni özelleştirilebilir: birden fazla yatak eklenebilir.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  KingBed as KingBedIcon,
  SingleBed as SingleBedIcon,
} from '@mui/icons-material';

import { FormField } from '../forms';
import { BED_TYPE_LABELS, VIEW_TYPE_LABELS } from '../../utils/constants';

interface RoomFormData {
  roomNumber: string;
  bedType: string;
  floor: string;
  capacity: string;
  view: string;
  price: string;
}

export interface RoomSaveData {
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: number;
  status: string;
  beds: { type: string }[];
}

interface RoomAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: RoomSaveData) => void;
}

/** Yatak ekleme seçenekleri */
const BED_OPTIONS = [
  { value: 'single', label: 'Tek Kişilik' },
  { value: 'double', label: 'Çift Kişilik' },
  { value: 'king', label: 'King Size' },
];

/** Form alanlarının başlangıç değerleri */
const INITIAL_FORM: RoomFormData = {
  roomNumber: '',
  bedType: 'double',
  floor: '',
  capacity: '',
  view: 'none',
  price: '',
};

const RoomAddDialog: React.FC<RoomAddDialogProps> = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState<RoomFormData>({ ...INITIAL_FORM });
  const [beds, setBeds] = useState<{ type: string }[]>([{ type: 'double' }]);
  const [newBedType, setNewBedType] = useState('single');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Form alanı değişikliğini işle */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Yatak ekle */
  const handleAddBed = () => {
    setBeds((prev) => [...prev, { type: newBedType }]);
  };

  /** Yatak sil */
  const handleRemoveBed = (index: number) => {
    setBeds((prev) => prev.filter((_, i) => i !== index));
  };

  /** Yatak listesinden bedType belirle (ilk büyük yatak veya ilk yatak) */
  const deriveBedType = (bedList: { type: string }[]): string => {
    if (bedList.length === 0) return 'single';
    const large = bedList.find((b) => b.type === 'king' || b.type === 'double');
    if (large) return large.type;
    if (bedList.length === 2) return 'twin';
    return bedList[0].type;
  };

  /** Form doğrulaması */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Oda numarası zorunlu';
    }
    if (!formData.floor) {
      newErrors.floor = 'Kat bilgisi zorunlu';
    }
    if (!formData.capacity) {
      newErrors.capacity = 'Kapasite zorunlu';
    }
    if (!formData.price) {
      newErrors.price = 'Gecelik fiyat zorunlu';
    }
    if (beds.length === 0) {
      newErrors.beds = 'En az 1 yatak eklemelisiniz';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Formu gönder */
  const handleSubmit = () => {
    if (!validate()) return;

    if (onSave) {
      onSave({
        roomNumber: formData.roomNumber,
        bedType: deriveBedType(beds),
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        view: formData.view,
        price: Number(formData.price),
        status: 'available',
        beds,
      });
    }

    setFormData({ ...INITIAL_FORM });
    setBeds([{ type: 'double' }]);
    setErrors({});
    onClose();
  };

  /** Dialog kapatıldığında formu sıfırla */
  const handleClose = () => {
    setFormData({ ...INITIAL_FORM });
    setBeds([{ type: 'double' }]);
    setErrors({});
    onClose();
  };

  /** Yatak ikonu */
  const getBedIcon = (type: string) => {
    if (type === 'king' || type === 'double') return <KingBedIcon sx={{ fontSize: 16 }} />;
    return <SingleBedIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* Başlık */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Yeni Oda Ekle
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Form alanları */}
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Oda Numarası */}
          <FormField
            label="Oda Numarası"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            error={errors.roomNumber}
            placeholder="Örn: 101"
            required
          />

          {/* Yatak Düzeni */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Yatak Düzeni *
            </Typography>

            {/* Mevcut yataklar */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {beds.map((bed, index) => (
                <Chip
                  key={index}
                  icon={getBedIcon(bed.type)}
                  label={BED_TYPE_LABELS[bed.type] || bed.type}
                  onDelete={() => handleRemoveBed(index)}
                  variant="outlined"
                  color="primary"
                />
              ))}
              {beds.length === 0 && (
                <Typography variant="body2" color="error" sx={{ fontSize: '0.75rem' }}>
                  {errors.beds || 'En az 1 yatak ekleyin'}
                </Typography>
              )}
            </Box>

            {/* Yatak ekleme */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Yatak Tipi</InputLabel>
                <Select
                  value={newBedType}
                  label="Yatak Tipi"
                  onChange={(e) => setNewBedType(e.target.value)}
                >
                  {BED_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddBed}
              >
                Yatak Ekle
              </Button>
            </Box>
          </Box>

          {/* Kat ve Kapasite yan yana */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="Kat"
              name="floor"
              type="number"
              value={formData.floor}
              onChange={handleChange}
              error={errors.floor}
              placeholder="Örn: 1"
              required
              sx={{ flex: 1 }}
            />
            <FormField
              label="Kapasite (Kişi)"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              error={errors.capacity}
              placeholder="Örn: 2"
              required
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Manzara */}
          <FormField
            label="Manzara"
            name="view"
            value={formData.view}
            onChange={handleChange}
            select
          >
            {Object.entries(VIEW_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </FormField>

          {/* Gecelik Fiyat */}
          <FormField
            label="Gecelik Fiyat (₺)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            placeholder="Örn: 1500"
            required
          />
        </Box>
      </DialogContent>

      {/* Butonlar */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          İptal
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomAddDialog;

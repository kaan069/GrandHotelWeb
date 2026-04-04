/**
 * Oda Düzenleme Sayfası
 *
 * URL: /rooms/:id
 * Backend'den oda verisini çeker, düzenleme formu gösterir.
 * Yatak düzeni, fiyat, manzara, kapasite gibi alanlar düzenlenebilir.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  MenuItem,
  Chip,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  KingBed as KingBedIcon,
  SingleBed as SingleBedIcon,
} from '@mui/icons-material';

import { PageHeader, StatusBadge } from '../../components/common';
import { FormField } from '../../components/forms';
import { roomsApi } from '../../api/services';
import type { ApiRoom } from '../../api/services';
import { BED_TYPE_LABELS, VIEW_TYPE_LABELS, ROOM_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

/** Yatak ekleme seçenekleri */
const BED_OPTIONS = [
  { value: 'single', label: 'Tek Kişilik' },
  { value: 'double', label: 'Çift Kişilik' },
  { value: 'king', label: 'King Size' },
];

const RoomEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* Form state */
  const [bedType, setBedType] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [view, setView] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [beds, setBeds] = useState<{ type: string }[]>([]);
  const [newBedType, setNewBedType] = useState('single');

  /* Oda verisini çek */
  useEffect(() => {
    if (!id) return;
    roomsApi.getById(Number(id))
      .then((data) => {
        setRoom(data);
        setBedType(data.bedType);
        setFloor(String(data.floor));
        setCapacity(String(data.capacity));
        setView(data.view);
        setPrice(data.price);
        setStatus(data.status);
        setBeds(data.beds && data.beds.length > 0 ? data.beds : []);
      })
      .catch(() => setError('Oda bulunamadı'))
      .finally(() => setLoading(false));
  }, [id]);

  /** Yatak ekle */
  const handleAddBed = () => {
    setBeds((prev) => [...prev, { type: newBedType }]);
  };

  /** Yatak sil */
  const handleRemoveBed = (index: number) => {
    setBeds((prev) => prev.filter((_, i) => i !== index));
  };

  /** Yatak listesinden bedType belirle */
  const deriveBedType = (bedList: { type: string }[]): string => {
    if (bedList.length === 0) return bedType;
    const large = bedList.find((b) => b.type === 'king' || b.type === 'double');
    if (large) return large.type;
    if (bedList.length === 2) return 'twin';
    return bedList[0].type;
  };

  /** Kaydet */
  const handleSave = async () => {
    if (!room) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updatedBedType = beds.length > 0 ? deriveBedType(beds) : bedType;
      await roomsApi.update(room.id, {
        bedType: updatedBedType,
        floor: Number(floor),
        capacity: Number(capacity),
        view,
        price: Number(price),
        status,
        beds,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || 'Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  /** Yatak ikonu */
  const getBedIcon = (type: string) => {
    if (type === 'king' || type === 'double') return <KingBedIcon sx={{ fontSize: 16 }} />;
    return <SingleBedIcon sx={{ fontSize: 16 }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Oda yükleniyor...</Typography>
      </Box>
    );
  }

  if (error && !room) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button onClick={() => navigate('/rooms')} startIcon={<ArrowBackIcon />}>
          Oda Listesine Dön
        </Button>
      </Box>
    );
  }

  if (!room) return null;

  return (
    <div>
      <PageHeader
        title={`Oda ${room.roomNumber}`}
        subtitle={`${BED_TYPE_LABELS[room.bedType] || room.bedType} — Kat ${room.floor}`}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/rooms')}
            >
              Geri
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Box>
        }
      />

      {success && <Alert severity="success" sx={{ mb: 2 }}>Oda başarıyla güncellendi.</Alert>}
      {error && room && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Sol: Form */}
        <Box sx={{ flex: 2, minWidth: 320 }}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>Oda Bilgileri</Typography>

              {/* Oda Numarası (salt okunur) */}
              <FormField
                name="roomNumber"
                label="Oda Numarası"
                value={room.roomNumber}
                onChange={() => {}}
                disabled
              />

              {/* Durum */}
              <FormField
                name="status"
                label="Durum"
                value={status}
                onChange={(e) => setStatus((e.target as HTMLInputElement).value)}
                select
              >
                {Object.entries(ROOM_STATUS_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </FormField>

              {/* Kat ve Kapasite */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormField
                  name="floor"
                  label="Kat"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor((e.target as HTMLInputElement).value)}
                  sx={{ flex: 1 }}
                />
                <FormField
                  name="capacity"
                  label="Kapasite (Kişi)"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity((e.target as HTMLInputElement).value)}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Manzara */}
              <FormField
                name="view"
                label="Manzara"
                value={view}
                onChange={(e) => setView((e.target as HTMLInputElement).value)}
                select
              >
                {Object.entries(VIEW_TYPE_LABELS).map(([val, label]) => (
                  <MenuItem key={val} value={val}>{label}</MenuItem>
                ))}
              </FormField>

              {/* Fiyat */}
              <FormField
                name="price"
                label="Gecelik Fiyat (₺)"
                type="number"
                value={price}
                onChange={(e) => setPrice((e.target as HTMLInputElement).value)}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Sağ: Yatak Düzeni */}
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                <KingBedIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'text-bottom' }} />
                Yatak Düzeni
              </Typography>

              {/* Mevcut yataklar */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Yatak eklenmemiş — varsayılan olarak {BED_TYPE_LABELS[bedType] || bedType} kullanılır.
                  </Typography>
                )}
              </Box>

              {/* Yatak ekleme */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Yatak Tipi</InputLabel>
                  <Select
                    value={newBedType}
                    label="Yatak Tipi"
                    onChange={(e) => setNewBedType(e.target.value)}
                  >
                    {BED_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddBed}
                >
                  Ekle
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Özet bilgi */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Özet</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Durum: <StatusBadge status={status} type="room" />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fiyat: <strong>{formatCurrency(parseFloat(price) || 0)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kapasite: <strong>{capacity} kişi</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yatak: <strong>{beds.length > 0 ? beds.map((b) => BED_TYPE_LABELS[b.type] || b.type).join(', ') : BED_TYPE_LABELS[bedType] || bedType}</strong>
                </Typography>
              </Box>

              {/* Misafir bilgisi (varsa) */}
              {room.guestName && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Mevcut Misafir</Typography>
                  <Typography variant="body2">{room.guestName}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </div>
  );
};

export default RoomEdit;

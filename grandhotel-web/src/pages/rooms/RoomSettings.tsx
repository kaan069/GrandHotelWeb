/**
 * Oda Tipi Ayarları Sayfası
 *
 * Odaları ekleme, listeleme ve silme sayfası.
 * "Yeni Oda Ekle" butonu ile popup üzerinden yeni oda kaydedilir.
 * Veriler backend API'den çekilir ve yönetilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { PageHeader, StatusBadge } from '../../components/common';
import RoomAddDialog from '../../components/rooms/RoomAddDialog';
import { formatCurrency } from '../../utils/formatters';
import {
  BED_TYPE_LABELS,
  VIEW_TYPE_LABELS,
} from '../../utils/constants';
import { roomsApi } from '../../api/services';
import type { ApiRoom } from '../../api/services';

interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: number;
  status: string;
}

/** ApiRoom → local Room dönüşümü */
const mapApiRoom = (r: ApiRoom): Room => ({
  id: r.id,
  roomNumber: r.roomNumber,
  bedType: r.bedType,
  floor: r.floor,
  capacity: r.capacity,
  view: r.view,
  price: parseFloat(r.price) || 0,
  status: r.status,
});

const RoomSettings: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  /** API'den odaları çek */
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomsApi.getAll();
      setRooms(data.map(mapApiRoom));
    } catch (err) {
      console.error('Odalar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  /** Yeni oda ekle (API'ye kaydet) */
  const handleAddRoom = async (newRoom: { roomNumber: string; bedType: string; floor: number; capacity: number; view: string; price: number; beds?: { type: string }[] }) => {
    try {
      await roomsApi.create({
        roomNumber: newRoom.roomNumber,
        bedType: newRoom.bedType,
        floor: newRoom.floor,
        capacity: newRoom.capacity,
        view: newRoom.view,
        price: newRoom.price,
        beds: newRoom.beds,
      });
      fetchRooms();
    } catch (err: any) {
      console.error('Oda eklenirken hata:', err);
      alert(err?.response?.data?.roomNumber?.[0] || err?.response?.data?.error || 'Oda eklenemedi');
    }
  };

  /** Oda sil (API'den sil) */
  const handleDeleteRoom = async (roomId: number) => {
    try {
      await roomsApi.delete(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      console.error('Oda silinirken hata:', err);
      alert('Oda silinemedi. Aktif rezervasyonu olan odalar silinemez.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Odalar yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Oda Tipi Ayarları"
        subtitle={`Toplam ${rooms.length} oda`}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Yeni Oda Ekle
          </Button>
        }
      />

      {/* Oda listesi tablosu */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Oda No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Yatak Tipi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kapasite</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Manzara</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fiyat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>
                      <Chip label={room.roomNumber} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{(BED_TYPE_LABELS as Record<string, string>)[room.bedType] || room.bedType}</TableCell>
                    <TableCell>{room.floor}. Kat</TableCell>
                    <TableCell>{room.capacity} kişi</TableCell>
                    <TableCell>{VIEW_TYPE_LABELS[room.view] || '-'}</TableCell>
                    <TableCell>{formatCurrency(room.price)}</TableCell>
                    <TableCell>
                      <StatusBadge type="room" status={room.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDeleteRoom(room.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {rooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Henüz oda eklenmemiş. "Yeni Oda Ekle" butonu ile başlayın.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Oda ekleme dialog'u */}
      <RoomAddDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleAddRoom}
      />
    </div>
  );
};

export default RoomSettings;

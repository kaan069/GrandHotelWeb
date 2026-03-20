/**
 * Gün Sonu (Night Audit) Dialog'u
 *
 * Resepsiyoncu her gün sonunda bu dialog'u açarak dolu odaların
 * gecelik ücretlerini folio'ya yansıtır. Aynı gün tekrar çalıştırılamaz.
 *
 * Üç aşamalı akış:
 *   1. Önizleme: Dolu odalar ve toplam tutar gösterilir
 *   2. Onay: Kullanıcı işlemi onaylar
 *   3. Sonuç: İşlem özeti gösterilir
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  NightsStay as NightsStayIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { ROOM_STATUS, NightAuditDetail, RoomGuest } from '../../utils/constants';
import { foliosApi, roomsApi } from '../../api/services';
import { getNightAuditByDate, createNightAudit } from '../../utils/nightAuditStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';

/** Oda verisi */
interface Room {
  id: number;
  roomNumber: string;
  price: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  reservationId?: number;
}

interface NightAuditDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'preview' | 'confirm' | 'result';

/** Sonuç verisi */
interface AuditResult {
  roomsCharged: number;
  totalAmount: number;
  processedAt: string;
}

const NightAuditDialog: React.FC<NightAuditDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('preview');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [occupiedRooms, setOccupiedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const alreadyProcessed = open ? getNightAuditByDate(today) !== null : false;

  /** Dolu odaları API'den yükle */
  React.useEffect(() => {
    if (!open) {
      setOccupiedRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const allRooms = await roomsApi.getAll();
        const occupied = allRooms
          .filter((r) => r.status === ROOM_STATUS.OCCUPIED)
          .map((r) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            price: Number(r.price),
            status: r.status,
            guestName: r.guestName || undefined,
            guests: r.guests?.map((g) => ({
              guestId: g.guestId,
              guestName: g.guestName,
              phone: g.phone,
            })),
            reservationId: r.reservationId ?? undefined,
          }));
        setOccupiedRooms(occupied);
      } catch (err) {
        console.error('Odalar yüklenirken hata:', err);
        setOccupiedRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [open]);

  /** Toplam tutar */
  const totalAmount = occupiedRooms.reduce((sum, r) => sum + (r.price || 0), 0);

  /** Misafir adını çıkar */
  const getGuestName = (room: Room): string => {
    if (room.guests && room.guests.length > 0) {
      return room.guests.map((g) => g.guestName).join(', ');
    }
    return room.guestName || '-';
  };

  /** Gün sonu işlemini çalıştır */
  const handleExecute = async () => {
    const processedAt = new Date().toISOString();
    const processedBy = user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen';

    try {
      const details: NightAuditDetail[] = [];

      for (const room of occupiedRooms) {
        if (!room.reservationId) {
          console.warn(`Oda ${room.roomNumber} için reservationId bulunamadı, atlanıyor.`);
          continue;
        }
        // Her dolu odaya oda ücreti folio kaydı ekle
        await foliosApi.create({
          reservationId: room.reservationId,
          guestId: room.guests?.[0]?.guestId,
          category: 'room_charge',
          description: `Oda ücreti - ${formatDate(today)}`,
          amount: room.price,
          date: today,
          createdBy: 'Gün Sonu',
        });

        details.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          guestName: getGuestName(room),
          amount: room.price,
        });
      }

      // Gün sonu logunu kaydet
      createNightAudit({
        date: today,
        roomsCharged: details.length,
        totalAmount,
        processedBy,
        processedAt,
        details,
      });

      setResult({
        roomsCharged: details.length,
        totalAmount,
        processedAt,
      });
      setStep('result');
    } catch (err) {
      console.error('Gün sonu işlemi sırasında hata:', err);
    }
  };

  /** Dialog kapandığında state'i sıfırla */
  const handleClose = () => {
    setStep('preview');
    setResult(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={step === 'result' ? handleClose : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NightsStayIcon color="warning" />
          <Typography variant="h6" component="span">
            Gün Sonu İşlemleri
          </Typography>
          <Chip label={formatDate(today)} size="small" variant="outlined" sx={{ ml: 'auto' }} />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* === Adım 1: Önizleme === */}
        {step === 'preview' && (
          <>
            {alreadyProcessed && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                Bugün için gün sonu işlemi zaten yapılmış. Tekrar çalıştırılamaz.
              </Alert>
            )}

            {occupiedRooms.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Şu anda dolu oda bulunmuyor. Gün sonu işlemi yapılacak oda yok.
              </Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Aşağıdaki dolu odalara gecelik oda ücreti yansıtılacaktır:
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Oda No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Misafir</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Gecelik Ücret</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {occupiedRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell>
                            <Chip label={room.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{getGuestName(room)}</TableCell>
                          <TableCell align="right">{formatCurrency(room.price)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Toplam satırı */}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                          TOPLAM ({occupiedRooms.length} oda)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(totalAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}

        {/* === Adım 2: Onay === */}
        {step === 'confirm' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Gün Sonu İşlemi Onayı
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{occupiedRooms.length}</strong> odaya toplam{' '}
              <strong>{formatCurrency(totalAmount)}</strong> oda ücreti yansıtılacak.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </Typography>
          </Box>
        )}

        {/* === Adım 3: Sonuç === */}
        {step === 'result' && result && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
              Gün Sonu Başarıyla Tamamlandı
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              <Typography variant="body1">
                <strong>{result.roomsCharged}</strong> odaya oda ücreti yansıtıldı
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {formatCurrency(result.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                İşlemi yapan: {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(result.processedAt, 'DD.MM.YYYY HH:mm')}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'preview' && (
          <>
            <Button onClick={onClose} color="inherit">İptal</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setStep('confirm')}
              disabled={alreadyProcessed || occupiedRooms.length === 0}
            >
              Gün Sonu Çalıştır
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Button onClick={() => setStep('preview')} color="inherit">Geri</Button>
            <Button variant="contained" color="warning" onClick={handleExecute}>
              Onayla ve Çalıştır
            </Button>
          </>
        )}

        {step === 'result' && (
          <Button variant="contained" onClick={handleClose}>
            Kapat
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NightAuditDialog;

/**
 * Gün Sonu (Night Audit) Dialog'u
 *
 * Resepsiyoncu her gün sonunda bu dialog'u açarak:
 * 1. Bugün gelmeyen (no-show) rezervasyonları görür ve iptal edebilir
 * 2. Konaklayan odalara gecelik ücret yansıtır
 * 3. İşlem rapor olarak backend'e kaydedilir
 * 4. Otomatik gün sonu saati ayarlanabilir
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
  CircularProgress,
  Divider,
  TextField,
  Collapse,
} from '@mui/material';
import {
  NightsStay as NightsStayIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  Hotel as HotelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import { kazancApi } from '../../api/services';
import type {
  NightAuditPreviewResponse,
  NightAuditNoShowRoom,
} from '../../api/services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';

interface NightAuditDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'preview' | 'confirm' | 'result';

interface AuditResult {
  processedRooms: number;
  totalCharged: number;
  noShowCount: number;
  noShowCancelled: number;
}

const NightAuditDialog: React.FC<NightAuditDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('preview');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [preview, setPreview] = useState<NightAuditPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  /* No-show iptal durumu */
  const [noShowStatus, setNoShowStatus] = useState<Record<number, string>>({});

  /* Otomatik gün sonu */
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  /** Backend'den önizleme + zamanlama verisi yükle */
  React.useEffect(() => {
    if (!open) {
      setPreview(null);
      setNoShowStatus({});
      setShowSchedule(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [previewData, scheduleData] = await Promise.all([
          kazancApi.nightAuditPreview(),
          kazancApi.getNightAuditSchedule(),
        ]);
        setPreview(previewData);
        setScheduleTime(scheduleData.nightAuditTime || '');
        setScheduleEnabled(scheduleData.enabled);
      } catch (err) {
        console.error('Gün sonu veri hatası:', err);
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open]);

  /** No-show rezervasyon iptal et */
  const handleCancelNoShow = async (room: NightAuditNoShowRoom) => {
    setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'cancelling' }));
    try {
      await kazancApi.cancelNoShow(room.reservationId);
      setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'cancelled' }));
    } catch (err) {
      console.error('No-show iptal hatası:', err);
      setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'error' }));
    }
  };

  /** Tüm no-show rezervasyonları toplu iptal */
  const handleCancelAllNoShows = async () => {
    const pending = noShowRooms.filter((r) => noShowStatus[r.reservationId] !== 'cancelled');
    if (pending.length === 0) return;
    if (!window.confirm(`${pending.length} rezervasyonu iptal etmek istediğinize emin misiniz?`)) return;
    for (const room of pending) {
      setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'cancelling' }));
      try {
        await kazancApi.cancelNoShow(room.reservationId);
        setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'cancelled' }));
      } catch {
        setNoShowStatus((prev) => ({ ...prev, [room.reservationId]: 'error' }));
      }
    }
  };

  /** Otomatik saati kaydet */
  const handleScheduleSave = async () => {
    setScheduleSaving(true);
    try {
      const data = await kazancApi.setNightAuditSchedule(scheduleTime || null);
      setScheduleTime(data.nightAuditTime || '');
      setScheduleEnabled(data.enabled);
    } catch (err) {
      console.error('Zamanlama kayıt hatası:', err);
    } finally {
      setScheduleSaving(false);
    }
  };

  /** Otomatik kapatma */
  const handleScheduleDisable = async () => {
    setScheduleSaving(true);
    try {
      const data = await kazancApi.setNightAuditSchedule(null);
      setScheduleTime('');
      setScheduleEnabled(data.enabled);
    } catch (err) {
      console.error('Zamanlama kapatma hatası:', err);
    } finally {
      setScheduleSaving(false);
    }
  };

  /** Gün sonu işlemini çalıştır */
  const handleExecute = async () => {
    setExecuting(true);
    try {
      const processedBy = user ? `${user.firstName} ${user.lastName}` : '';
      const data = await kazancApi.nightAuditExecute(processedBy);

      setResult({
        processedRooms: data.processedRooms,
        totalCharged: data.totalCharged,
        noShowCount: data.noShowCount,
        noShowCancelled: data.noShowCancelled,
      });
      setStep('result');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Gün sonu işlemi sırasında hata oluştu';
      alert(msg);
    } finally {
      setExecuting(false);
    }
  };

  /** Dialog kapandığında state sıfırla */
  const handleClose = () => {
    setStep('preview');
    setResult(null);
    setNoShowStatus({});
    setShowSchedule(false);
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];
  const alreadyProcessed = preview?.alreadyProcessed ?? false;
  const occupiedRooms = preview?.occupiedRooms ?? [];
  const noShowRooms = preview?.noShowRooms ?? [];
  const totalAmount = preview?.totalCharge ?? 0;
  const cancelledCount = Object.values(noShowStatus).filter((s) => s === 'cancelled').length;

  return (
    <Dialog
      open={open}
      onClose={step === 'result' ? handleClose : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NightsStayIcon color="warning" />
          <Typography variant="h6" component="span">
            Gün Sonu İşlemleri
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
            {scheduleEnabled && (
              <Chip
                icon={<ScheduleIcon />}
                label={`Otomatik: ${scheduleTime}`}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            <Chip label={formatDate(today)} size="small" variant="outlined" />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* === Yükleniyor === */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }} color="text.secondary">Veriler yükleniyor...</Typography>
          </Box>
        )}

        {/* === Adım 1: Önizleme === */}
        {!loading && step === 'preview' && preview && (
          <>
            {alreadyProcessed && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                Bugün için gün sonu işlemi zaten yapılmış. Tekrar çalıştırılamaz.
              </Alert>
            )}

            {/* ── Bölüm 1: No-Show Odalar ── */}
            {noShowRooms.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventBusyIcon color="error" fontSize="small" />
                    Giriş Yapmamış Rezervasyonlar ({noShowRooms.length})
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={handleCancelAllNoShows}
                    disabled={alreadyProcessed || noShowRooms.every((r) => noShowStatus[r.reservationId] === 'cancelled')}
                  >
                    Tümünü İptal Et
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'error.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Oda No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Misafir</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giriş Tarihi</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">İşlem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {noShowRooms.map((room) => {
                        const status = noShowStatus[room.reservationId];
                        return (
                          <TableRow key={room.reservationId}>
                            <TableCell>
                              <Chip label={room.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>{room.guestName || '-'}</TableCell>
                            <TableCell>{room.checkIn ? formatDate(room.checkIn) : '-'}</TableCell>
                            <TableCell align="center">
                              {status === 'cancelled' ? (
                                <Chip icon={<CheckCircleIcon />} label="İptal Edildi" color="success" size="small" />
                              ) : status === 'cancelling' ? (
                                <CircularProgress size={20} />
                              ) : status === 'error' ? (
                                <Chip label="Hata" color="error" size="small" />
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelNoShow(room)}
                                  disabled={alreadyProcessed}
                                >
                                  İptal Et
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {noShowRooms.length > 0 && occupiedRooms.length > 0 && <Divider sx={{ mb: 3 }} />}

            {/* ── Bölüm 2: Oda Ücreti Yazılacak Odalar ── */}
            {occupiedRooms.length === 0 ? (
              !noShowRooms.length && (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Bugün için işlenecek kayıt bulunmuyor.
                </Typography>
              )
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon color="primary" fontSize="small" />
                  Oda Ücreti Yazılacak Odalar ({occupiedRooms.length})
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
                        <TableRow key={room.roomId}>
                          <TableCell>
                            <Chip label={room.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{room.guestName || '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(room.price)}</TableCell>
                        </TableRow>
                      ))}
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

            {/* ── Otomatik Gün Sonu Ayarı ── */}
            <Collapse in={showSchedule}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Otomatik Gün Sonu Ayarı
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    type="time"
                    label="Saat"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleScheduleSave}
                    disabled={scheduleSaving || !scheduleTime}
                  >
                    {scheduleSaving ? <CircularProgress size={18} /> : 'Kaydet'}
                  </Button>
                  {scheduleEnabled && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={handleScheduleDisable}
                      disabled={scheduleSaving}
                    >
                      Devre Dışı Bırak
                    </Button>
                  )}
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setShowSchedule(false)}
                  >
                    Kapat
                  </Button>
                </Box>
                {scheduleEnabled && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Her gece saat {scheduleTime} da gün sonu otomatik çalışacak.
                  </Typography>
                )}
              </Box>
            </Collapse>
          </>
        )}

        {/* === Adım 2: Onay === */}
        {step === 'confirm' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Gün Sonu İşlemi Onayı
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              <strong>{occupiedRooms.length}</strong> odaya toplam{' '}
              <strong>{formatCurrency(totalAmount)}</strong> oda ücreti yansıtılacak.
            </Typography>
            {cancelledCount > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {cancelledCount} no-show rezervasyon iptal edildi.
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Bu işlem geri alınamaz ve rapor olarak kaydedilir. Devam etmek istiyor musunuz?
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
                <strong>{result.processedRooms}</strong> odaya oda ücreti yansıtıldı
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {formatCurrency(result.totalCharged)}
              </Typography>
              {result.noShowCancelled > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {result.noShowCancelled} no-show rezervasyon iptal edildi
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                İşlemi yapan: {user?.firstName} {user?.lastName}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'preview' && (
          <>
            <Button onClick={onClose} color="inherit">Vazgeç</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              startIcon={<ScheduleIcon />}
              onClick={() => setShowSchedule((p) => !p)}
              sx={{ mr: 1 }}
            >
              Otomatik Gün Sonu
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setStep('confirm')}
              disabled={alreadyProcessed || (occupiedRooms.length === 0 && noShowRooms.length === 0) || loading}
            >
              Gün Sonunu Çalıştır
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Button onClick={() => setStep('preview')} color="inherit">Geri</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleExecute}
              disabled={executing}
              startIcon={executing ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {executing ? 'İşleniyor...' : 'Onayla ve Çalıştır'}
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

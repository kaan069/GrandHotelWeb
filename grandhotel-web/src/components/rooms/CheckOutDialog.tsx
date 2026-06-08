/**
 * CheckOutDialog — Check-out onay diyaloğu.
 *
 * Özellikler:
 *  - Hesap özeti (planlanan/kalınan gece, oda ücreti, eksik room_charge, ödeme, bakiye)
 *  - Erken çıkış radyo grubu (planlanan > kalınan ise)
 *  - Şirket bölümü (Reservation.company doluysa: bakiyeyi cariye yansıt)
 *  - Force bölümü (sadece patron/müdür rolünde + balance>0): sebep zorunlu
 *
 * Backend `apps/rooms/views.py` check_out endpoint'iyle entegre.
 */

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ExitToApp as ExitIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { calcFolioTotals, calcNightsCount, type FolioItemLike } from '../../utils/folio';

export type EarlyDepartureMode = 'refund' | 'full' | 'penalty';

export interface CheckOutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (params: {
    force: boolean;
    forceReason: string;
    earlyDepartureMode: EarlyDepartureMode;
    transferToCompany: boolean;
  }) => Promise<void>;
  loading?: boolean;

  // Hesaplama girdileri
  roomNumber: string;
  nightlyRate: number;
  checkInISO: string;
  plannedCheckOutISO: string | null;
  folioItems: FolioItemLike[];

  // Şirket bilgisi
  companyId?: number | null;
  companyName?: string | null;

  // Rol kontrolü
  canForce: boolean;

  // Backend'den gelen hata (örn. refund pending)
  serverError?: { message: string; balance?: number; refundPending?: number } | null;
}

const fmt = (n: number) =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

const CheckOutDialog: React.FC<CheckOutDialogProps> = ({
  open, onClose, onConfirm, loading,
  roomNumber, nightlyRate, checkInISO, plannedCheckOutISO, folioItems,
  companyId, companyName, canForce, serverError,
}) => {
  const [earlyDepartureMode, setEarlyDepartureMode] = useState<EarlyDepartureMode>('refund');
  const [transferToCompany, setTransferToCompany] = useState<boolean>(false);
  const [force, setForce] = useState<boolean>(false);
  const [forceReason, setForceReason] = useState<string>('');

  // Hesaplamalar
  const calc = useMemo(() => {
    const totals = calcFolioTotals(folioItems);
    const actualNights = calcNightsCount(checkInISO);
    const plannedNights = plannedCheckOutISO
      ? calcNightsCount(checkInISO, new Date(plannedCheckOutISO))
      : actualNights;
    const actualUsed = actualNights * nightlyRate;
    const plannedTotal = plannedNights * nightlyRate;
    const existingRoomCharge = folioItems
      .filter((f) => f.category === 'room_charge')
      .reduce((s, f) => s + (typeof f.amount === 'string' ? parseFloat(f.amount) : f.amount), 0);

    let targetCharge = actualUsed;
    if (earlyDepartureMode === 'full' && plannedTotal > actualUsed) {
      targetCharge = plannedTotal;
    } else if (earlyDepartureMode === 'penalty') {
      targetCharge = actualUsed + nightlyRate;
    }
    const missing = Math.max(0, targetCharge - existingRoomCharge);

    // Projected: bu missing eklendikten + (transferToCompany varsa o debit eklendikten) sonra
    const projectedCharges = totals.charges + missing;
    let projectedPayments = totals.payments;
    let willTransferAmount = 0;
    const preTransferBalance = projectedCharges - totals.discounts - projectedPayments;
    if (transferToCompany && companyId && preTransferBalance > 0) {
      willTransferAmount = preTransferBalance;
      projectedPayments += preTransferBalance;
    }
    const projectedBalance = projectedCharges - totals.discounts - projectedPayments;

    return {
      actualNights, plannedNights, actualUsed, plannedTotal,
      existingRoomCharge, targetCharge, missing,
      currentBalance: totals.balance,
      projectedCharges, projectedPayments, projectedBalance, willTransferAmount,
      isEarlyDeparture: plannedNights > actualNights,
    };
  }, [folioItems, checkInISO, plannedCheckOutISO, nightlyRate, earlyDepartureMode, transferToCompany, companyId]);

  const balanceColor = calc.projectedBalance > 0.01 ? 'error.main'
    : calc.projectedBalance < -0.01 ? 'warning.main'
    : 'success.main';

  const balanceLabel = calc.projectedBalance > 0.01 ? 'Müşteri borçlu'
    : calc.projectedBalance < -0.01 ? 'Otel borçlu (iade)'
    : 'Bakiye sıfır';

  const canConfirm = useMemo(() => {
    if (loading) return false;
    if (calc.projectedBalance > 0.01) {
      // Bakiye var → sadece force + reason ile
      return force && canForce && forceReason.trim().length > 0;
    }
    if (calc.projectedBalance < -0.01) {
      // Otel borçlu → iade onayı için force gerek
      return force && canForce && forceReason.trim().length > 0;
    }
    return true;
  }, [loading, calc.projectedBalance, force, canForce, forceReason]);

  const handleConfirm = () => {
    onConfirm({
      force,
      forceReason: forceReason.trim(),
      earlyDepartureMode,
      transferToCompany: !!(transferToCompany && companyId),
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ExitIcon color="primary" />
        Check-out — Oda {roomNumber}
      </DialogTitle>

      <DialogContent dividers>
        {/* Sunucu hatası */}
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError.message}
          </Alert>
        )}

        {/* Hesap Özeti */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Hesap Özeti
          </Typography>
          <Stack spacing={0.5}>
            <Row label="Planlanan gece" value={`${calc.plannedNights} gece`} />
            <Row label="Kalınan gece" value={`${calc.actualNights} gece`} highlight={calc.isEarlyDeparture} />
            <Row label="Gecelik ücret" value={fmt(nightlyRate)} />
            <Divider sx={{ my: 0.5 }} />
            <Row label="Folio'daki room_charge" value={fmt(calc.existingRoomCharge)} />
            <Row
              label="Otomatik eklenecek oda ücreti"
              value={fmt(calc.missing)}
              highlight={calc.missing > 0}
              hint={calc.missing > 0 ? 'Bu tutar kapanışta folio\'ya yazılacak' : undefined}
            />
            {calc.willTransferAmount > 0 && (
              <Row
                label="Cariye yansıtılacak"
                value={fmt(calc.willTransferAmount)}
                highlight
                hint={companyName ? `→ ${companyName}` : undefined}
              />
            )}
            <Divider sx={{ my: 0.5 }} />
            <Row label="Toplam ücret" value={fmt(calc.projectedCharges)} bold />
            <Row label="Ödenen" value={fmt(calc.projectedPayments)} bold />
            <Row label="Kalan bakiye" value={fmt(calc.projectedBalance)} bold color={balanceColor} />
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={balanceLabel}
                color={
                  calc.projectedBalance > 0.01 ? 'error'
                  : calc.projectedBalance < -0.01 ? 'warning'
                  : 'success'
                }
              />
            </Box>
          </Stack>
        </Box>

        {/* Erken çıkış seçimi */}
        {calc.isEarlyDeparture && (
          <Box sx={{ mb: 2 }}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Erken Çıkış Politikası
              </FormLabel>
              <RadioGroup
                value={earlyDepartureMode}
                onChange={(e) => setEarlyDepartureMode(e.target.value as EarlyDepartureMode)}
              >
                <FormControlLabel
                  value="refund"
                  control={<Radio size="small" />}
                  label={`Sadece kalınan günleri al (${fmt(calc.actualUsed)}) — fark iadesi`}
                />
                <FormControlLabel
                  value="full"
                  control={<Radio size="small" />}
                  label={`Tam rezervasyon ücretini al (${fmt(calc.plannedTotal)}) — iade yok`}
                />
                <FormControlLabel
                  value="penalty"
                  control={<Radio size="small" />}
                  label={`Cezalı: kullanılan + 1 gece (${fmt(calc.actualUsed + nightlyRate)})`}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Şirket cariye yansıtma */}
        {companyId && calc.projectedBalance > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <BusinessIcon color="primary" sx={{ mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={transferToCompany}
                      onChange={(e) => setTransferToCompany(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Kalan bakiyeyi <strong>{companyName}</strong> firmasının cari hesabına yansıt
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Cariye yazılır, şirket sonra toplu ödediğinde otomatik kapanır.
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Force — bakiye sıfırlanmadıysa */}
        {Math.abs(calc.projectedBalance) > 0.01 && (
          <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'warning.main', borderRadius: 1, bgcolor: 'warning.light' }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <WarningIcon color="warning" />
              <Box sx={{ flex: 1 }}>
                {canForce ? (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={force}
                          onChange={(e) => setForce(e.target.checked)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={600}>
                          Zorla çıkış yap (bakiye var)
                        </Typography>
                      }
                    />
                    {force && (
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                        label="Sebep (zorunlu)"
                        value={forceReason}
                        onChange={(e) => setForceReason(e.target.value)}
                        placeholder="Örn: Müşteri firma sonradan ödeyecek, kayıt onaylandı..."
                        sx={{ mt: 1 }}
                      />
                    )}
                  </>
                ) : (
                  <Typography variant="body2">
                    Bakiyeli çıkış için patron veya müdür yetkisi gerekir. Önce ödeme alınız veya yetkili bir kullanıcıya bildiriniz.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>İptal</Button>
        <Button
          variant="contained"
          color={calc.projectedBalance > 0.01 ? 'error' : 'primary'}
          onClick={handleConfirm}
          disabled={!canConfirm}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ExitIcon />}
        >
          {calc.projectedBalance > 0.01 ? 'Zorla Çıkış' : 'Çıkışı Onayla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Row: React.FC<{
  label: string; value: string;
  highlight?: boolean; bold?: boolean;
  color?: string; hint?: string;
}> = ({ label, value, highlight, bold, color, hint }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} color={highlight ? 'primary.main' : 'text.primary'}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 500} sx={{ color: color || (highlight ? 'primary.main' : 'text.primary') }}>
        {value}
      </Typography>
    </Box>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Box>
);

export default CheckOutDialog;

/**
 * StatusBadge Bileşeni
 *
 * Durum bilgilerini renkli etiket (chip) olarak gösterir.
 * Oda durumu, rezervasyon durumu, ödeme durumu gibi yerlerde kullanılır.
 *
 * Örnek Kullanım:
 *   <StatusBadge status="available" type="room" />         → Yeşil "Müsait"
 *   <StatusBadge status="checked_in" type="reservation" /> → Mavi "Giriş Yapıldı"
 *   <StatusBadge status="paid" type="payment" />           → Yeşil "Ödendi"
 *   <StatusBadge label="VIP" color="secondary" />          → Özel etiket
 *
 * Props:
 *   - status (string): Durum değeri (constants.js'deki enum değerleri)
 *   - type (string): Durum tipi: 'room', 'reservation', 'payment'
 *   - label (string): Özel etiket metni (status/type yerine)
 *   - color (string): Özel renk (MUI renk adı: success, error, warning, info, default)
 *   - size (string): Boyut: 'small' veya 'medium'
 *   - sx (object): Ek stil özellikleri
 */

import React from 'react';
import { Chip, SxProps, Theme } from '@mui/material';

import {
  ROOM_STATUS_LABELS,
  ROOM_STATUS_COLORS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from '../../utils/constants';

type StatusType = 'room' | 'reservation' | 'payment';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface StatusBadgeProps {
  status?: string;
  type?: StatusType;
  label?: string;
  color?: ChipColor;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

/**
 * Durum tipine göre etiket ve renk bilgisini döndürür.
 * @param status - Durum değeri
 * @param type - Durum tipi (room, reservation, payment)
 * @returns { label: string, color: string }
 */
const getStatusConfig = (status: string, type: StatusType): { label: string; color: ChipColor } => {
  switch (type) {
    case 'room':
      return {
        label: ROOM_STATUS_LABELS[status] || status,
        color: (ROOM_STATUS_COLORS[status] as ChipColor) || 'default',
      };
    case 'reservation':
      return {
        label: RESERVATION_STATUS_LABELS[status] || status,
        color: (RESERVATION_STATUS_COLORS[status] as ChipColor) || 'default',
      };
    case 'payment':
      return {
        label: PAYMENT_STATUS_LABELS[status] || status,
        color: (PAYMENT_STATUS_COLORS[status] as ChipColor) || 'default',
      };
    default:
      return { label: status, color: 'default' };
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  label: customLabel,
  color: customColor,
  size = 'small',
  sx = {},
}) => {
  /* Eğer özel etiket/renk verilmişse onları kullan, yoksa status/type'dan hesapla */
  const config = status && type ? getStatusConfig(status, type) : { label: undefined, color: undefined };
  const label = customLabel || config.label || status;
  const color: ChipColor = customColor || config.color || 'default';

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant="filled"
      sx={{
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...sx,
      }}
    />
  );
};

export default StatusBadge;

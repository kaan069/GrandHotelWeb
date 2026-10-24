/**
 * Misafir konaklama geçmişi — API satırlarını ekran modeline çevirir
 *
 * Backend /guests/{id}/stay_history/ tutarları metin döner ("1500.00").
 * Doğrudan toplamak metin birleştirmesine yol açıyordu ("01500.00…").
 * İptal edilen rezervasyonlar konaklama sayılmaz.
 * Mobil karşılığı: GrandHotelMobil/src/components/guests/GuestStayHistoryModal.tsx
 */

import type { ApiReservation } from '../api/services';
import type { StayHistory } from './constants';

export const toStayHistory = (rows: ApiReservation[]): StayHistory[] =>
  rows
    .filter((r) => r.status !== 'cancelled')
    .map((r) => ({
      id: r.id,
      guestName: r.guestNames || '',
      roomNumber: r.roomNumber,
      checkIn: r.checkIn,
      checkOut: r.checkOut || '',
      companyName: r.companyName || undefined,
      totalAmount: Number(r.totalAmount) || 0,
      paidAmount: Number(r.paidAmount) || 0,
      status: r.status,
    }));

/** Gerçekleşmiş konaklama mı? (rezerve kaydın tutarı sadece planlanan tutardır) */
export const isRealisedStay = (s: StayHistory): boolean =>
  s.status === undefined || s.status === 'checked_in' || s.status === 'checked_out';

/** Toplam gece — çıkışı olmayan (devam eden) konaklama bugüne kadar sayılır */
export const countNights = (stays: StayHistory[]): number =>
  stays.reduce((sum, s) => {
    const end = s.checkOut ? new Date(s.checkOut).getTime() : Date.now();
    const diff = end - new Date(s.checkIn).getTime();
    return sum + Math.max(Math.ceil(diff / 86400000), 0);
  }, 0);

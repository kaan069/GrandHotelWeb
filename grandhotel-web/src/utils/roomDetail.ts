/**
 * ApiRoom → RoomDetailContent'in beklediği oda biçimi (fiyat sayı, sadece kalıcı misafirler).
 * Oda detayını sekmede açan sayfalar ortak kullanır (rezervasyon listesi, Borçlular → Konaklayan).
 */

import type { ApiRoom } from '../api/services';

export const mapApiRoomToDetail = (r: ApiRoom) => ({
  id: r.id,
  roomNumber: r.roomNumber,
  bedType: r.bedType,
  floor: r.floor,
  capacity: r.capacity,
  view: r.view,
  price: parseFloat(r.price) || 0,
  status: r.status,
  guestName: r.guestName ?? undefined,
  guests: r.guests?.filter((g) => g.guestId !== null && g.checkIn).map((g) => ({
    guestId: g.guestId as number,
    guestName: g.guestName,
    phone: g.phone,
    checkIn: g.checkIn as string,
    checkOut: g.checkOut ?? undefined,
    isActive: g.isActive,
  })),
  notes: r.notes ?? undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  reservationCompanyId: r.reservationCompanyId,
  reservationAgencyId: r.reservationAgencyId,
  reservationAgencyCode: r.reservationAgencyCode,
  beds: r.beds,
  minibar: r.minibar,
});

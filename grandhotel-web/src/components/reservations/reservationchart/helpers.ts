/** Rezervasyon durumuna göre renk */
export const getReservationColor = (status: string): { bg: string; border: string; text: string } => {
  switch (status) {
    case 'reserved': return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' };
    case 'checked_in': return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
    default: return { bg: '#F5F5F5', border: '#9E9E9E', text: '#616161' };
  }
};

/** Oda durum rengi */
export const getRoomStatusColor = (status: string): string => {
  switch (status) {
    case 'available': return '#4CAF50';
    case 'occupied': return '#F44336';
    case 'dirty': return '#FF9800';
    case 'maintenance': return '#9E9E9E';
    case 'blocked': return '#795548';
    default: return '#9E9E9E';
  }
};

/** Görünür gün sayısı */
export const VISIBLE_DAYS = 14;

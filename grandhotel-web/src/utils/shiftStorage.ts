/**
 * Mesai Devir Storage
 *
 * Mesai devir kayıtlarını localStorage üzerinde yönetir.
 * Backend hazır olunca API'ye geçilecek.
 */

import { ShiftHandover, SHIFTS_STORAGE_KEY } from './constants';

/** Mock geçmiş devir verileri */
const MOCK_SHIFTS: ShiftHandover[] = [
  {
    id: 1,
    date: '2026-03-09',
    fromUser: 'Ayşe Kaya',
    toUser: 'Mehmet Demir',
    startTime: '2026-03-09T08:00:00',
    endTime: '2026-03-09T16:00:00',
    cardSales: 4200,
    cashSales: 3100,
    totalSales: 7300,
    roomsSold: 3,
    status: 'closed',
  },
  {
    id: 2,
    date: '2026-03-10',
    fromUser: 'Ayşe Kaya',
    toUser: 'Mehmet Demir',
    startTime: '2026-03-10T08:00:00',
    endTime: '2026-03-10T16:00:00',
    cardSales: 5800,
    cashSales: 2400,
    totalSales: 8200,
    roomsSold: 4,
    status: 'closed',
  },
  {
    id: 3,
    date: '2026-03-10',
    fromUser: 'Mehmet Demir',
    toUser: 'Ayşe Kaya',
    startTime: '2026-03-10T16:00:00',
    endTime: '2026-03-10T23:30:00',
    cardSales: 3500,
    cashSales: 1800,
    totalSales: 5300,
    roomsSold: 2,
    status: 'closed',
  },
];

/** localStorage'dan devirleri yükle */
export const loadShifts = (): ShiftHandover[] => {
  try {
    const saved = localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* varsayılan döndür */ }
  return MOCK_SHIFTS;
};

/** Devirleri localStorage'a kaydet */
export const saveShifts = (shifts: ShiftHandover[]): void => {
  localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
};

/** Yeni devir oluştur */
export const createShift = (fromUser: string, toUser: string): ShiftHandover => {
  const shifts = loadShifts();
  const maxId = shifts.reduce((max, s) => Math.max(max, s.id), 0);
  const now = new Date();

  const newShift: ShiftHandover = {
    id: maxId + 1,
    date: now.toISOString().split('T')[0],
    fromUser,
    toUser,
    startTime: now.toISOString(),
    cardSales: 0,
    cashSales: 0,
    totalSales: 0,
    roomsSold: 0,
    status: 'active',
  };

  shifts.push(newShift);
  saveShifts(shifts);
  return newShift;
};

/** Aktif deviri getir */
export const getActiveShift = (): ShiftHandover | null => {
  const shifts = loadShifts();
  return shifts.find((s) => s.status === 'active') || null;
};

/** Deviri kapat */
export const closeShift = (shiftId: number): ShiftHandover | null => {
  const shifts = loadShifts();
  const index = shifts.findIndex((s) => s.id === shiftId);
  if (index === -1) return null;

  const now = new Date();
  shifts[index] = {
    ...shifts[index],
    endTime: now.toISOString(),
    // Mock satış verileri (backend olmadığı için rastgele)
    cardSales: Math.floor(Math.random() * 8000) + 2000,
    cashSales: Math.floor(Math.random() * 5000) + 1000,
    roomsSold: Math.floor(Math.random() * 5) + 1,
    status: 'closed',
  };
  shifts[index].totalSales = shifts[index].cardSales + shifts[index].cashSales;

  saveShifts(shifts);
  return shifts[index];
};

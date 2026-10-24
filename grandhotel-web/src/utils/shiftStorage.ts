/**
 * Mesai Devir API Servisleri
 *
 * Backend API üzerinden mesai devir kayıtlarını yönetir.
 */

import { shiftApi } from '../api/services';
import { ShiftHandover } from './constants';

/** Tüm mesai kayıtlarını getir */
export const loadShifts = async (): Promise<ShiftHandover[]> => {
  try {
    return await shiftApi.getAll();
  } catch {
    return [];
  }
};

/** Yeni mesai devret */
export const createShift = async (
  fromEmployeeId: number,
  toEmployeeId: number,
  notes?: string
): Promise<{ shift: ShiftHandover; closedShift: ShiftHandover | null }> => {
  return await shiftApi.create({ fromEmployeeId, toEmployeeId, notes });
};

/** Aktif mesaiyi getir */
export const getActiveShift = async (): Promise<ShiftHandover | null> => {
  try {
    const data = await shiftApi.getActive();
    return data || null;
  } catch {
    return null;
  }
};

/** Mesaiyi kapat (hata çağırana iletilir) */
export const closeShift = async (shiftId: number, notes?: string): Promise<ShiftHandover> => {
  return await shiftApi.close(shiftId, { notes });
};

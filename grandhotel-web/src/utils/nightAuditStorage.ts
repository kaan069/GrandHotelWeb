/**
 * Gün Sonu (Night Audit) Storage
 *
 * Gün sonu işlem loglarını localStorage üzerinde yönetir.
 * Her gün sonu çalıştırıldığında dolu odalara oda ücreti yansıtılır
 * ve işlem kaydedilir. Aynı gün tekrar çalıştırılamaz.
 */

import { NightAuditLog, NIGHT_AUDIT_STORAGE_KEY } from './constants';

/** localStorage'dan tüm gün sonu loglarını yükle */
export const loadNightAudits = (): NightAuditLog[] => {
  try {
    const saved = localStorage.getItem(NIGHT_AUDIT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* varsayılan döndür */ }
  return [];
};

/** Gün sonu loglarını localStorage'a kaydet */
const saveNightAudits = (audits: NightAuditLog[]): void => {
  localStorage.setItem(NIGHT_AUDIT_STORAGE_KEY, JSON.stringify(audits));
};

/** Belirli bir tarihin gün sonu işlemi yapılmış mı kontrol et */
export const getNightAuditByDate = (date: string): NightAuditLog | null => {
  const audits = loadNightAudits();
  return audits.find((a) => a.date === date) || null;
};

/** Yeni gün sonu logu oluştur */
export const createNightAudit = (audit: Omit<NightAuditLog, 'id'>): NightAuditLog => {
  const audits = loadNightAudits();
  const maxId = audits.reduce((max, a) => Math.max(max, a.id), 0);

  const newAudit: NightAuditLog = {
    ...audit,
    id: maxId + 1,
  };

  audits.push(newAudit);
  saveNightAudits(audits);
  return newAudit;
};

/** Son gün sonu tarihini getir */
export const getLastAuditDate = (): string | null => {
  const audits = loadNightAudits();
  if (audits.length === 0) return null;
  return audits.sort((a, b) => b.date.localeCompare(a.date))[0].date;
};

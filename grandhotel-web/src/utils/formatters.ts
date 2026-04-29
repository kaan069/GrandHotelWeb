/**
 * GrandHotel PMS - Formatlama Yardımcıları
 *
 * Tarih, para birimi, telefon gibi verileri
 * kullanıcıya gösterilecek formata çevirir.
 *
 * Kullanım:
 *   import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
 */

import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/tr';
import { CURRENCY_SYMBOL, DATE_FORMAT, DATETIME_FORMAT } from './constants';

/** Tarih parametresi olarak kabul edilen tipler */
type DateInput = string | Date | Dayjs | null | undefined;

/* dayjs Türkçe yerelleştirme */
dayjs.locale('tr');

/**
 * Yerel saate göre bugünün tarihini YYYY-MM-DD olarak döner.
 * `new Date().toISOString().split('T')[0]` UTC tarih döndürdüğü için
 * Türkiye'de gece saatlerinde bir gün geride kalabiliyor — bu helper
 * lokal takvim gününü döndürür.
 */
export const getLocalDateStr = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Sayısal değeri Türk Lirası formatında gösterir.
 * @param amount - Para miktarı
 * @param showSymbol - Para birimi simgesini göster (varsayılan: true)
 * @returns Formatlı metin - Örnek: "1.250,00 ₺"
 */
export const formatCurrency = (amount: number | null | undefined, showSymbol = true): string => {
  if (amount === null || amount === undefined) return '-';

  const formatted = Number(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
};

/**
 * Tarihi Türkçe formatında gösterir.
 * @param date - Tarih değeri
 * @param format - Çıktı formatı (varsayılan: DD.MM.YYYY)
 * @returns Formatlı tarih - Örnek: "15.03.2026"
 */
export const formatDate = (date: DateInput, format: string = DATE_FORMAT): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * Tarih ve saati Türkçe formatında gösterir.
 * @param date - Tarih değeri
 * @returns Formatlı tarih+saat - Örnek: "15.03.2026 14:30"
 */
export const formatDateTime = (date: DateInput): string => {
  if (!date) return '-';
  return dayjs(date).format(DATETIME_FORMAT);
};

/**
 * İki tarih arasındaki gece sayısını hesaplar.
 * @param checkIn - Giriş tarihi
 * @param checkOut - Çıkış tarihi
 * @returns Gece sayısı
 */
export const calculateNights = (checkIn: DateInput, checkOut: DateInput): number => {
  if (!checkIn || !checkOut) return 0;
  return dayjs(checkOut).diff(dayjs(checkIn), 'day');
};

/**
 * Telefon numarasını formatlı gösterir.
 * @param phone - Saf rakamlardan oluşan telefon numarası
 * @returns Formatlı telefon - Örnek: "0(532) 123 45 67"
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10 && digits.length !== 11) return phone;

  /* 10 haneli: başına 0 ekle */
  const full = digits.length === 10 ? `0${digits}` : digits;

  return `${full[0]}(${full.slice(1, 4)}) ${full.slice(4, 7)} ${full.slice(7, 9)} ${full.slice(9, 11)}`;
};

/**
 * TC Kimlik numarasını maskeleyerek gösterir.
 * Güvenlik için sadece ilk 3 ve son 2 hane gösterilir.
 * @param tc - TC Kimlik numarası
 * @returns Maskeli TC - Örnek: "123*****67"
 */
export const maskIdentity = (tc: string | null | undefined): string => {
  if (!tc || tc.length < 5) return tc || '-';
  return `${tc.slice(0, 3)}${'*'.repeat(tc.length - 5)}${tc.slice(-2)}`;
};

/**
 * Sayıyı Türk formatlı binlik ayırıcı ile gösterir.
 * @param num - Sayı
 * @returns Formatlı sayı - Örnek: "1.250"
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  return Number(num).toLocaleString('tr-TR');
};

/**
 * Yüzde değerini formatlı gösterir.
 * @param value - Yüzde değeri (0-100 arası)
 * @param decimals - Ondalık basamak sayısı
 * @returns Formatlı yüzde - Örnek: "%72,5"
 */
export const formatPercent = (value: number | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return '-';
  return `%${Number(value).toFixed(decimals).replace('.', ',')}`;
};

/**
 * Ad ve soyadın baş harflerini döndürür.
 * Avatar bileşeninde kullanılır.
 * @param firstName - Ad
 * @param lastName - Soyad
 * @returns Baş harfler - Örnek: "FK"
 */
export const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
};

/**
 * Göreceli zaman ifadesi döndürür.
 * @param date - Tarih
 * @returns Göreceli zaman - Örnek: "2 saat önce", "Dün"
 */
export const formatRelativeTime = (date: DateInput): string => {
  if (!date) return '-';

  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return 'Az önce';
  if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  return formatDate(date);
};

/**
 * Ortak Sabitler — backend /api/meta/choices/ ile senkron
 *
 * Neden?
 *   Roller, durumlar, kategoriler web ve mobilde ayrı ayrı elle yazılmıştı ve
 *   ayrıştı. Tek doğruluk kaynağı backend modellerindeki CHOICES'lardır.
 *
 * Nasıl?
 *   - Anahtarlar (ör. 'reserved', 'room_charge') constants.ts'de sabit kalır:
 *     kod mantığı (if status === 'reserved') onlara bağlıdır.
 *   - Etiketler giriş sonrası backend'den alınıp mevcut sözlüklerin ÜZERİNE
 *     yazılır. constants.ts'deki etiketler sadece ilk açılış/çevrimdışı yedeğidir.
 *   - Geliştirme modunda backend'de karşılığı olmayan yerel anahtarlar konsola
 *     uyarı olarak basılır → ayrışma hemen fark edilir.
 *
 * Kullanım: AuthContext giriş sonrası ve açılışta hydrateChoiceLabels() çağırır.
 * Yeni bir sözlük eklemek için aşağıdaki listelere bir satır eklemek yeter.
 */

import { metaApi, MetaChoices, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../api/services';
import {
  ROLE_LABELS,
  ROOM_STATUS_LABELS,
  BED_TYPE_LABELS,
  VIEW_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
  FOLIO_CATEGORY_LABELS,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
} from './constants';

type ChoiceKey = keyof MetaChoices;
type ChoiceOption = MetaChoices[ChoiceKey][number];

/** { değer: etiket } sözlükleri — backend'deki tüm değerler eklenir */
const LABEL_MAPS: [ChoiceKey, Record<string, string>][] = [
  ['roles', ROLE_LABELS],
  ['roomStatus', ROOM_STATUS_LABELS],
  ['bedTypes', BED_TYPE_LABELS],
  ['roomViews', VIEW_TYPE_LABELS],
  ['reservationStatus', RESERVATION_STATUS_LABELS],
  ['folioCategories', FOLIO_CATEGORY_LABELS],
  ['invoiceTypes', INVOICE_TYPE_LABELS as Record<string, string>],
  ['invoiceStatus', INVOICE_STATUS_LABELS as Record<string, string>],
];

/** [{value, label}] seçici listeleri — sadece mevcut seçeneklerin etiketi güncellenir */
const OPTION_LISTS: [ChoiceKey, { value: string; label: string }[]][] = [
  ['expenseCategories', EXPENSE_CATEGORIES],
  ['expensePaymentMethods', EXPENSE_PAYMENT_METHODS],
];

function warnStale(key: ChoiceKey, localValues: string[], options: ChoiceOption[]) {
  if (process.env.NODE_ENV === 'production') return;
  const backendValues = new Set(options.map((o) => o.value));
  const stale = localValues.filter((v) => !backendValues.has(v));
  if (stale.length > 0) {
    console.warn(`[choices] ${key}: backend'de olmayan yerel değerler →`, stale);
  }
}

/** Backend etiketlerini yerel sözlüklere uygular. Hata olursa yerel etiketler kalır. */
export async function hydrateChoiceLabels(): Promise<void> {
  const choices = await metaApi.getChoices();

  for (const [key, target] of LABEL_MAPS) {
    const options = choices[key] || [];
    warnStale(key, Object.keys(target), options);
    options.forEach((o) => { target[o.value] = o.label; });
  }

  for (const [key, list] of OPTION_LISTS) {
    const options = choices[key] || [];
    warnStale(key, list.map((item) => item.value), options);
    const labelByValue = new Map(options.map((o) => [o.value, o.label]));
    list.forEach((item) => {
      const label = labelByValue.get(item.value);
      if (label) item.label = label;
    });
  }
}

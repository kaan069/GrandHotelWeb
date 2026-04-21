/**
 * pollInvoiceStatus — Paraşüt fatura durum polling helper'ı
 *
 * Backend /api/invoices/{id}/send/ async job başlatıyor (status: processing).
 * Bu helper /api/invoices/{id}/check-status/ endpoint'ini aralıklı çağırıp
 * completed / failed olana kadar bekler, timeout durumunda timeout sonucu döner.
 */

import { invoicesApi, type ApiInvoice } from '../api/services';

export type PollOutcome =
  | { status: 'completed'; invoice: ApiInvoice }
  | { status: 'failed'; invoice: ApiInvoice }
  | { status: 'timeout'; invoice: ApiInvoice | null };

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

export async function pollInvoiceStatus(
  invoiceId: number,
  { intervalMs = 3000, timeoutMs = 60000 }: PollOptions = {}
): Promise<PollOutcome> {
  const startedAt = Date.now();
  let lastInvoice: ApiInvoice | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const invoice = await invoicesApi.checkStatus(invoiceId);
      lastInvoice = invoice;

      if (invoice.status === 'completed') {
        return { status: 'completed', invoice };
      }
      if (invoice.status === 'failed') {
        return { status: 'failed', invoice };
      }
    } catch {
      // Backend "Sadece işleniyor durumundaki faturalar sorgulanabilir" diyebilir
      // (fatura zaten completed). GET ile son durumu al.
      try {
        const invoice = await invoicesApi.get(invoiceId);
        lastInvoice = invoice;
        if (invoice.status === 'completed') {
          return { status: 'completed', invoice };
        }
        if (invoice.status === 'failed') {
          return { status: 'failed', invoice };
        }
      } catch {
        // ignore, devam et
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { status: 'timeout', invoice: lastInvoice };
}

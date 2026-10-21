/**
 * API hata mesajı yardımcıları
 *
 * Backend tüm hatalarda aynı biçimi döner (config/exception_handler.py):
 *   { error: "Kullanıcıya gösterilecek mesaj", code: "invalid" | "permission_denied" | ..., fields?: { alan: [mesaj] } }
 *
 * Bu sayede sayfalardaki `err.response?.data?.error` okumaları doğrulama ve
 * yetki hatalarında da anlamlı mesaj gösterir. Yeni kodda bu yardımcıları kullanın.
 * Mobildeki karşılığı: GrandHotelMobil/src/services/api.ts → ApiError / _toApiError
 */

interface ApiErrorBody {
  error?: string;
  detail?: string;
  code?: string;
  fields?: Record<string, string[]>;
}

function getBody(err: unknown): ApiErrorBody | undefined {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined;
}

/** Kullanıcıya gösterilecek tek satır hata mesajı */
export function getApiErrorMessage(err: unknown, fallback = 'Beklenmeyen bir hata oluştu'): string {
  const body = getBody(err);
  if (typeof body?.error === 'string') return body.error;
  if (typeof body?.detail === 'string') return body.detail;
  return (err as { message?: string })?.message || fallback;
}

/** Form alanı bazında hatalar: { roomId: ['Geçersiz pk'] } — doğrulama hatası değilse boş */
export function getApiFieldErrors(err: unknown): Record<string, string[]> {
  return getBody(err)?.fields || {};
}

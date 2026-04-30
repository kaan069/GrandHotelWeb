/**
 * mrzParser — Türkiye Kimlik Kartı MRZ Parser
 *
 * USB barkod tarayıcı klavye modunda çalışır: scanner kimliği okuyup
 * 3 satırlık MRZ string'ini input'a yapıştırır. Bu helper o string'i
 * parse edip TC, ad, soyad, doğum tarihi, cinsiyet alanlarını çıkarır.
 *
 * Kart formatı: ICAO 9303 TD1 — 3 satır × 30 karakter
 * Örnek satırlar (T.C. Kimlik 2017+):
 *   I<TURA21H7G3X10<<<<<<<<<<<<<<<     ← satır 1: doc type, country, doc number
 *   9001011M3001011TUR12345678901<C    ← satır 2: doğum, cinsiyet, expiry, ülke, TC (11 hane)
 *   YILMAZ<<AHMET<<<<<<<<<<<<<<<<<<    ← satır 3: soyad / ad
 *
 * Notlar:
 * - TC numarası satır 2'de "optional data" alanında 11 hane olarak gelir.
 * - Tarih formatı YYMMDD; 2-haneli yıl 50'den büyükse 19xx, küçük/eşitse 20xx kabul edilir.
 * - Soyad ve ad arasında "<<" ayraç var; ad'lar arasında tek "<" var.
 */

export interface MrzData {
  tcNo: string;
  firstName: string;
  lastName: string;
  birthDate: string;   // YYYY-MM-DD
  gender: 'M' | 'F' | '';
  expiryDate: string;  // YYYY-MM-DD
  documentNumber: string;
  raw: string;
}

/**
 * Yıl 2 haneden 4 haneye çevrilir.
 * 50+ → 19xx (1950-1999), 0-49 → 20xx (2000-2049)
 */
function expandYear(yy: string): string {
  const n = parseInt(yy, 10);
  if (Number.isNaN(n)) return '';
  return n >= 50 ? `19${yy}` : `20${yy}`;
}

function parseMrzDate(raw: string): string {
  if (raw.length !== 6 || !/^\d{6}$/.test(raw)) return '';
  const yy = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  const dd = raw.slice(4, 6);
  const yyyy = expandYear(yy);
  if (!yyyy) return '';
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * MRZ string'inden boşluk ve kontrol karakterlerini at, sadece A-Z 0-9 < bırak.
 * 90 karakteri 30'arlı 3 satıra böl.
 */
function normalize(input: string): string[] | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[^A-Z0-9<\n\r]/g, '')
    .replace(/[\n\r]+/g, '');
  if (cleaned.length < 90) return null;
  // İlk 90 karakteri al
  const sliced = cleaned.slice(0, 90);
  const lines = sliced.match(/.{30}/g);
  if (!lines || lines.length < 3) return null;
  return lines;
}

/**
 * MRZ TD1 formatını parse eder.
 * @returns Başarılıysa MrzData, hatalıysa null.
 */
export function parseMrz(raw: string): MrzData | null {
  if (!raw || raw.length < 60) return null;

  const lines = normalize(raw);
  if (!lines) return null;

  const [line1, line2, line3] = lines;

  // Satır 1: I<TUR + DOC_NUMBER (9 hane) + check + optional + check
  // Doc type "I" veya "ID" ile başlar; ülke kodu 3 hane sonra
  if (!/^I[A-Z<]TUR/.test(line1)) {
    return null; // Türkiye kimliği değil
  }
  const documentNumber = line1.slice(5, 14).replace(/</g, '').trim();

  // Satır 2: YYMMDD + check + gender(1) + YYMMDD + check + nationality(3) + optional(11) + check + check
  if (line2.length < 30) return null;
  const birthRaw = line2.slice(0, 6);
  const gender = line2.slice(7, 8);
  const expiryRaw = line2.slice(8, 14);
  /* TC kimlik no — Türk yetkilileri TC'yi satır 1'in opsiyonel alanına (pos 15-29) yazıyor,
     bazen başında '<' filler olur. Bazı eski kartlarda satır 2 pos 18-28'de olabilir.
     '<'leri silip 11 haneli rakam dizisi ara. */
  const tcFromL1 = line1.slice(15, 30).replace(/</g, '');
  const tcFromL2 = line2.slice(18, 29).replace(/</g, '');
  const tcRaw = /^\d{11}$/.test(tcFromL1) ? tcFromL1
    : /^\d{11}$/.test(tcFromL2) ? tcFromL2
    : '';

  const birthDate = parseMrzDate(birthRaw);
  const expiryDate = parseMrzDate(expiryRaw);

  // Satır 3: SOYAD<<AD<DIGER_AD<<<<<<<<<<
  // İlk "<<" soyad/ad ayracı
  const namePart = line3.replace(/<+$/, ''); // trailing <'leri at
  const sepIndex = namePart.indexOf('<<');
  let lastName = '';
  let firstName = '';
  if (sepIndex >= 0) {
    lastName = namePart.slice(0, sepIndex).replace(/</g, ' ').trim();
    firstName = namePart.slice(sepIndex + 2).replace(/</g, ' ').trim();
  } else {
    // Ayraç yoksa hepsini soyad varsay
    lastName = namePart.replace(/</g, ' ').trim();
  }

  return {
    tcNo: tcRaw,
    firstName,
    lastName,
    birthDate,
    gender: gender === 'M' || gender === 'F' ? gender : '',
    expiryDate,
    documentNumber,
    raw,
  };
}

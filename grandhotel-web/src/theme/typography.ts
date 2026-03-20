/**
 * GrandHotel PMS - Tipografi Ayarları
 *
 * Uygulama genelinde kullanılan font ailesi, boyutlar ve ağırlıklar.
 * MUI bileşenlerinin tümü bu ayarları otomatik olarak kullanır.
 *
 * Font: Inter (Google Fonts üzerinden yüklenir - public/index.html)
 */

const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),

  /* Sayfa başlıkları - Dashboard, Oda Yönetimi vb. */
  h1: {
    fontSize: '1.75rem',   // 28px
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },

  /* Bölüm başlıkları - Kart başlıkları, modal başlıkları */
  h2: {
    fontSize: '1.375rem',  // 22px
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.005em',
  },

  /* Alt bölüm başlıkları */
  h3: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 600,
    lineHeight: 1.4,
  },

  /* Küçük başlıklar - form grup başlıkları */
  h4: {
    fontSize: '1rem',      // 16px
    fontWeight: 600,
    lineHeight: 1.4,
  },

  h5: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    lineHeight: 1.5,
  },

  h6: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 600,
    lineHeight: 1.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  /* Ana gövde metni */
  body1: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: 1.6,
  },

  /* İkincil gövde metni - açıklamalar, alt bilgiler */
  body2: {
    fontSize: '0.8125rem', // 13px
    fontWeight: 400,
    lineHeight: 1.5,
  },

  /* Alt yazılar - tablo alt bilgileri, tarihler */
  subtitle1: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.5,
  },

  subtitle2: {
    fontSize: '0.8125rem', // 13px
    fontWeight: 500,
    lineHeight: 1.5,
  },

  /* Buton metni */
  button: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    textTransform: 'none', // MUI varsayılanı uppercase, biz küçük harf kullanıyoruz
    letterSpacing: '0.01em',
  },

  /* Küçük metin - badge, etiket */
  caption: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 400,
    lineHeight: 1.5,
  },

  /* Üst yazı - etiket, kategori */
  overline: {
    fontSize: '0.6875rem', // 11px
    fontWeight: 600,
    lineHeight: 1.5,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};

export default typography;

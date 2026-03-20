/**
 * GrandHotel PMS - Renk Paleti
 *
 * Tüm uygulama genelinde kullanılan renkler burada tanımlanır.
 * Yeni renk eklemek veya mevcut renkleri değiştirmek için bu dosyayı düzenleyin.
 *
 * Kullanım: theme/index.js içinde MUI tema yapısına dahil edilir.
 */

/** Renk tonu arayüzü (MUI SimplePaletteColorOptions ile uyumlu) */
interface PaletteColor {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

/** Özel uygulama renkleri */
interface CustomColors {
  sidebar: string;
  sidebarText: string;
  sidebarActive: string;
  sidebarHover: string;

  /* Oda durumu renkleri */
  roomAvailable: string;
  roomOccupied: string;
  roomDirty: string;
  roomMaintenance: string;
  roomBlocked: string;

  /* Rezervasyon durumu renkleri */
  resPending: string;
  resConfirmed: string;
  resCheckedIn: string;
  resCheckedOut: string;
  resCancelled: string;
  resNoShow: string;

  /* Ödeme durumu renkleri */
  paymentPaid: string;
  paymentPartial: string;
  paymentUnpaid: string;
}

/** Tam palet arayüzü */
export interface AppPalette {
  primary: PaletteColor;
  secondary: PaletteColor;
  success: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  divider: string;
  custom: CustomColors;
}

const palette: AppPalette = {
  primary: {
    main: '#1565C0',       // Ana mavi - butonlar, linkler, aktif menü
    light: '#1E88E5',      // Hover durumları
    dark: '#0D47A1',       // Aktif/pressed durumları
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#F59E0B',       // Altın/Amber - vurgular, ikonlar, badge'ler
    light: '#FBC02D',
    dark: '#F57F17',
    contrastText: '#1E293B',
  },
  success: {
    main: '#22C55E',       // Başarılı işlemler, aktif durumlar
    light: '#4ADE80',
    dark: '#16A34A',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',       // Hatalar, silme işlemleri
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F97316',       // Uyarılar, dikkat gerektiren durumlar
    light: '#FB923C',
    dark: '#EA580C',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',       // Bilgilendirme mesajları
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F5F5F5',    // Sayfa arka planı
    paper: '#FFFFFF',      // Kart, modal, sidebar arka planı
  },
  text: {
    primary: '#1E293B',    // Ana metin rengi
    secondary: '#64748B',  // İkincil metin, açıklama metinleri
    disabled: '#94A3B8',   // Pasif metin
  },
  divider: '#E2E8F0',     // Ayırıcı çizgiler

  /* --- Özel Renkler (MUI dışı, uygulama genelinde kullanılır) --- */
  custom: {
    sidebar: '#0F172A',          // Sidebar arka planı (koyu)
    sidebarText: '#CBD5E1',      // Sidebar metin rengi
    sidebarActive: '#1565C0',    // Sidebar aktif menü arka planı
    sidebarHover: '#1E293B',     // Sidebar hover arka planı

    /* Oda durumu renkleri */
    roomAvailable: '#22C55E',    // Boş & Temiz (yeşil)
    roomOccupied: '#EF4444',     // Dolu (kırmızı)
    roomDirty: '#F59E0B',        // Kirli (sarı)
    roomMaintenance: '#3B82F6',  // Bakımda (mavi)
    roomBlocked: '#64748B',      // Bloke (gri)

    /* Rezervasyon durumu renkleri */
    resPending: '#F59E0B',       // Beklemede (sarı)
    resConfirmed: '#22C55E',     // Onaylandı (yeşil)
    resCheckedIn: '#3B82F6',     // Check-in (mavi)
    resCheckedOut: '#64748B',    // Check-out (gri)
    resCancelled: '#EF4444',     // İptal (kırmızı)
    resNoShow: '#9333EA',       // No-show (mor)

    /* Ödeme durumu renkleri */
    paymentPaid: '#22C55E',      // Ödendi (yeşil)
    paymentPartial: '#F59E0B',   // Kısmi ödeme (sarı)
    paymentUnpaid: '#EF4444',    // Ödenmedi (kırmızı)
  },
};

export default palette;

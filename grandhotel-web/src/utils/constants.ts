/**
 * GrandHotel PMS - Sabit Değerler
 *
 * Uygulama genelinde kullanılan sabit değerler tek bir yerden yönetilir.
 * Yeni sabit eklemek için ilgili bölüme ekleyin.
 */

/* ==================== TİP TANIMLARI ==================== */

/** Kullanıcı rol tipi */
export type Role = 'patron' | 'manager' | 'reception' | 'reception_manager' | 'waiter' | 'chef' | 'restaurant_manager' | 'technician' | 'housekeeper' | 'housekeeping_manager' | 'security' | 'accountant' | 'lobby' | 'barista' | 'barman' | 'minibar' | 'cashier';

/** Oda durumu tipi */
export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance' | 'blocked';

/** Yatak tipi */
export type BedType = 'single' | 'double' | 'twin' | 'king';

/** Rezervasyon durumu tipi */
export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

/** Ödeme durumu tipi */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

/** Rezervasyon kaynağı tipi */
export type ReservationSource = 'walkin' | 'phone' | 'web' | 'ota';

/** Folio kategorisi tipi */
export type FolioCategory = 'room_charge' | 'minibar' | 'restaurant' | 'service' | 'discount' | 'payment';

/** Manzara tipi */
export type ViewType = 'sea' | 'city' | 'garden' | 'none';

/** MUI renk chip tipi */
export type ChipColor = 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary';

/** Misafir/Müşteri */
export interface Guest {
  id: number;
  tcNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  companyId?: number;
  createdAt: string;
  isBlocked?: boolean;
}

/** Odada kalan misafir */
export interface RoomGuest {
  guestId: number;
  guestName: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  isActive?: boolean;
}

/** Firma */
export interface Company {
  id: number;
  name: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  agreedRate?: string | number | null;
}

/** Folio kalemi — backend reservationId kullanır (roomId değil) */
export interface FolioItem {
  id: number;
  reservationId: number;
  guestId?: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  createdBy?: string;
  createdAt?: string;
}

/** Konaklama geçmişi — backend Reservation response'una uyumlu */
export interface StayHistory {
  id: number;
  guestId?: number;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  companyId?: number;
  companyName?: string;
  totalAmount: number;
  paidAmount: number;
}

/** Açık oda sekmesi */
export interface RoomTab {
  roomId: number;
  roomNumber: string;
}

/** Oda özelliği */
export interface RoomFeature {
  value: string;
  label: string;
}

/** Menü alt öğesi */
export interface MenuChildItem {
  id: string;
  label: string;
  path: string;
  roles?: Role[];
}

/** Sidebar menü öğesi */
export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: Role[];
  module?: string;
  children?: MenuChildItem[];
  bmsOnly?: boolean;  // true ise sadece isBmsAdmin olan kullanıcı görebilir
}

/* ==================== MODÜL TANIMLARI ==================== */

export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  alwaysOn: boolean;
  dependsOn: string[];
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { id: 'base', label: 'Temel Otel', description: 'Otel yönetimi, odalar, rezervasyonlar, misafirler, dashboard, raporlar', alwaysOn: true, dependsOn: [] },
  { id: 'staff', label: 'Eleman Yönetimi', description: 'Çalışanlar, görevler, izinler, mesai devir, mobil erişim', alwaysOn: false, dependsOn: [] },
  { id: 'restaurant', label: 'Restoran / Kafe', description: 'Masalar, adisyonlar, mutfak ekranı, kasa, menü, QR sipariş', alwaysOn: false, dependsOn: ['staff'] },
  { id: 'minibar', label: 'Minibar', description: 'Minibar stok takibi ve tüketim', alwaysOn: false, dependsOn: [] },
  { id: 'kbs', label: 'KBS', description: 'Misafir kimlik bildirim sistemi', alwaysOn: false, dependsOn: [] },
  { id: 'invoices', label: 'Faturalar', description: 'Fatura yönetimi, Paraşüt entegrasyonu', alwaysOn: false, dependsOn: [] },
  { id: 'cameras', label: 'Kameralar', description: 'Kamera sistemi entegrasyonu', alwaysOn: false, dependsOn: [] },
  { id: 'bms', label: 'Bina Yönetim Sistemi', description: 'Aydınlatma, klima, enerji yönetimi', alwaysOn: false, dependsOn: [] },
];

/* ==================== LAYOUT ==================== */

/** Sidebar genişliği (piksel) */
export const SIDEBAR_WIDTH = 260;

/** Sidebar daraltılmış genişliği (piksel) */
export const SIDEBAR_COLLAPSED_WIDTH = 72;

/** Header yüksekliği (piksel) */
export const HEADER_HEIGHT = 64;

/* ==================== ROLLER ==================== */

/**
 * Kullanıcı rolleri
 * Backend'den gelen rol değerleriyle eşleşmelidir.
 */
export const ROLES: Record<string, Role> = {
  PATRON: 'patron',
  MANAGER: 'manager',
  RECEPTION: 'reception',
  RECEPTION_MANAGER: 'reception_manager',
  WAITER: 'waiter',
  CHEF: 'chef',
  RESTAURANT_MANAGER: 'restaurant_manager',
  HOUSEKEEPER: 'housekeeper',
  HOUSEKEEPING_MANAGER: 'housekeeping_manager',
  TECHNICIAN: 'technician',
  SECURITY: 'security',
  ACCOUNTANT: 'accountant',
  LOBBY: 'lobby',
  BARISTA: 'barista',
  BARMAN: 'barman',
  MINIBAR: 'minibar',
  CASHIER: 'cashier',
};

/** Rol etiketleri (Türkçe gösterim) */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.PATRON]: 'Patron',
  [ROLES.MANAGER]: 'Genel Müdür',
  [ROLES.RECEPTION]: 'Resepsiyon',
  [ROLES.RECEPTION_MANAGER]: 'Resepsiyon Müdürü',
  [ROLES.WAITER]: 'Garson',
  [ROLES.CHEF]: 'Aşçı',
  [ROLES.RESTAURANT_MANAGER]: 'Restoran Müdürü',
  [ROLES.HOUSEKEEPER]: 'Housekeeping',
  [ROLES.HOUSEKEEPING_MANAGER]: 'Housekeeping Müdürü',
  [ROLES.TECHNICIAN]: 'Teknik',
  [ROLES.SECURITY]: 'Güvenlik',
  [ROLES.ACCOUNTANT]: 'Muhasebe',
  [ROLES.LOBBY]: 'Lobi',
  [ROLES.BARISTA]: 'Barista',
  [ROLES.BARMAN]: 'Barmen',
  [ROLES.MINIBAR]: 'Minibar Görevlisi',
  [ROLES.CASHIER]: 'Kasiyer',
};

/* ==================== ODA DURUMLARI ==================== */

export const ROOM_STATUS: Record<string, RoomStatus> = {
  AVAILABLE: 'available',     // Boş & Temiz
  OCCUPIED: 'occupied',       // Dolu
  DIRTY: 'dirty',            // Kirli
  MAINTENANCE: 'maintenance', // Bakımda
  BLOCKED: 'blocked',        // Bloke
};

/** Oda durumu etiketleri */
export const ROOM_STATUS_LABELS: Record<string, string> = {
  [ROOM_STATUS.AVAILABLE]: 'Müsait',
  [ROOM_STATUS.OCCUPIED]: 'Dolu',
  [ROOM_STATUS.DIRTY]: 'Kirli',
  [ROOM_STATUS.MAINTENANCE]: 'Bakımda',
  [ROOM_STATUS.BLOCKED]: 'Bloke',
};

/** Oda durumu renkleri (palette.js custom renkleriyle eşleşir) */
export const ROOM_STATUS_COLORS: Record<string, ChipColor> = {
  [ROOM_STATUS.AVAILABLE]: 'success',
  [ROOM_STATUS.OCCUPIED]: 'error',
  [ROOM_STATUS.DIRTY]: 'warning',
  [ROOM_STATUS.MAINTENANCE]: 'info',
  [ROOM_STATUS.BLOCKED]: 'default',
};

/* ==================== YATAK TİPLERİ ==================== */

export const BED_TYPES: Record<string, BedType> = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TWIN: 'twin',
  KING: 'king',
};

export const BED_TYPE_LABELS: Record<string, string> = {
  [BED_TYPES.SINGLE]: 'Tek Kişilik',
  [BED_TYPES.DOUBLE]: 'Çift Kişilik',
  [BED_TYPES.TWIN]: 'İki Tek Yataklı',
  [BED_TYPES.KING]: 'King Size',
};

/* ==================== REZERVASYON DURUMLARI ==================== */

export const RESERVATION_STATUS: Record<string, ReservationStatus> = {
  PENDING: 'pending',         // Beklemede
  CONFIRMED: 'confirmed',     // Onaylandı
  CHECKED_IN: 'checked_in',   // Check-in yapıldı
  CHECKED_OUT: 'checked_out', // Check-out yapıldı
  CANCELLED: 'cancelled',     // İptal edildi
  NO_SHOW: 'no_show',        // Gelmedi
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  [RESERVATION_STATUS.PENDING]: 'Beklemede',
  [RESERVATION_STATUS.CONFIRMED]: 'Onaylandı',
  [RESERVATION_STATUS.CHECKED_IN]: 'Giriş Yapıldı',
  [RESERVATION_STATUS.CHECKED_OUT]: 'Çıkış Yapıldı',
  [RESERVATION_STATUS.CANCELLED]: 'İptal',
  [RESERVATION_STATUS.NO_SHOW]: 'Gelmedi',
};

export const RESERVATION_STATUS_COLORS: Record<string, ChipColor> = {
  [RESERVATION_STATUS.PENDING]: 'warning',
  [RESERVATION_STATUS.CONFIRMED]: 'success',
  [RESERVATION_STATUS.CHECKED_IN]: 'info',
  [RESERVATION_STATUS.CHECKED_OUT]: 'default',
  [RESERVATION_STATUS.CANCELLED]: 'error',
  [RESERVATION_STATUS.NO_SHOW]: 'secondary',
};

/* ==================== REZERVASYON FİLTRE PRESET'LERİ ==================== */

export const RESERVATION_FILTERS: Record<string, string> = {
  TODAY_CHECKIN: 'today_checkin',
  TODAY_CHECKOUT: 'today_checkout',
  TODAY_CHECKED_OUT: 'today_checked_out',
  TOMORROW_CHECKIN: 'tomorrow_checkin',
  UNPAID_CHECKOUT: 'unpaid_checkout',
};

export const RESERVATION_FILTER_LABELS: Record<string, string> = {
  [RESERVATION_FILTERS.TODAY_CHECKIN]: 'Bugün Girecekler',
  [RESERVATION_FILTERS.TODAY_CHECKOUT]: 'Bugün Çıkacaklar',
  [RESERVATION_FILTERS.TODAY_CHECKED_OUT]: 'Bugün Çıkanlar',
  [RESERVATION_FILTERS.TOMORROW_CHECKIN]: 'Yarın Girecekler',
  [RESERVATION_FILTERS.UNPAID_CHECKOUT]: 'Çıkış Yapıp Ödeme Yapmayanlar',
};

/* ==================== ÖDEME DURUMLARI ==================== */

export const PAYMENT_STATUS: Record<string, PaymentStatus> = {
  UNPAID: 'unpaid',     // Ödenmedi
  PARTIAL: 'partial',   // Kısmi ödeme
  PAID: 'paid',         // Tam ödeme
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.UNPAID]: 'Ödenmedi',
  [PAYMENT_STATUS.PARTIAL]: 'Kısmi Ödeme',
  [PAYMENT_STATUS.PAID]: 'Ödendi',
};

export const PAYMENT_STATUS_COLORS: Record<string, ChipColor> = {
  [PAYMENT_STATUS.UNPAID]: 'error',
  [PAYMENT_STATUS.PARTIAL]: 'warning',
  [PAYMENT_STATUS.PAID]: 'success',
};

/* ==================== REZERVASYON KAYNAKLARI ==================== */

export const RESERVATION_SOURCES: Record<string, ReservationSource> = {
  WALKIN: 'walkin',
  PHONE: 'phone',
  WEB: 'web',
  OTA: 'ota',
};

export const RESERVATION_SOURCE_LABELS: Record<string, string> = {
  [RESERVATION_SOURCES.WALKIN]: 'Walk-in',
  [RESERVATION_SOURCES.PHONE]: 'Telefon',
  [RESERVATION_SOURCES.WEB]: 'Web',
  [RESERVATION_SOURCES.OTA]: 'OTA',
};

/* ==================== FOLİO KATEGORİLERİ ==================== */

export const FOLIO_CATEGORIES: Record<string, FolioCategory> = {
  ROOM_CHARGE: 'room_charge',
  MINIBAR: 'minibar',
  RESTAURANT: 'restaurant',
  SERVICE: 'service',
  DISCOUNT: 'discount',
  PAYMENT: 'payment',
};

export const FOLIO_CATEGORY_LABELS: Record<string, string> = {
  [FOLIO_CATEGORIES.ROOM_CHARGE]: 'Oda Ücreti',
  [FOLIO_CATEGORIES.MINIBAR]: 'Minibar',
  [FOLIO_CATEGORIES.RESTAURANT]: 'Restoran/Kafe',
  [FOLIO_CATEGORIES.SERVICE]: 'Ek Hizmet',
  [FOLIO_CATEGORIES.DISCOUNT]: 'İndirim',
  [FOLIO_CATEGORIES.PAYMENT]: 'Ödeme',
};

/* ==================== MANZARA TİPLERİ ==================== */

export const VIEW_TYPES: Record<string, ViewType> = {
  SEA: 'sea',
  CITY: 'city',
  GARDEN: 'garden',
  NONE: 'none',
};

export const VIEW_TYPE_LABELS: Record<string, string> = {
  [VIEW_TYPES.SEA]: 'Deniz Manzarası',
  [VIEW_TYPES.CITY]: 'Şehir Manzarası',
  [VIEW_TYPES.GARDEN]: 'Bahçe Manzarası',
  [VIEW_TYPES.NONE]: 'Manzara Yok',
};

/* ==================== ODA ÖZELLİKLERİ ==================== */

export const ROOM_FEATURES: RoomFeature[] = [
  { value: 'balcony', label: 'Balkon' },
  { value: 'minibar', label: 'Minibar' },
  { value: 'bathtub', label: 'Küvet' },
  { value: 'safe', label: 'Kasa' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'tv', label: 'TV' },
  { value: 'aircon', label: 'Klima' },
  { value: 'hairdryer', label: 'Saç Kurutma' },
  { value: 'iron', label: 'Ütü' },
  { value: 'coffee', label: 'Çay/Kahve Seti' },
  { value: 'jacuzzi', label: 'Jakuzi' },
  { value: 'terrace', label: 'Teras' },
];

/* ==================== MENÜ YAPISI ==================== */

/**
 * Sidebar menü yapısı
 * Her menü öğesi için hangi rollerin erişebileceği belirtilir.
 * icon: MUI Icons bileşen adı (Sidebar'da import edilir)
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'Dashboard',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'base',
  },
  {
    id: 'rooms',
    label: 'Oda Yönetimi',
    path: '/rooms',
    icon: 'Hotel',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'base',
    children: [
      { id: 'room-list', label: 'Oda Listesi', path: '/rooms' },
      { id: 'room-settings', label: 'Oda Tipi Ayarları', path: '/rooms/settings' },
    ],
  },
  {
    id: 'reservations',
    label: 'Rezervasyonlar',
    path: '/reservations',
    icon: 'BookOnline',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'base',
    children: [
      { id: 'reservation-list', label: 'Rezervasyon Listesi', path: '/reservations' },
      { id: 'reservation-chart', label: 'Rezervasyon Çizelgesi', path: '/reservations/chart' },
    ],
  },
  {
    id: 'guests',
    label: 'Müşteriler',
    path: '/guests',
    icon: 'People',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'base',
    children: [
      { id: 'guest-list', label: 'Müşteri Listesi', path: '/guests' },
      { id: 'companies', label: 'Firmalar', path: '/guests/companies' },
    ],
  },
  {
    id: 'invoices',
    label: 'Faturalar',
    path: '/invoices',
    icon: 'Receipt',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'invoices',
    children: [
      { id: 'invoice-sales', label: 'Satış Faturaları', path: '/invoices/sales' },
      { id: 'invoice-purchase', label: 'Alış Faturaları', path: '/invoices/purchase' },
      { id: 'invoice-return', label: 'İade Faturaları', path: '/invoices/return' },
      { id: 'invoice-incoming', label: 'Gelen Faturalar', path: '/invoices/incoming' },
    ],
  },
  {
    id: 'minibar',
    label: 'Minibar / Stok',
    path: '/minibar',
    icon: 'LocalBar',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.MINIBAR],
    module: 'minibar',
    children: [
      { id: 'stock-management', label: 'Stok Yönetimi', path: '/minibar/stock' },
    ],
  },
  {
    id: 'users',
    label: 'Eleman Yönetimi',
    path: '/users',
    icon: 'AdminPanelSettings',
    roles: [ROLES.PATRON],
    module: 'staff',
  },
  {
    id: 'reports',
    label: 'Raporlar',
    path: '/reports',
    icon: 'Assessment',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'base',
    children: [
      { id: 'daily-report', label: 'Günlük Özet', path: '/reports/daily' },
      { id: 'room-report', label: 'Oda Raporu', path: '/reports/rooms' },
      { id: 'company-report', label: 'Firma Raporu', path: '/reports/companies' },
      { id: 'general-report', label: 'Genel Rapor', path: '/reports/general' },
      { id: 'night-audit-report', label: 'Gün Sonu Raporları', path: '/reports/night-audit' },
      { id: 'fixed-expenses', label: 'Sabit Giderler', path: '/reports/fixed-expenses', roles: [ROLES.PATRON, ROLES.MANAGER] },
    ],
  },
  {
    id: 'hotel-management',
    label: 'Otel Yönetimi',
    path: '/hotel-management',
    icon: 'Business',
    roles: [ROLES.PATRON, ROLES.MANAGER],
    module: 'base',
  },
  {
    id: 'integrations',
    label: 'Entegrasyonlar',
    path: '/integrations',
    icon: 'Extension',
    roles: [ROLES.PATRON, ROLES.MANAGER],
    module: 'invoices',
    children: [
      { id: 'parasut', label: 'Paraşüt e-Fatura', path: '/integrations/parasut' },
    ],
  },
  {
    id: 'kbs',
    label: 'KBS',
    path: '/kbs',
    icon: 'Badge',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION],
    module: 'kbs',
    children: [
      { id: 'kbs-records', label: 'KBS Kayıtları', path: '/kbs' },
      { id: 'kbs-settings', label: 'KBS Ayarları', path: '/kbs/settings' },
    ],
  },
  {
    id: 'cameras',
    label: 'Kameralar',
    path: '/cameras',
    icon: 'Videocam',
    roles: [ROLES.PATRON, ROLES.MANAGER],
    module: 'cameras',
  },
  {
    id: 'bms',
    label: 'Bina Yönetimi',
    path: '/bms',
    icon: 'SettingsRemote',
    roles: [ROLES.PATRON, ROLES.MANAGER],
    bmsOnly: true,
  },
  {
    id: 'restaurant',
    label: 'Restoran / Kafe',
    path: '/tables',
    icon: 'Storefront',
    roles: [ROLES.PATRON, ROLES.MANAGER, ROLES.CHEF, ROLES.WAITER, ROLES.RESTAURANT_MANAGER, ROLES.CASHIER, ROLES.BARISTA, ROLES.BARMAN, ROLES.RECEPTION],
    module: 'restaurant',
    children: [
      { id: 'tables', label: 'Masa Yönetimi', path: '/tables' },
      { id: 'menu', label: 'Menü', path: '/menu' },
      { id: 'adisyonlar', label: 'Adisyonlar', path: '/adisyonlar' },
      { id: 'kitchen', label: 'Mutfak Ekranı', path: '/kitchen' },
      { id: 'kasa', label: 'Kasa', path: '/kasa' },
    ],
  },
  {
    id: 'shift-handover',
    label: 'Mesai Devir',
    path: '/shift-handover',
    icon: 'SwapHoriz',
    roles: [ROLES.RECEPTION],
    module: 'staff',
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    path: '/settings',
    icon: 'Settings',
    roles: [ROLES.PATRON, ROLES.MANAGER],
    module: 'base',
  },
];

/* ==================== FATURA ==================== */

/** Fatura türü */
export type InvoiceType = 'sales' | 'purchase' | 'return' | 'incoming';

/** Fatura durumu */
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

/** Fatura müşteri türü */
export type InvoiceCustomerType = 'individual' | 'company';

/** Fatura kalemi kategorisi */
export type InvoiceItemCategory = 'konaklama' | 'yiyecek' | 'icecek' | 'minibar' | 'hizmet' | 'diger';

/** Fatura kalemi */
export interface InvoiceItem {
  id: number;
  category: InvoiceItemCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** Fatura */
export interface Invoice {
  id: number;
  invoiceNo: string;
  type: InvoiceType;
  date: string;
  dueDate?: string;
  customerType: InvoiceCustomerType;
  customerName: string;
  taxNumber?: string;
  address?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  relatedRoomId?: number;
  relatedCompanyId?: number;
  createdBy?: string;
  createdAt: string;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  sales: 'Satış Faturası',
  purchase: 'Alış Faturası',
  return: 'İade Faturası',
  incoming: 'Gelen Fatura',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Taslak',
  issued: 'Kesildi',
  paid: 'Ödendi',
  cancelled: 'İptal',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, ChipColor> = {
  draft: 'default',
  issued: 'info',
  paid: 'success',
  cancelled: 'error',
};

export const INVOICE_ITEM_CATEGORY_LABELS: Record<InvoiceItemCategory, string> = {
  konaklama: 'Konaklama',
  yiyecek: 'Yiyecek',
  icecek: 'İçecek',
  minibar: 'Minibar',
  hizmet: 'Hizmet',
  diger: 'Diğer',
};

/* ==================== MESAİ DEVİR ==================== */

export interface ShiftHandover {
  id: number;
  date: string;
  fromEmployeeId: number;
  toEmployeeId: number;
  fromUser: string;
  toUser: string;
  startTime: string;
  endTime?: string;
  cardSales: number;
  cashSales: number;
  totalSales: number;
  roomsSold: number;
  roomsOccupied?: number;
  roomsAvailable?: number;
  notes?: string;
  status: 'active' | 'closed';
  createdAt?: string;
}

/* ==================== GÜN SONU (NIGHT AUDIT) ==================== */

/** Gün sonu detay satırı */
export interface NightAuditDetail {
  roomId: number;
  roomNumber: string;
  guestName: string;
  amount: number;
}

/** Gün sonu işlem logu */
export interface NightAuditLog {
  id: number;
  date: string;
  roomsCharged: number;
  totalAmount: number;
  processedBy: string;
  processedAt: string;
  details: NightAuditDetail[];
}

/* ==================== OTEL YÖNETİMİ ==================== */

/** Otel belgesi (base64 encoded) */
export interface HotelDocument {
  id: number;
  name: string;
  type: string;
  data: string;
  uploadedAt: string;
}

/** Otel görseli (base64 encoded) */
export interface HotelImage {
  id: number;
  name: string;
  data: string;
  uploadedAt: string;
}

/** Otel bilgileri */
export interface HotelInfo {
  name: string;
  address: string;
  businessLicense?: HotelDocument;
  taxCertificate?: HotelDocument;
  tourismLicense?: HotelDocument;
  images: HotelImage[];
  updatedAt: string;
}

/* ==================== ONLINE REZERVASYON KANALI ==================== */

/** Kanal oda tipi */
export type ChannelRoomType = 'standard' | 'deluxe' | 'suite' | 'family' | 'economy';

/** Kanal oda tipi görseli */
export interface ChannelRoomImage {
  id: number;
  name: string;
  data: string;
}

/** Online kanal oda tipi konfigürasyonu */
export interface ChannelRoomConfig {
  id: number;
  roomType: ChannelRoomType;
  totalRooms: number;
  openQuota: number;
  features: string[];
  description: string;
  pricePerNight: number;
  validUntil: string;
  reservationsOpen: boolean;
  images: ChannelRoomImage[];
  createdAt: string;
  updatedAt: string;
}

/** Online rezervasyon kanal ayarları */
export interface ReservationChannelSettings {
  isActive: boolean;
  roomConfigs: ChannelRoomConfig[];
  updatedAt: string;
}

export const CHANNEL_ROOM_TYPES: Record<string, ChannelRoomType> = {
  STANDARD: 'standard',
  DELUXE: 'deluxe',
  SUITE: 'suite',
  FAMILY: 'family',
  ECONOMY: 'economy',
};

export const CHANNEL_ROOM_TYPE_LABELS: Record<ChannelRoomType, string> = {
  standard: 'Standart',
  deluxe: 'Deluxe',
  suite: 'Suite',
  family: 'Aile Odası',
  economy: 'Ekonomik',
};

/** Kanal için ek oda özellikleri */
export const CHANNEL_EXTRA_FEATURES: RoomFeature[] = [
  { value: 'smoking', label: 'Sigara İçilir' },
  { value: 'breakfast', label: 'Kahvaltı Dahil' },
  { value: 'room_service', label: 'Oda Servisi' },
  { value: 'parking', label: 'Ücretsiz Otopark' },
];

/* ==================== STORAGE KEYS ==================== */

export const GUESTS_STORAGE_KEY = 'grandhotel_guests';
export const COMPANIES_STORAGE_KEY = 'grandhotel_companies';
export const FOLIOS_STORAGE_KEY = 'grandhotel_folios';
export const STAY_HISTORY_STORAGE_KEY = 'grandhotel_stay_history';
export const SHIFTS_STORAGE_KEY = 'grandhotel_shifts';
export const INVOICES_STORAGE_KEY = 'grandhotel_invoices';
export const NIGHT_AUDIT_STORAGE_KEY = 'grandhotel_night_audit';
export const HOTEL_INFO_STORAGE_KEY = 'grandhotel_hotel_info';
export const CHANNEL_SETTINGS_STORAGE_KEY = 'grandhotel_channel_settings';

/** Sayfa başına varsayılan kayıt sayısı */
export const DEFAULT_PAGE_SIZE = 25;

/** Tarih formatı (dayjs uyumlu) */
export const DATE_FORMAT = 'DD.MM.YYYY';

/** Tarih + saat formatı */
export const DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Para birimi */
export const CURRENCY = 'TRY';

/** Para birimi simgesi */
export const CURRENCY_SYMBOL = '₺';

/** Uygulama adı */
export const APP_NAME = 'GrandHotel PMS';

/** API base URL (env'den alınır) */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

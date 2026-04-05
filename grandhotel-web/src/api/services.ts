/**
 * GrandHotel PMS — Merkezi API Servisleri
 *
 * Tüm backend API çağrıları bu dosyada tanımlıdır.
 * Axios instance'ı (axiosConfig.ts) kullanılır.
 *
 * Kullanım:
 *   import { roomsApi, guestsApi } from '../api/services';
 *   const rooms = await roomsApi.getAll();
 */

import api from './axiosConfig';

/* ==================== TİPLER ==================== */

/** Backend RoomSerializer çıktısı */
export interface ApiRoom {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: string;
  status: string;
  guestName: string | null;
  guests: ApiRoomGuest[];
  reservationId: number | null;
  reservationNotes: string | null;
  reservationCheckIn: string | null;
  reservationCheckOut: string | null;
  reservationStaffName: string | null;
  reservationStatus: string | null;
  reservationOwnerName: string | null;
  beds: { type: string }[];
  notes: string | null;
  minibar?: ApiRoomMinibarItem[];
}

export interface ApiRoomMinibarItem {
  productId: number;
  productName: string;
  placed: number;
  remaining: number;
  consumed: number;
  price: string;
}

export interface ApiStockItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  isMinibar: boolean;
  minibarPrice?: string | null;
  createdAt: string;
}

export interface ApiMinibarProduct {
  id: number;
  name: string;
  price: string;
  unit: string;
  totalStock: number;
  inMinibar: number;
  sold: number;
  availableStock: number;
}

export interface ApiMinibarRoomItem {
  id: number;
  roomId: number;
  roomNumber: string;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  placedBy: string;
  placedAt: string;
}

export interface ApiRoomGuest {
  guestId: number;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string | null;
  isActive: boolean;
}

export interface ApiGuest {
  id: number;
  tcNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  companyId?: number | null;
  isBlocked?: boolean;
  createdAt?: string;
}

export interface ApiCompany {
  id: number;
  name: string;
  taxNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface ApiReservation {
  id: number;
  roomId: number;
  roomNumber: string;
  companyId: number | null;
  companyName: string | null;
  checkIn: string;
  checkOut: string | null;
  guestNames: string | null;
  guestCount: number;
  status: string;
  notes: string;
  totalAmount: string;
  paidAmount: string;
  isActive: boolean;
  createdByStaff: string | null;
}

export interface ApiReservationDetail extends ApiReservation {
  stays: ApiStay[];
  folioItems: ApiFolioItem[];
}

export interface ApiStay {
  id: number;
  guestId: number;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string | null;
  isActive: boolean;
}

export interface ApiFolioItem {
  id: number;
  reservationId: number;
  guestId?: number | null;
  category: string;
  description: string;
  amount: number | string;
  date: string;
  createdBy?: string | null;
  createdAt?: string;
}

export interface ApiHotelDocument {
  id: number;
  docType: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ApiHotelImage {
  id: number;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ApiHotel {
  id: number | null;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  status: string;
  rejectionReason: string;
  roomCount: number;
  businessLicense: ApiHotelDocument | null;
  taxCertificate: ApiHotelDocument | null;
  tourismLicense: ApiHotelDocument | null;
  images: ApiHotelImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKbsResult {
  guestName: string;
  tcNo: string;
  status: 'checked_in' | 'failed';
  kbsReference: string;
  message: string;
}

export interface ApiKbsSendResponse {
  roomNumber: string;
  results: ApiKbsResult[];
}

export interface ApiKbsRecord {
  id: number;
  roomId: number;
  roomNumber: string;
  guestName: string;
  tcNo: string;
  status: string;
  systemType?: 'egm' | 'jandarma';
  kbsReference: string;
  sentAt: string;
  checkoutAt: string | null;
  createdAt: string;
}

export interface ApiKbsSettings {
  systemType: 'egm' | 'jandarma';
  facilityCode: string;
  username: string;
  password: string;
  serviceUrl: string;
  isActive: boolean;
}

export interface ApiAuditLog {
  id: number;
  roomId: number;
  action: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

/* ==================== ROOMS API ==================== */

export const roomsApi = {
  getAll: () =>
    api.get<ApiRoom[]>('/rooms/').then((r) => r.data),

  getById: (id: number) =>
    api.get<ApiRoom>(`/rooms/${id}/`).then((r) => r.data),

  checkIn: (roomId: number, body: { guestId: number; notes?: string; checkOut?: string }) =>
    api.post<ApiRoom>(`/rooms/${roomId}/check_in/`, body).then((r) => r.data),

  checkOut: (roomId: number, body?: { guestId?: number }) =>
    api.post<ApiRoom>(`/rooms/${roomId}/check_out/`, body || {}).then((r) => r.data),

  addGuest: (roomId: number, guestId: number) =>
    api.post<ApiRoom>(`/rooms/${roomId}/add_guest/`, { guestId }).then((r) => r.data),

  updateStatus: (roomId: number, status: string) =>
    api.post<ApiRoom>(`/rooms/${roomId}/update_status/`, { status }).then((r) => r.data),

  updateNotes: (roomId: number, notes: string) =>
    api.post<ApiRoom>(`/rooms/${roomId}/update_notes/`, { notes }).then((r) => r.data),

  /** Odanın gecelik ücretini güncelle */
  updatePrice: (roomId: number, price: number) =>
    api.patch<ApiRoom>(`/rooms/${roomId}/`, { price: String(price) }).then((r) => r.data),

  /** Oda taşıma — misafirleri ve rezervasyonu hedef odaya aktar */
  moveGuests: (fromRoomId: number, toRoomId: number) =>
    api.post<ApiRoom>(`/rooms/${fromRoomId}/move/`, { toRoomId }).then((r) => r.data),

  /** Misafiri odadan çıkar */
  removeGuest: (roomId: number, guestId: number) =>
    api.post<ApiRoom>(`/rooms/${roomId}/remove_guest/`, { guestId }).then((r) => r.data),

  /** Checkout iptal — odayı tekrar occupied yap */
  revertCheckout: (roomId: number) =>
    api.post<ApiRoom>(`/rooms/${roomId}/revert_checkout/`).then((r) => r.data),

  create: (data: { roomNumber: string; bedType: string; floor: number; capacity: number; view: string; price: number; beds?: { type: string }[] }) =>
    api.post<ApiRoom>('/rooms/', {
      roomNumber: data.roomNumber,
      bedType: data.bedType,
      floor: data.floor,
      capacity: data.capacity,
      view: data.view,
      price: data.price,
      status: 'available',
      beds: data.beds || [],
    }).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiRoom>(`/rooms/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/rooms/${id}/`),
};

/* ==================== GUESTS API ==================== */

export const guestsApi = {
  getAll: () =>
    api.get<ApiGuest[]>('/guests/').then((r) => r.data),

  search: (q: string) =>
    api.get<ApiGuest[]>(`/guests/search/?q=${encodeURIComponent(q)}`).then((r) => r.data),

  create: (data: { tcNo: string; firstName: string; lastName: string; phone: string; email?: string; companyId?: number | null }) =>
    api.post<ApiGuest>('/guests/', data).then((r) => r.data),

  update: (id: number, data: Partial<ApiGuest>) =>
    api.put<ApiGuest>(`/guests/${id}/`, data).then((r) => r.data),

  toggleBlock: (id: number) =>
    api.post<ApiGuest>(`/guests/${id}/toggle_block/`).then((r) => r.data),

  stayHistory: (id: number) =>
    api.get<ApiReservation[]>(`/guests/${id}/stay_history/`).then((r) => r.data),
};

/* ==================== COMPANIES API ==================== */

export const companiesApi = {
  getAll: () =>
    api.get<ApiCompany[]>('/companies/').then((r) => r.data),

  create: (data: { name: string; taxNumber?: string; address?: string; phone?: string; email?: string }) =>
    api.post<ApiCompany>('/companies/', data).then((r) => r.data),

  update: (id: number, data: Partial<ApiCompany>) =>
    api.put<ApiCompany>(`/companies/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/companies/${id}/`),

  getGuests: (id: number) =>
    api.get<ApiGuest[]>(`/companies/${id}/guests/`).then((r) => r.data),

  /** Borçlu firmalar listesi (bakiye > 0) */
  getDebtors: () =>
    api.get<any[]>('/companies/debtors/').then((r) => r.data),

  /** Firma borç detayı (rezervasyonlar + folio kalemleri) */
  getDebtDetail: (id: number) =>
    api.get<any>(`/companies/${id}/debt_detail/`).then((r) => r.data),

  /** Firmaya ödeme ekle (borç kapat) */
  addPayment: (companyId: number, data: { reservationId: number; amount: number; description?: string; staffName?: string }) =>
    api.post<any>(`/companies/${companyId}/add_payment/`, data).then((r) => r.data),
};

/* ==================== RESERVATIONS API ==================== */

export const reservationsApi = {
  /** Rezervasyon listesi (çoklu filtre desteği) */
  getAll: (filters?: {
    roomId?: number; guestId?: number; companyId?: number;
    isActive?: boolean; status?: string;
    dateFrom?: string; dateTo?: string;
    filter?: string; search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.roomId) params.append('roomId', String(filters.roomId));
    if (filters?.guestId) params.append('guestId', String(filters.guestId));
    if (filters?.companyId) params.append('companyId', String(filters.companyId));
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.filter) params.append('filter', filters.filter);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return api.get<ApiReservation[]>(`/reservations/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** Rezervasyon detayı (misafirler + folio) */
  getById: (id: number) =>
    api.get<ApiReservationDetail>(`/reservations/${id}/`).then((r) => r.data),

  /** Yeni rezervasyon oluştur (check-in yapmadan) */
  create: (data: {
    roomId: number; guestId: number;
    checkIn: string; checkOut?: string;
    notes?: string; staffName?: string; companyId?: number;
  }) =>
    api.post<ApiReservation>('/reservations/', data).then((r) => r.data),

  /** Rezervasyon iptal */
  cancel: (id: number) =>
    api.post<ApiReservation>(`/reservations/${id}/cancel/`).then((r) => r.data),

  /** Rezervasyon güncelle */
  update: (id: number, data: {
    roomId?: number;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
    companyId?: number | null;
    totalAmount?: number;
  }) =>
    api.put<ApiReservation>(`/reservations/${id}/`, data).then((r) => r.data),

  /** Rezerve → Check-in dönüşümü */
  checkIn: (id: number) =>
    api.post<ApiReservation>(`/reservations/${id}/check_in/`).then((r) => r.data),

  /** Check-in iptal — checked_in → reserved geri dön */
  revertCheckin: (id: number) =>
    api.post<ApiReservation>(`/reservations/${id}/revert_checkin/`).then((r) => r.data),
};

/* ==================== FOLIOS API ==================== */

export const foliosApi = {
  getForReservation: (reservationId: number) =>
    api.get<ApiFolioItem[]>(`/folios/?reservationId=${reservationId}`).then((r) => r.data),

  getForRoom: (roomId: number) =>
    api.get<ApiFolioItem[]>(`/folios/?roomId=${roomId}`).then((r) => r.data),

  create: (data: { reservationId: number; guestId?: number | null; category: string; description: string; amount: number; date: string; createdBy?: string }) =>
    api.post<ApiFolioItem>('/folios/', data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/folios/${id}/`),
};

/* ==================== REPORTS API ==================== */

export const reportsApi = {
  company: (id: number, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<any>(`/reports/company/${id}/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  guest: (id: number, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<any>(`/reports/guest/${id}/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  room: (id: number, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<any>(`/reports/room/${id}/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
};

/* ==================== KAZANÇ (GELİR) API ==================== */

export interface DashboardStats {
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    dirtyRooms: number;
    maintenanceRooms: number;
    blockedRooms: number;
    occupancyRate: number;
    singleRooms: number;
    doubleRooms: number;
  };
  revenue: {
    dailyRevenue: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    monthlyGrowthPercent: number;
    dailyPayments: number;
    monthlyPayments: number;
    monthlyBalance: number;
  };
  todayCheckins: { guest: string; room: string; time: string }[];
  todayCheckouts: { guest: string; room: string; time: string }[];
}

export interface NightAuditPreviewRoom {
  roomId: number;
  roomNumber: string;
  guestName: string;
  price: number;
  checkIn: string | null;
  nights: number;
  companyName: string | null;
  reservationId: number;
}

export interface NightAuditNoShowRoom {
  reservationId: number;
  roomId: number;
  roomNumber: string;
  guestName: string;
  checkIn: string | null;
  companyName: string | null;
}

export interface NightAuditPreviewResponse {
  date: string;
  alreadyProcessed: boolean;
  occupiedRooms: NightAuditPreviewRoom[];
  totalCharge: number;
  roomCount: number;
  noShowRooms: NightAuditNoShowRoom[];
  noShowCount: number;
}

export interface NightAuditExecuteResponse {
  date: string;
  processedRooms: number;
  skippedRooms: number;
  totalCharged: number;
  details: { roomNumber: string; guestName: string; amount: number; companyName: string | null }[];
  noShowCount: number;
  noShowCancelled: number;
}

export const kazancApi = {
  /** Dashboard özet istatistikler (doluluk + ciro + check-in/out) */
  dashboardStats: () =>
    api.get<DashboardStats>('/kazanc/dashboard-stats/').then((r) => r.data),

  /** Gelir detay (kategori + oda tipi bazlı) */
  revenueBreakdown: (filters?: { month?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<any>(`/kazanc/revenue-breakdown/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** Günlük özet */
  dailySummary: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return api.get<any>(`/kazanc/daily-summary/${qs}`).then((r) => r.data);
  },

  /** Gün sonu önizleme — konaklayan odalar + no-show tespiti */
  nightAuditPreview: () =>
    api.get<NightAuditPreviewResponse>('/kazanc/night-audit-preview/').then((r) => r.data),

  /** Gün sonu uygula — oda ücretlerini folio'ya yaz + rapor kaydet */
  nightAuditExecute: (processedBy?: string) =>
    api.post<NightAuditExecuteResponse>('/kazanc/night-audit/', { processedBy }).then((r) => r.data),

  /** No-show rezervasyon iptal et */
  cancelNoShow: (reservationId: number) =>
    api.post<{ reservationId: number; status: string; roomNumber: string }>(
      '/kazanc/night-audit-cancel-noshow/', { reservationId }
    ).then((r) => r.data),

  /** Otomatik gün sonu saatini getir */
  getNightAuditSchedule: () =>
    api.get<{ nightAuditTime: string | null; enabled: boolean }>(
      '/kazanc/night-audit-schedule/'
    ).then((r) => r.data),

  /** Otomatik gün sonu saatini ayarla (null = kapat) */
  setNightAuditSchedule: (time: string | null) =>
    api.post<{ nightAuditTime: string | null; enabled: boolean }>(
      '/kazanc/night-audit-schedule/',
      { time }
    ).then((r) => r.data),

  /** Geçmiş gün sonu raporları */
  nightAuditReports: (filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<any[]>(`/kazanc/night-audit-reports/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** Gelişmiş kazanç raporu (çoklu filtreleme) */
  advancedReport: (filters?: {
    dateFrom?: string; dateTo?: string;
    bedTypes?: string; companyOnly?: boolean; individualOnly?: boolean;
    categories?: string; includeDebtors?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.bedTypes) params.append('bedTypes', filters.bedTypes);
    if (filters?.companyOnly) params.append('companyOnly', 'true');
    if (filters?.individualOnly) params.append('individualOnly', 'true');
    if (filters?.categories) params.append('categories', filters.categories);
    if (filters?.includeDebtors) params.append('includeDebtors', 'true');
    const qs = params.toString();
    return api.get<any>(`/kazanc/advanced-report/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
};

/* ==================== STAFF (PERSONEL) API ==================== */

export interface ApiEmployee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  password: string;
  staffNumber: string;
  hireDate: string;
  status: string;
  roles: string[];
  roleLabels: string[];
  enabledModules?: string[];
  branchCode?: string;
  hotelId?: number;
  hotelName?: string;
  salary?: number | string | null;
  annualLeaveEntitlement: number;
  usedAnnualLeave: number;
  remainingAnnualLeave: number;
  isOnLeaveToday: boolean;
  hasWeeklyLeaveThisWeek: boolean;
  createdAt: string;
  isBmsAdmin?: boolean;
}

export interface ApiTaskAssignment {
  id: number;
  employeeId: number;
  employeeName: string;
  isCompleted: boolean;
  completedAt: string | null;
  note: string;
  assignedAt: string;
}

export interface ApiTask {
  id: number;
  title: string;
  description: string;
  createdById: number;
  createdByName: string;
  assigneeNames: string | null;
  assigneeCount: number;
  completedCount: number;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  assignments?: ApiTaskAssignment[];
}

export const staffApi = {
  getAll: (filters?: { status?: string; role?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return api.get<ApiEmployee[]>(`/staff/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  getById: (id: number) =>
    api.get<ApiEmployee>(`/staff/${id}/`).then((r) => r.data),

  create: (data: {
    firstName: string; lastName: string; phone: string; password: string;
    staffNumber: string; hireDate: string; roles: string[];
  }) =>
    api.post<ApiEmployee>('/staff/', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiEmployee>(`/staff/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/staff/${id}/`),

  login: (data: { branchCode: string; staffNumber: string; password: string }) =>
    api.post<ApiEmployee>('/staff/login/', data).then((r) => r.data),

  me: (staffNumber: string) =>
    api.get<ApiEmployee>(`/staff/me/?staffNumber=${staffNumber}`).then((r) => r.data),

  roles: () =>
    api.get<{ value: string; label: string }[]>('/staff/roles/').then((r) => r.data),

  subordinates: (id: number) =>
    api.get<ApiEmployee[]>(`/staff/${id}/subordinates/`).then((r) => r.data),
};

/* ==================== TASKS (GÖREV) API ==================== */

export const tasksApi = {
  getAll: (filters?: { assignee?: number; createdBy?: number; status?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.assignee) params.append('assignee', String(filters.assignee));
    if (filters?.createdBy) params.append('createdBy', String(filters.createdBy));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    const qs = params.toString();
    return api.get<ApiTask[]>(`/tasks/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  getById: (id: number) =>
    api.get<ApiTask>(`/tasks/${id}/`).then((r) => r.data),

  create: (data: {
    title: string; description?: string; createdById: number;
    assigneeIds: number[]; priority?: string; dueDate?: string;
  }) =>
    api.post<ApiTask>('/tasks/', data).then((r) => r.data),

  complete: (id: number, data: { employeeId: number; note?: string }) =>
    api.post<ApiTask>(`/tasks/${id}/complete/`, data).then((r) => r.data),

  cancel: (id: number) =>
    api.post<ApiTask>(`/tasks/${id}/cancel/`).then((r) => r.data),
};

/* ==================== LEAVES (İZİN) API ==================== */

export interface ApiLeave {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
  deductFromAnnual: boolean;
  note: string;
  approvedById: number | null;
  approvedByName: string | null;
  createdAt: string;
}

export const leavesApi = {
  getAll: (filters?: { employeeId?: number; leaveType?: string; status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters?.leaveType) params.append('leaveType', filters.leaveType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<ApiLeave[]>(`/leaves/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  create: (data: {
    employeeId: number; leaveType: string; startDate: string; endDate: string;
    deductFromAnnual?: boolean; note?: string; approvedById?: number;
  }) =>
    api.post<ApiLeave>('/leaves/', data).then((r) => r.data),

  cancel: (id: number) =>
    api.post<ApiLeave>(`/leaves/${id}/cancel/`).then((r) => r.data),

  getForEmployee: (employeeId: number) =>
    api.get<ApiLeave[]>(`/staff/${employeeId}/leaves/`).then((r) => r.data),
};

/* ==================== STOCK API ==================== */

export const stockApi = {
  getAll: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return api.get<ApiStockItem[]>(`/stock/${qs}`).then((r) => r.data);
  },

  create: (data: { name: string; category: string; unit: string; quantity: number; isMinibar?: boolean; minibarPrice?: number }) =>
    api.post<ApiStockItem>('/stock/', data).then((r) => r.data),

  update: (id: number, data: Partial<{ name: string; category: string; unit: string; quantity: number; isMinibar: boolean; minibarPrice: number }>) =>
    api.put<ApiStockItem>(`/stock/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/stock/${id}/`),
};

/* ==================== MINIBAR API ==================== */

export const minibarApi = {
  /** Aktif minibar ürünleri + stok bilgisi */
  getProducts: () =>
    api.get<ApiMinibarProduct[]>('/minibar/products/').then((r) => r.data),

  /** Odanın minibar içeriği */
  getRoomItems: (roomId: number) =>
    api.get<ApiMinibarRoomItem[]>(`/minibar/rooms/${roomId}/`).then((r) => r.data),

  /** Minibara ürün ekle */
  addToRoom: (roomId: number, data: { productId: number; quantity: number; staffName?: string }) =>
    api.post<ApiMinibarRoomItem>(`/minibar/rooms/${roomId}/add/`, data).then((r) => r.data),

  /** Minibardan çıkar (iade) */
  removeFromRoom: (roomId: number, data: { productId: number; quantity: number }) =>
    api.post(`/minibar/rooms/${roomId}/remove/`, data),

  /** Tüketim + folio charge */
  consume: (roomId: number, data: { productId: number; quantity: number; staffName?: string }) =>
    api.post<{ folioItem: ApiFolioItem }>(`/minibar/rooms/${roomId}/consume/`, data).then((r) => r.data),
};

/* ==================== AUDIT LOG API ==================== */

export const auditApi = {
  /** Denetim logu kaydet */
  create: (data: { roomId: number; action: string; description: string; performedBy: string }) =>
    api.post<ApiAuditLog>('/audit-logs/', data).then((r) => r.data),

  /** Odanın denetim loglarını getir */
  getByRoom: (roomId: number) =>
    api.get<ApiAuditLog[]>(`/rooms/${roomId}/audit-logs/`).then((r) => r.data),
};

/* ==================== KBS API ==================== */

export const kbsApi = {
  /** Odadaki misafirleri KBS'ye bildir */
  send: (roomId: number) =>
    api.post<ApiKbsSendResponse>(`/kbs/send/${roomId}/`).then((r) => r.data),

  /** Manuel KBS çıkışı */
  checkout: (roomId: number) =>
    api.post(`/kbs/checkout/${roomId}/`),

  /** KBS kayıt listesi */
  getRecords: (filters?: { status?: string; roomId?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.roomId) params.append('roomId', String(filters.roomId));
    const qs = params.toString();
    return api.get<ApiKbsRecord[]>(`/kbs/records/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** KBS ayarlarını getir */
  getSettings: () =>
    api.get<ApiKbsSettings>('/kbs/settings/').then((r) => r.data),

  /** KBS ayarlarını güncelle */
  updateSettings: (data: Partial<ApiKbsSettings>) =>
    api.put<ApiKbsSettings>('/kbs/settings/', data).then((r) => r.data),
};

/* ==================== HOTEL API ==================== */

export const hotelApi = {
  /** Otel bilgilerini getir */
  get: () =>
    api.get<ApiHotel>('/hotel/').then((r) => r.data),

  /** Otel bilgilerini güncelle */
  update: (data: Partial<{ name: string; address: string; phone: string; email: string; taxNumber: string }>) =>
    api.put<ApiHotel>('/hotel/', data).then((r) => r.data),

  /** Belge yükle */
  uploadDocument: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post<ApiHotelDocument>('/hotel/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  /** Belge sil */
  deleteDocument: (id: number) =>
    api.delete(`/hotel/documents/${id}/`),

  /** Görsel yükle */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiHotelImage>('/hotel/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  /** Görsel sil */
  deleteImage: (id: number) =>
    api.delete(`/hotel/images/${id}/`),

  /** Modül bilgilerini getir */
  getModules: () =>
    api.get('/hotel/modules/').then((r) => r.data),

  /** Modülleri güncelle */
  updateModules: (data: { enabledModules: string[] }) =>
    api.put('/hotel/modules/', data).then((r) => r.data),
};

/* ==================== MENÜ API ==================== */

export interface ApiMenuCategory {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  items?: ApiMenuItem[];
}

export interface ApiMenuItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: string;
  image: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export const menuApi = {
  /** Kategori listesi */
  getCategories: () =>
    api.get<ApiMenuCategory[]>('/menu-categories/').then((r) => r.data),

  /** Kategori detayı (ürünlerle) */
  getCategoryById: (id: number) =>
    api.get<ApiMenuCategory>(`/menu-categories/${id}/`).then((r) => r.data),

  /** Kategori oluştur */
  createCategory: (data: { name: string; sortOrder?: number }) =>
    api.post<ApiMenuCategory>('/menu-categories/', data).then((r) => r.data),

  /** Kategori güncelle */
  updateCategory: (id: number, data: Partial<ApiMenuCategory>) =>
    api.patch<ApiMenuCategory>(`/menu-categories/${id}/`, data).then((r) => r.data),

  /** Kategori sil */
  deleteCategory: (id: number) =>
    api.delete(`/menu-categories/${id}/`),

  /** Ürün listesi */
  getItems: (filters?: { categoryId?: number; isAvailable?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', String(filters.categoryId));
    if (filters?.isAvailable !== undefined) params.append('isAvailable', String(filters.isAvailable));
    const qs = params.toString();
    return api.get<ApiMenuItem[]>(`/menu-items/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** Ürün oluştur */
  createItem: (data: FormData) =>
    api.post<ApiMenuItem>('/menu-items/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  /** Ürün güncelle */
  updateItem: (id: number, data: FormData | Record<string, unknown>) =>
    api.patch<ApiMenuItem>(`/menu-items/${id}/`, data).then((r) => r.data),

  /** Ürün sil */
  deleteItem: (id: number) =>
    api.delete(`/menu-items/${id}/`),

  /** Public menü (QR kod) */
  getPublicMenu: () =>
    api.get<ApiMenuCategory[]>('/menu/public/').then((r) => r.data),
};

/* ==================== ADİSYON (TAB) API ==================== */

export interface ApiTabItem {
  id: number;
  menuItemId: number | null;
  stockItemId: number | null;
  menuItemName: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  createdAt: string;
}

export interface ApiTab {
  id: number;
  tabNo: string;
  reservationId: number | null;
  roomId: number | null;
  roomNumber: string | null;
  tableId: number | null;
  tableNumber: string | null;
  guestName: string;
  servicePoint: string;
  status: string;
  openedById: number | null;
  openedByName: string | null;
  closedByName: string | null;
  totalAmount: string;
  paymentMethod: string | null;
  notes: string;
  openedAt: string;
  closedAt: string | null;
  paidAt: string | null;
  items?: ApiTabItem[];
}

export const tabsApi = {
  /** Adisyon listesi */
  getAll: (filters?: {
    status?: string; roomId?: number; servicePoint?: string;
    dateFrom?: string; dateTo?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.roomId) params.append('roomId', String(filters.roomId));
    if (filters?.servicePoint) params.append('servicePoint', filters.servicePoint);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<ApiTab[]>(`/tabs/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  /** Adisyon detayı (kalemlerle) */
  getById: (id: number) =>
    api.get<ApiTab>(`/tabs/${id}/`).then((r) => r.data),

  /** Yeni adisyon aç */
  create: (data: {
    roomId?: number; guestName: string;
    servicePoint: string; openedById?: number; notes?: string;
  }) =>
    api.post<ApiTab>('/tabs/', data).then((r) => r.data),

  /** Kalem ekle */
  addItem: (tabId: number, data: {
    menuItemId?: number; stockItemId?: number;
    description?: string; quantity: number; unitPrice: number; notes?: string;
  }) =>
    api.post<ApiTabItem>(`/tabs/${tabId}/add_item/`, data).then((r) => r.data),

  /** Kalem adeti güncelle */
  updateItem: (tabId: number, itemId: number, quantity: number) =>
    api.post<ApiTabItem>(`/tabs/${tabId}/update_item/`, { itemId, quantity }).then((r) => r.data),

  /** Kalem sil */
  removeItem: (tabId: number, itemId: number) =>
    api.post(`/tabs/${tabId}/remove_item/`, { itemId }).then((r) => r.data),

  /** Adisyonu kapat */
  close: (tabId: number, closedById?: number) =>
    api.post<ApiTab>(`/tabs/${tabId}/close/`, { closedById }).then((r) => r.data),

  /** Ödeme yap */
  pay: (tabId: number, paymentMethod: 'room_charge' | 'cash' | 'card', registerId?: number, roomId?: number) =>
    api.post<ApiTab>(`/tabs/${tabId}/pay/`, { paymentMethod, registerId, roomId }).then((r) => r.data),

  /** İptal */
  cancel: (tabId: number) =>
    api.post<ApiTab>(`/tabs/${tabId}/cancel/`).then((r) => r.data),

  /** Adisyon böl */
  split: (tabId: number, itemIds: number[], guestName?: string) =>
    api.post(`/tabs/${tabId}/split/`, { itemIds, guestName }).then((r) => r.data),

  /** İade */
  refund: (tabId: number, reason?: string) =>
    api.post<ApiTab>(`/tabs/${tabId}/refund/`, { reason }).then((r) => r.data),
};

/* ──────────────────────────────────────────────────────────
   SHIFT HANDOVER (Mesai Devir)
   ────────────────────────────────────────────────────────── */

export const shiftApi = {
  /** Tüm mesai kayıtları */
  getAll: (params?: { status?: string; date?: string }) =>
    api.get('/shifts/', { params }).then((r) => r.data),

  /** Aktif mesaiyi getir */
  getActive: () =>
    api.get('/shifts/active/').then((r) => r.data),

  /** Mesai devret */
  create: (data: { fromEmployeeId: number; toEmployeeId: number; notes?: string }) =>
    api.post('/shifts/', data).then((r) => r.data),

  /** Mesai kapat */
  close: (id: number, data: { cardSales?: number; cashSales?: number; notes?: string }) =>
    api.post(`/shifts/${id}/close/`, data).then((r) => r.data),

  /** Mesai detayı */
  getById: (id: number) =>
    api.get(`/shifts/${id}/`).then((r) => r.data),
};

/* ==================== CAMERA API ==================== */

export interface ApiCamera {
  id: number;
  name: string;
  location: string;
  streamUrl: string;
  snapshotUrl?: string;
  status: 'online' | 'offline';
  type: string;
  order: number;
}

export const cameraApi = {
  /** Tüm kameraları getir */
  getAll: () =>
    api.get<ApiCamera[]>('/cameras/').then((r) => r.data),

  /** Kamera ekle */
  create: (data: { name: string; location: string; streamUrl: string; snapshotUrl?: string; type?: string; order?: number }) =>
    api.post<ApiCamera>('/cameras/', data).then((r) => r.data),

  /** Kamera güncelle */
  update: (id: number, data: Partial<ApiCamera>) =>
    api.put<ApiCamera>(`/cameras/${id}/`, data).then((r) => r.data),

  /** Kamera sil */
  delete: (id: number) =>
    api.delete(`/cameras/${id}/`),
};

/* ==================== RESTORAN / CAFE API ==================== */

/* --- Service Area --- */

export interface ApiServiceArea {
  id: number;
  name: string;
  areaType: string;
  isActive: boolean;
  hasKitchen: boolean;
  printerName: string;
  tableCount: number;
  createdAt: string;
}

export const serviceAreasApi = {
  getAll: () =>
    api.get<ApiServiceArea[]>('/service-areas/').then((r) => r.data),
  create: (data: { name: string; areaType: string; hasKitchen?: boolean }) =>
    api.post<ApiServiceArea>('/service-areas/', data).then((r) => r.data),
  update: (id: number, data: Partial<ApiServiceArea>) =>
    api.patch<ApiServiceArea>(`/service-areas/${id}/`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete(`/service-areas/${id}/`),
};

/* --- Table (Masa) --- */

export interface ApiTable {
  id: number;
  tableNumber: string;
  serviceAreaId: number;
  serviceAreaName: string;
  capacity: number;
  status: string;
  isActive: boolean;
  positionX: number;
  positionY: number;
  qrToken: string;
  currentTabId: number | null;
  currentTotal: string;
  createdAt: string;
  currentTab?: ApiTab;
}

export const tablesApi = {
  getAll: (filters?: { serviceAreaId?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.serviceAreaId) params.append('serviceAreaId', String(filters.serviceAreaId));
    if (filters?.status) params.append('status', filters.status);
    const qs = params.toString();
    return api.get<ApiTable[]>(`/tables/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
  getById: (id: number) =>
    api.get<ApiTable>(`/tables/${id}/`).then((r) => r.data),
  create: (data: { tableNumber: string; serviceAreaId: number; capacity?: number }) =>
    api.post<ApiTable>('/tables/', data).then((r) => r.data),
  update: (id: number, data: Partial<ApiTable>) =>
    api.patch<ApiTable>(`/tables/${id}/`, data).then((r) => r.data),
  delete: (id: number) =>
    api.delete(`/tables/${id}/`),
  open: (id: number, data: { guestName?: string; openedById?: number }) =>
    api.post<ApiTab>(`/tables/${id}/open/`, data).then((r) => r.data),
  /** Masaya direkt ürün ekle (tab yoksa otomatik oluşur) */
  addItem: (tableId: number, data: { menuItemId: number; quantity: number; notes?: string; openedById?: number }) =>
    api.post(`/tables/${tableId}/add_item/`, data).then((r) => r.data),
  close: (id: number) =>
    api.post<ApiTable>(`/tables/${id}/close/`).then((r) => r.data),
  transfer: (id: number, toTableId: number) =>
    api.post(`/tables/${id}/transfer/`, { toTableId }).then((r) => r.data),
};

/* --- Kitchen / Order Items --- */

export interface ApiOrderItemStatus {
  id: number;
  tabItemId: number;
  itemDescription: string;
  itemQuantity: number;
  itemUnitPrice: string;
  tabId: number;
  tabNo: string;
  tableNumber: string | null;
  roomNumber: string | null;
  servicePoint: string;
  guestName: string;
  status: string;
  notes: string;
  sentToKitchenAt: string;
  startedAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  preparedByName: string | null;
}

export interface ApiKitchenSummary {
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  cancelled: number;
  total: number;
}

export const kitchenApi = {
  getOrders: (filters?: { status?: string; serviceAreaId?: number; tabId?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.serviceAreaId) params.append('serviceAreaId', String(filters.serviceAreaId));
    if (filters?.tabId) params.append('tabId', String(filters.tabId));
    const qs = params.toString();
    return api.get<ApiOrderItemStatus[]>(`/order-items/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
  startPreparing: (id: number, preparedById?: number) =>
    api.post<ApiOrderItemStatus>(`/order-items/${id}/start/`, { preparedById }).then((r) => r.data),
  markReady: (id: number) =>
    api.post<ApiOrderItemStatus>(`/order-items/${id}/ready/`).then((r) => r.data),
  markServed: (id: number) =>
    api.post<ApiOrderItemStatus>(`/order-items/${id}/serve/`).then((r) => r.data),
  cancelItem: (id: number, reason?: string) =>
    api.post<ApiOrderItemStatus>(`/order-items/${id}/cancel/`, { reason }).then((r) => r.data),
  getSummary: () =>
    api.get<ApiKitchenSummary>('/order-items/kitchen-summary/').then((r) => r.data),
};

/* --- Cash Register (Kasa) --- */

export interface ApiCashRegister {
  id: number;
  name: string;
  registerType: string;
  serviceAreaId: number | null;
  serviceAreaName: string | null;
  status: string;
  openedByName: string | null;
  closedByName: string | null;
  openingBalance: string;
  closingBalance: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  todayTotals: {
    cash: string;
    card: string;
    roomCharge: string;
    expense: string;
    total: string;
  };
}

export interface ApiCashTransaction {
  id: number;
  registerId: number;
  tabId: number | null;
  tabNo: string | null;
  transactionType: string;
  amount: string;
  description: string;
  processedByName: string | null;
  createdAt: string;
}

export interface ApiCashSummary {
  date: string;
  registerName: string;
  status: string;
  openingBalance: string;
  closingBalance: string | null;
  cashSales: string;
  cardSales: string;
  roomChargeSales: string;
  totalSales: string;
  expenses: string;
  expectedCash: string;
  actualCash: string | null;
  difference: string | null;
  transactionCount: number;
}

export const kasaApi = {
  getAll: () =>
    api.get<ApiCashRegister[]>('/cash-registers/').then((r) => r.data),
  create: (data: { name: string; registerType: string; serviceAreaId?: number }) =>
    api.post<ApiCashRegister>('/cash-registers/', data).then((r) => r.data),
  open: (id: number, data: { openingBalance: number; openedById?: number }) =>
    api.post<ApiCashRegister>(`/cash-registers/${id}/open/`, data).then((r) => r.data),
  close: (id: number, data: { closingBalance: number; closedById?: number }) =>
    api.post<ApiCashRegister>(`/cash-registers/${id}/close/`, data).then((r) => r.data),
  getSummary: (id: number) =>
    api.get<ApiCashSummary>(`/cash-registers/${id}/summary/`).then((r) => r.data),
  getTransactions: (id: number, filters?: { dateFrom?: string; dateTo?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.type) params.append('type', filters.type);
    const qs = params.toString();
    return api.get<ApiCashTransaction[]>(`/cash-registers/${id}/transactions/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },
  addExpense: (id: number, data: { amount: number; description: string; processedById?: number }) =>
    api.post<ApiCashTransaction>(`/cash-registers/${id}/add-expense/`, data).then((r) => r.data),
};

/* --- QR Sipariş (Public, auth olmadan) --- */

export interface ApiQRMenu {
  table: { id: number; tableNumber: string; serviceArea: string };
  categories: Array<{
    id: number;
    name: string;
    items: Array<{
      id: number;
      name: string;
      description: string;
      price: string;
      imageUrl: string | null;
    }>;
  }>;
}

export const qrApi = {
  getMenu: (token: string) =>
    api.get<ApiQRMenu>(`/restaurant/qr/${token}/menu/`).then((r) => r.data),
  placeOrder: (token: string, data: { guestName?: string; items: Array<{ menuItemId: number; quantity: number; notes?: string }> }) =>
    api.post(`/restaurant/qr/${token}/order/`, data).then((r) => r.data),
  getStatus: (token: string) =>
    api.get(`/restaurant/qr/${token}/status/`).then((r) => r.data),
  getRoomMenu: (roomNumber: string) =>
    api.get(`/restaurant/qr/room/${roomNumber}/menu/`).then((r) => r.data),
  placeRoomOrder: (roomNumber: string, data: { items: Array<{ menuItemId: number; quantity: number; notes?: string }> }) =>
    api.post(`/restaurant/qr/room/${roomNumber}/order/`, data).then((r) => r.data),
};

/* ==================== COMMISSION API ==================== */

export interface CommissionSettingsData {
  isActive: boolean;
  minAmount: string;
  commissionRate: string;
}

export interface CommissionItem {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  tabNo: string;
  tableNumber: string;
  tabTotal: string;
  commissionRate: string;
  commissionAmount: string;
  date: string;
}

export interface MyCommissionsData {
  totalEarned: string;
  totalSales: string;
  count: number;
  items: CommissionItem[];
}

export const commissionApi = {
  getSettings: () =>
    api.get<CommissionSettingsData>('/commission/settings/').then((r) => r.data),

  updateSettings: (data: Partial<CommissionSettingsData>) =>
    api.put<CommissionSettingsData>('/commission/settings/', data).then((r) => r.data),

  getList: (filters?: { employeeId?: number; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', String(filters.employeeId));
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString();
    return api.get<CommissionItem[]>(`/commission/list/${qs ? '?' + qs : ''}`).then((r) => r.data);
  },

  getMy: (staffNumber: string, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams({ staffNumber });
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    return api.get<MyCommissionsData>(`/commission/my/?${params.toString()}`).then((r) => r.data);
  },
};

/* ==================== BMS (Bina Yönetim Sistemi) ==================== */

export interface BmsDevice {
  id: number;
  room: number;
  roomNumber: string;
  name: string;
  deviceType: 'light' | 'hvac' | 'curtain' | 'power_meter';
  status: 'online' | 'offline' | 'error';
  currentState: Record<string, unknown>;
  lastSeen: string | null;
  createdAt: string;
}

export interface BmsAlert {
  id: number;
  device: number;
  deviceName: string;
  roomNumber: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface BmsEnergyReading {
  id: number;
  room: number;
  roomNumber: string;
  timestamp: string;
  kwh: string;
  costEstimate: string;
}

export const bmsApi = {
  getDevices: () =>
    api.get<BmsDevice[]>('/bms/devices/').then((r) => r.data),

  getRoomDevices: (roomId: number) =>
    api.get<BmsDevice[]>(`/bms/rooms/${roomId}/devices/`).then((r) => r.data),

  sendCommand: (roomId: number, deviceId: number, command: Record<string, unknown>) =>
    api.post<BmsDevice>(`/bms/rooms/${roomId}/command/`, { deviceId, command }).then((r) => r.data),

  getRoomEnergy: (roomId: number) =>
    api.get<BmsEnergyReading[]>(`/bms/rooms/${roomId}/energy/`).then((r) => r.data),

  getAlerts: () =>
    api.get<BmsAlert[]>('/bms/alerts/').then((r) => r.data),
};

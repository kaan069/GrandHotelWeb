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
  createdAt: string;
  minibarPrice?: string | null;
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
  }) => {
    const params = new URLSearchParams();
    if (filters?.roomId) params.append('roomId', String(filters.roomId));
    if (filters?.guestId) params.append('guestId', String(filters.guestId));
    if (filters?.companyId) params.append('companyId', String(filters.companyId));
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
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

  /** Gün sonu önizleme — hangi odalara ücret yansıyacak */
  nightAuditPreview: () =>
    api.get<any>('/kazanc/night-audit-preview/').then((r) => r.data),

  /** Gün sonu uygula — oda ücretlerini folio'ya yaz */
  nightAuditExecute: () =>
    api.post<any>('/kazanc/night-audit/').then((r) => r.data),

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
  annualLeaveEntitlement: number;
  usedAnnualLeave: number;
  remainingAnnualLeave: number;
  isOnLeaveToday: boolean;
  hasWeeklyLeaveThisWeek: boolean;
  createdAt: string;
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

  login: (data: { staffNumber: string; password: string }) =>
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

  create: (data: { name: string; category: string; unit: string; quantity: number; price?: number }) =>
    api.post<ApiStockItem>('/stock/', data).then((r) => r.data),

  update: (id: number, data: Partial<{ name: string; category: string; unit: string; quantity: number; price: number }>) =>
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

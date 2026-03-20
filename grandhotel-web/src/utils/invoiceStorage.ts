/**
 * GrandHotel PMS - Fatura localStorage Yönetimi
 */

import {
  Invoice,
  InvoiceType,
  INVOICES_STORAGE_KEY,
} from './constants';

/* ==================== MOCK VERİLER ==================== */

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNo: 'FTR-2026-001',
    type: 'sales',
    date: '2026-03-01',
    customerType: 'company',
    customerName: 'ABC Turizm A.Ş.',
    taxNumber: '1234567890',
    address: 'İstanbul, Beyoğlu',
    items: [
      { id: 1, category: 'konaklama', description: '3 Gece Konaklama - Oda 201', quantity: 3, unitPrice: 1800, amount: 5400 },
      { id: 2, category: 'yiyecek', description: 'Kahvaltı (3 gün)', quantity: 3, unitPrice: 250, amount: 750 },
    ],
    subtotal: 6150,
    taxRate: 20,
    taxAmount: 1230,
    total: 7380,
    status: 'paid',
    relatedCompanyId: 1,
    createdBy: 'Ayşe Kaya',
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    invoiceNo: 'FTR-2026-002',
    type: 'sales',
    date: '2026-03-05',
    customerType: 'individual',
    customerName: 'Mehmet Kaya',
    items: [
      { id: 1, category: 'konaklama', description: '2 Gece Konaklama - Oda 303', quantity: 2, unitPrice: 900, amount: 1800 },
      { id: 2, category: 'minibar', description: 'Minibar Tüketimi', quantity: 1, unitPrice: 350, amount: 350 },
    ],
    subtotal: 2150,
    taxRate: 20,
    taxAmount: 430,
    total: 2580,
    status: 'issued',
    createdBy: 'Ayşe Kaya',
    createdAt: '2026-03-05',
  },
  {
    id: 3,
    invoiceNo: 'FTR-2026-003',
    type: 'purchase',
    date: '2026-03-08',
    customerType: 'company',
    customerName: 'Deniz Ticaret Ltd.',
    taxNumber: '5555666677',
    address: 'İzmir, Konak',
    items: [
      { id: 1, category: 'yiyecek', description: 'Mutfak Malzemesi Alımı', quantity: 1, unitPrice: 8500, amount: 8500 },
    ],
    subtotal: 8500,
    taxRate: 20,
    taxAmount: 1700,
    total: 10200,
    status: 'paid',
    relatedCompanyId: 3,
    createdBy: 'Ahmet Yılmaz',
    createdAt: '2026-03-08',
  },
];

/* ==================== FATURA İŞLEMLERİ ==================== */

const loadAllInvoices = (): Invoice[] => {
  try {
    const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* varsayılan döndür */ }
  return DEFAULT_INVOICES;
};

export const loadInvoices = (type?: InvoiceType): Invoice[] => {
  const all = loadAllInvoices();
  if (type) return all.filter((inv) => inv.type === type);
  return all;
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
};

const generateInvoiceNo = (invoices: Invoice[]): string => {
  const year = new Date().getFullYear();
  const yearInvoices = invoices.filter((inv) => inv.invoiceNo.includes(`FTR-${year}`));
  const nextNum = yearInvoices.length + 1;
  return `FTR-${year}-${nextNum.toString().padStart(3, '0')}`;
};

export const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNo' | 'createdAt'>): Invoice => {
  const invoices = loadAllInvoices();
  const newInvoice: Invoice = {
    ...invoice,
    id: invoices.length > 0 ? Math.max(...invoices.map((i) => i.id)) + 1 : 1,
    invoiceNo: generateInvoiceNo(invoices),
    createdAt: new Date().toISOString().split('T')[0],
  };
  invoices.push(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
};

export const updateInvoice = (id: number, updates: Partial<Invoice>): Invoice | null => {
  const invoices = loadAllInvoices();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) return null;
  invoices[index] = { ...invoices[index], ...updates };
  saveInvoices(invoices);
  return invoices[index];
};

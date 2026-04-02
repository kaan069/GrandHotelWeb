/**
 * GrandHotel PMS - Route Tanımları
 *
 * Uygulamanın tüm sayfa yönlendirmeleri burada tanımlanır.
 * React Router v6 kullanılır.
 */

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

/* Layout */
import { MainLayout } from '../components/layout';

/* Route koruyucusu */
import ProtectedRoute from './ProtectedRoute';

/* Sayfalar - Lazy loading ile yüklenir (performans için) */
const Login = React.lazy(() => import('../pages/auth/Login'));
const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'));
const RoomList = React.lazy(() => import('../pages/rooms/RoomList'));
const RoomSettings = React.lazy(() => import('../pages/rooms/RoomSettings'));
const RoomEdit = React.lazy(() => import('../pages/rooms/RoomEdit'));
const ReservationList = React.lazy(() => import('../pages/reservations/ReservationList'));
const ReservationChart = React.lazy(() => import('../pages/reservations/ReservationChart'));
const EmployeeList = React.lazy(() => import('../pages/users/EmployeeList'));
const GuestList = React.lazy(() => import('../pages/guests/GuestList'));
const CompanyList = React.lazy(() => import('../pages/guests/CompanyList'));
const ShiftHandover = React.lazy(() => import('../pages/shift/ShiftHandover'));
const InvoiceList = React.lazy(() => import('../pages/invoices/InvoiceList'));
const HotelManagement = React.lazy(() => import('../pages/hotel-management/HotelManagement'));
const DailyReport = React.lazy(() => import('../pages/reports/DailyReport'));
const RoomReport = React.lazy(() => import('../pages/reports/RoomReport'));
const CompanyReport = React.lazy(() => import('../pages/reports/CompanyReport'));
const GeneralReport = React.lazy(() => import('../pages/reports/GeneralReport'));
const NightAuditReport = React.lazy(() => import('../pages/reports/NightAuditReport'));
const StockManagement = React.lazy(() => import('../pages/minibar/StockManagement'));

const MenuManagement = React.lazy(() => import('../pages/menu/MenuManagement'));
const AdisyonList = React.lazy(() => import('../pages/adisyon/AdisyonList'));
const KbsRecords = React.lazy(() => import('../pages/kbs/KbsRecords'));
const CameraView = React.lazy(() => import('../pages/cameras/CameraView'));
const ParasutIntegration = React.lazy(() => import('../pages/integrations/ParasutIntegration'));

/* Public Booking Sayfaları */
const BookingLayout = React.lazy(() => import('../components/booking/BookingLayout'));
const BookingHome = React.lazy(() => import('../pages/booking/BookingHome'));
const BookingHotelDetail = React.lazy(() => import('../pages/booking/BookingHotelDetail'));

/**
 * Geçici placeholder sayfa.
 */
const ComingSoon: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h2 style={{ color: '#64748B', fontWeight: 500 }}>Bu sayfa yakında eklenecek</h2>
    <p style={{ color: '#94A3B8' }}>Geliştirme devam ediyor...</p>
  </div>
);

/**
 * 404 sayfası.
 */
const NotFound: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h1 style={{ fontSize: '4rem', color: '#E2E8F0', fontWeight: 700 }}>404</h1>
    <h2 style={{ color: '#64748B', fontWeight: 500 }}>Sayfa Bulunamadı</h2>
    <p style={{ color: '#94A3B8' }}>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
  </div>
);

/**
 * Router yapısı
 */
const router = createBrowserRouter([
  /* === Public Route'lar === */
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<div>Yükleniyor...</div>}>
        <Login />
      </React.Suspense>
    ),
  },

  /* === Public Booking Sitesi === */
  {
    path: '/booking',
    element: (
      <React.Suspense fallback={<div>Yükleniyor...</div>}>
        <BookingLayout />
      </React.Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={null}>
            <BookingHome />
          </React.Suspense>
        ),
      },
      {
        path: 'hotel/:hotelId',
        element: (
          <React.Suspense fallback={null}>
            <BookingHotelDetail />
          </React.Suspense>
        ),
      },
    ],
  },

  /* === Korumalı Route'lar (giriş yapmış tüm kullanıcılar) === */
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          {
            path: '/dashboard',
            element: (
              <React.Suspense fallback={null}>
                <Dashboard />
              </React.Suspense>
            ),
          },
          {
            path: '/rooms',
            element: (
              <React.Suspense fallback={null}>
                <RoomList />
              </React.Suspense>
            ),
          },
          {
            path: '/rooms/settings',
            element: (
              <React.Suspense fallback={null}>
                <RoomSettings />
              </React.Suspense>
            ),
          },
          {
            path: '/rooms/new',
            element: (
              <React.Suspense fallback={null}>
                <RoomSettings />
              </React.Suspense>
            ),
          },
          {
            path: '/rooms/:id',
            element: (
              <React.Suspense fallback={null}>
                <RoomEdit />
              </React.Suspense>
            ),
          },
          {
            path: '/reservations',
            element: (
              <React.Suspense fallback={null}>
                <ReservationList />
              </React.Suspense>
            ),
          },
          {
            path: '/reservations/chart',
            element: (
              <React.Suspense fallback={null}>
                <ReservationChart />
              </React.Suspense>
            ),
          },
          { path: '/reservations/new', element: <ComingSoon /> },
          { path: '/reservations/:id', element: <ComingSoon /> },
          {
            path: '/guests',
            element: (
              <React.Suspense fallback={null}>
                <GuestList />
              </React.Suspense>
            ),
          },
          {
            path: '/guests/companies',
            element: (
              <React.Suspense fallback={null}>
                <CompanyList />
              </React.Suspense>
            ),
          },
          { path: '/guests/:id', element: <ComingSoon /> },
          {
            path: '/invoices/sales',
            element: (
              <React.Suspense fallback={null}>
                <InvoiceList />
              </React.Suspense>
            ),
          },
          {
            path: '/invoices/purchase',
            element: (
              <React.Suspense fallback={null}>
                <InvoiceList />
              </React.Suspense>
            ),
          },
          {
            path: '/invoices/return',
            element: (
              <React.Suspense fallback={null}>
                <InvoiceList />
              </React.Suspense>
            ),
          },
          {
            path: '/invoices/incoming',
            element: (
              <React.Suspense fallback={null}>
                <InvoiceList />
              </React.Suspense>
            ),
          },
          { path: '/reports/daily', element: <React.Suspense fallback={<div>Yükleniyor...</div>}><DailyReport /></React.Suspense> },
          { path: '/reports/rooms', element: <React.Suspense fallback={<div>Yükleniyor...</div>}><RoomReport /></React.Suspense> },
          { path: '/reports/companies', element: <React.Suspense fallback={<div>Yükleniyor...</div>}><CompanyReport /></React.Suspense> },
          { path: '/reports/general', element: <React.Suspense fallback={<div>Yükleniyor...</div>}><GeneralReport /></React.Suspense> },
          { path: '/reports/night-audit', element: <React.Suspense fallback={<div>Yükleniyor...</div>}><NightAuditReport /></React.Suspense> },
          {
            path: '/shift-handover',
            element: (
              <React.Suspense fallback={null}>
                <ShiftHandover />
              </React.Suspense>
            ),
          },
          {
            path: '/minibar/stock',
            element: (
              <React.Suspense fallback={null}>
                <StockManagement />
              </React.Suspense>
            ),
          },
          {
            path: '/kbs',
            element: (
              <React.Suspense fallback={null}>
                <KbsRecords />
              </React.Suspense>
            ),
          },
          {
            path: '/cameras',
            element: (
              <React.Suspense fallback={null}>
                <CameraView />
              </React.Suspense>
            ),
          },
          {
            path: '/menu',
            element: (
              <React.Suspense fallback={null}>
                <MenuManagement />
              </React.Suspense>
            ),
          },
          {
            path: '/adisyonlar',
            element: (
              <React.Suspense fallback={null}>
                <AdisyonList />
              </React.Suspense>
            ),
          },
          { path: '/settings', element: <ComingSoon /> },
        ],
      },
    ],
  },

  /* === Sadece Patron ve Müdür erişebilen route'lar === */
  {
    element: <ProtectedRoute allowedRoles={['patron', 'manager']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/users',
            element: (
              <React.Suspense fallback={null}>
                <EmployeeList />
              </React.Suspense>
            ),
          },
          {
            path: '/hotel-management',
            element: (
              <React.Suspense fallback={null}>
                <HotelManagement />
              </React.Suspense>
            ),
          },
          {
            path: '/integrations/parasut',
            element: (
              <React.Suspense fallback={null}>
                <ParasutIntegration />
              </React.Suspense>
            ),
          },
        ],
      },
    ],
  },

  /* === 404 === */
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;

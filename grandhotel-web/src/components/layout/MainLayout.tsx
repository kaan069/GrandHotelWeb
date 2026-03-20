/**
 * MainLayout Bileşeni
 *
 * Uygulamanın ana düzen yapısını oluşturur.
 * Sidebar, Header ve sayfa içeriğini bir arada tutar.
 *
 * Yapı:
 * ┌──────────┬──────────────────────────┐
 * │          │        Header            │
 * │ Sidebar  ├──────────────────────────┤
 * │          │      Breadcrumb          │
 * │          │      Page Content        │
 * │          │      (Outlet)            │
 * └──────────┴──────────────────────────┘
 *
 * React Router <Outlet> ile alt route'ların içeriği otomatik render edilir.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import Sidebar from './Sidebar';
import Header, { TAB_BAR_HEIGHT } from './Header';
import Breadcrumb from './Breadcrumb';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, HEADER_HEIGHT } from '../../utils/constants';
import { TabProvider, useHeaderTabs } from '../../contexts/TabContext';

/** İç layout - TabContext'e erişim gerektiği için ayrı bileşen */
const MainLayoutInner: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { tabs } = useHeaderTabs();
  const hasTabs = tabs.length > 0;

  /* Sidebar açık/kapalı durumu - Desktop'ta varsayılan açık */
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(!isMobile);

  /** Sidebar'ı aç/kapa */
  const handleSidebarToggle = (): void => {
    setSidebarOpen((prev) => !prev);
  };

  /* İçerik alanının sol marjını hesapla (sidebar genişliğine göre) */
  const contentMarginLeft = isMobile
    ? 0
    : sidebarOpen
      ? SIDEBAR_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH;

  const topOffset = hasTabs ? HEADER_HEIGHT + TAB_BAR_HEIGHT : HEADER_HEIGHT;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {/* Sol menü */}
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />

      {/* Sağ taraf: Header + İçerik */}
      <Box
        component="main"
        sx={{
          width: `calc(100% - ${contentMarginLeft}px)`,
          ml: `${contentMarginLeft}px`,
          transition: 'margin-left 0.2s ease, width 0.2s ease',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Üst çubuk */}
        <Header
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
        />

        {/* Sayfa içeriği */}
        <Box
          sx={{
            mt: `${topOffset}px`,
            p: { xs: 2, md: 3 },
            transition: 'margin-top 0.2s ease',
          }}
        >
          {/* Breadcrumb navigasyonu */}
          <Breadcrumb />

          {/* Alt route'ların içeriği burada render edilir */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

const MainLayout: React.FC = () => (
  <TabProvider>
    <MainLayoutInner />
  </TabProvider>
);

export default MainLayout;

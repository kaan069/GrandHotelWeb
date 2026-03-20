/**
 * GrandHotel PMS - Ana Uygulama Bileşeni
 *
 * Uygulamanın kök bileşenidir.
 * Provider'lar (tema, auth, bildirim) ve router burada birleştirilir.
 *
 * Bileşen hiyerarşisi:
 *   ThemeProvider → AuthProvider → NotificationProvider → RouterProvider
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import theme from './theme';
import router from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

const App: React.FC = () => {
  return (
    /* MUI Tema sağlayıcı */
    <ThemeProvider theme={theme}>
      {/* CSS sıfırlama (normalize) */}
      <CssBaseline />

      {/* Kimlik doğrulama sağlayıcı */}
      <AuthProvider>
        {/* Bildirim (toast) sağlayıcı */}
        <NotificationProvider>
          {/* Sayfa yönlendirme */}
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

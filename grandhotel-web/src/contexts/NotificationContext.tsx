/**
 * NotificationContext - Bildirim Yönetimi Context'i
 *
 * Uygulama genelinde toast/snackbar bildirimleri göstermek için kullanılır.
 * notistack kütüphanesi üzerine kurulmuş kolay kullanımlı wrapper.
 */

import React, { createContext, useCallback, ReactNode } from 'react';
import { SnackbarProvider, useSnackbar, SnackbarKey } from 'notistack';

export interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeSnackbar: (key?: SnackbarKey) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
}

/**
 * İç bileşen - notistack hook'una erişim sağlar.
 */
const NotificationProviderInner: React.FC<ProviderProps> = ({ children }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /** Başarı bildirimi göster */
  const showSuccess = useCallback(
    (message: string) => {
      enqueueSnackbar(message, { variant: 'success' });
    },
    [enqueueSnackbar]
  );

  /** Hata bildirimi göster */
  const showError = useCallback(
    (message: string) => {
      enqueueSnackbar(message, { variant: 'error' });
    },
    [enqueueSnackbar]
  );

  /** Uyarı bildirimi göster */
  const showWarning = useCallback(
    (message: string) => {
      enqueueSnackbar(message, { variant: 'warning' });
    },
    [enqueueSnackbar]
  );

  /** Bilgi bildirimi göster */
  const showInfo = useCallback(
    (message: string) => {
      enqueueSnackbar(message, { variant: 'info' });
    },
    [enqueueSnackbar]
  );

  const value: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeSnackbar,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * NotificationProvider - Bildirim sağlayıcı bileşen.
 */
export const NotificationProvider: React.FC<ProviderProps> = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={4000}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      style={{ marginTop: 56 }}
    >
      <NotificationProviderInner>
        {children}
      </NotificationProviderInner>
    </SnackbarProvider>
  );
};

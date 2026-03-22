/**
 * useNotification Hook'u
 *
 * NotificationContext'e kolay erişim sağlar.
 * Toast/snackbar bildirimleri göstermek için kullanılır.
 *
 * Kullanım:
 *   const { showSuccess, showError } = useNotification();
 *   showSuccess('İşlem başarılı');
 *   showError('Bir hata oluştu');
 *
 * @returns Bildirim fonksiyonları
 */

import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';
import { SnackbarKey } from 'notistack';

/** NotificationContext tarafından sağlanan değerler */

export interface NotificationContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeSnackbar: (key?: SnackbarKey) => void;
}

const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification hook\'u NotificationProvider içinde kullanılmalıdır.'
    );
  }

  return context as NotificationContextValue;
};

export default useNotification;

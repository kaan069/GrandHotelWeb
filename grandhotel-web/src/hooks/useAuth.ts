/**
 * useAuth Hook'u
 *
 * AuthContext'e kolay erişim sağlar.
 * Her bileşende doğrudan context import etmek yerine bu hook kullanılır.
 *
 * Kullanım:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *
 * @returns AuthContext değerleri
 * @throws AuthProvider dışında kullanılırsa hata fırlatır
 */

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth hook\'u AuthProvider içinde kullanılmalıdır. ' +
      'App.js\'de AuthProvider sarmalayıcısını kontrol edin.'
    );
  }

  return context;
};

export default useAuth;

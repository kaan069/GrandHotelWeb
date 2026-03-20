/**
 * usePermission Hook'u
 *
 * Kullanıcının yetki kontrollerini yapmak için kullanılır.
 * Rol bazlı erişim kontrolü (RBAC) bu hook üzerinden yapılır.
 *
 * Kullanım:
 *   const { hasRole, canAccess, isAdmin } = usePermission();
 *
 *   // Belirli bir role sahip mi?
 *   if (hasRole('patron')) { ... }
 *
 *   // Belirli rollerden birine sahip mi?
 *   if (canAccess(['patron', 'manager'])) { ... }
 *
 *   // Ciro/kazanç bilgilerini görebilir mi?
 *   if (canViewFinancials) { ... }
 *
 * @returns Yetki kontrol fonksiyonları
 */

import useAuth from './useAuth';
import { ROLES, type Role } from '../utils/constants';

/** usePermission hook'unun döndürdüğü değerler */
export interface PermissionValues {
  currentRole: Role | null;
  hasRole: (role: Role) => boolean;
  canAccess: (roles: Role[]) => boolean;
  isAdmin: boolean;
  canViewFinancials: boolean;
  canChangePrice: boolean;
  canDeleteRoom: boolean;
  canManageStaff: boolean;
  canManageReservations: boolean;
  canRunNightAudit: boolean;
}

const usePermission = (): PermissionValues => {
  const { user } = useAuth();

  /** Kullanıcının mevcut rolü */
  const currentRole: Role | null = user?.role || null;

  /**
   * Kullanıcının belirtilen role sahip olup olmadığını kontrol eder.
   * @param role - Kontrol edilecek rol
   * @returns
   */
  const hasRole = (role: Role): boolean => {
    return currentRole === role;
  };

  /**
   * Kullanıcının belirtilen rollerden birine sahip olup olmadığını kontrol eder.
   * @param roles - İzin verilen roller dizisi
   * @returns
   */
  const canAccess = (roles: Role[]): boolean => {
    if (!currentRole) return false;
    return roles.includes(currentRole);
  };

  /**
   * Yönetici mi? (Patron veya Müdür)
   * Eleman ekleme, silme, ayar değiştirme gibi işlemler için.
   */
  const isAdmin = hasRole(ROLES.PATRON) || hasRole(ROLES.MANAGER);

  /**
   * Finansal verileri görebilir mi? (Ciro, kazanç, gider)
   * Sadece patron ve müdür görebilir.
   */
  const canViewFinancials = hasRole(ROLES.PATRON) || hasRole(ROLES.MANAGER);

  /**
   * Fiyat değişikliği yapabilir mi?
   * Sadece patron ve müdür yapabilir.
   */
  const canChangePrice = hasRole(ROLES.PATRON) || hasRole(ROLES.MANAGER);

  /**
   * Oda silme yetkisi var mı?
   * Sadece patron ve müdür silebilir.
   */
  const canDeleteRoom = hasRole(ROLES.PATRON) || hasRole(ROLES.MANAGER);

  /**
   * Eleman ekleme/çıkarma yetkisi var mı?
   * Patron tam yetki, müdür ekleme/düzenleme yapabilir.
   */
  const canManageStaff = hasRole(ROLES.PATRON) || hasRole(ROLES.MANAGER);

  /**
   * Rezervasyon oluşturma/düzenleme yetkisi var mı?
   * Patron, müdür ve resepsiyon yapabilir.
   */
  const canManageReservations = canAccess([ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION]);

  /**
   * Gün sonu (night audit) işlemi çalıştırabilir mi?
   * Patron, müdür ve resepsiyon yapabilir.
   */
  const canRunNightAudit = canAccess([ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION]);

  return {
    currentRole,
    hasRole,
    canAccess,
    isAdmin,
    canViewFinancials,
    canChangePrice,
    canDeleteRoom,
    canManageStaff,
    canManageReservations,
    canRunNightAudit,
  };
};

export default usePermission;

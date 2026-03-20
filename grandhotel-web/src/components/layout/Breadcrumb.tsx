/**
 * Breadcrumb Bileşeni
 *
 * Kullanıcının hangi sayfada olduğunu gösteren navigasyon yolu.
 * URL path'ini otomatik olarak Türkçe etiketlere çevirir.
 *
 * Örnek: /reservations/new → Dashboard > Rezervasyonlar > Yeni Rezervasyon
 *
 * Props:
 *   - items (array): Manuel breadcrumb öğeleri [{ label, path }]
 *     Eğer verilmezse, URL'den otomatik oluşturulur.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

/**
 * URL segment'lerini Türkçe etiketlere çevirir.
 * Yeni sayfa eklediğinizde buraya Türkçe karşılığını ekleyin.
 */
const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  rooms: 'Oda Yönetimi',
  reservations: 'Rezervasyonlar',
  guests: 'Müşteriler',
  companies: 'Firmalar',
  users: 'Kullanıcılar',
  reports: 'Raporlar',
  settings: 'Ayarlar',
  new: 'Yeni',
  edit: 'Düzenle',
  detail: 'Detay',
  daily: 'Günlük Özet',
  'check-in': 'Giriş İşlemi',
  'check-out': 'Çıkış İşlemi',
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * URL path'inden breadcrumb öğeleri oluşturur.
   * Örnek: "/reservations/new" → [{ label: "Rezervasyonlar", path: "/reservations" }, { label: "Yeni" }]
   */
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    /* Manuel öğeler verildiyse onları kullan */
    if (items && items.length > 0) {
      return items;
    }

    /* URL path'ini segmentlere ayır */
    const pathSegments = location.pathname.split('/').filter(Boolean);

    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = PATH_LABELS[segment] || segment;
      const isLast = index === pathSegments.length - 1;

      return { label, path, isLast };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  /* Tek segment varsa breadcrumb gösterme */
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
      sx={{ mb: 2 }}
    >
      {/* Her zaman Dashboard linki göster */}
      <Link
        component="button"
        variant="body2"
        underline="hover"
        color="text.secondary"
        onClick={() => navigate('/dashboard')}
        sx={{ cursor: 'pointer' }}
      >
        Dashboard
      </Link>

      {/* Diğer breadcrumb öğeleri */}
      {breadcrumbs.map((crumb, index) => {
        /* Dashboard zaten yukarıda eklendi, tekrar ekleme */
        if (crumb.label === 'Dashboard') return null;

        /* Son öğe tıklanamaz (aktif sayfa) */
        if (crumb.isLast) {
          return (
            <Typography
              key={index}
              variant="body2"
              color="text.primary"
              sx={{ fontWeight: 500 }}
            >
              {crumb.label}
            </Typography>
          );
        }

        /* Ara öğeler tıklanabilir link */
        return (
          <Link
            key={index}
            component="button"
            variant="body2"
            underline="hover"
            color="text.secondary"
            onClick={() => navigate(crumb.path!)}
            sx={{ cursor: 'pointer' }}
          >
            {crumb.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumb;

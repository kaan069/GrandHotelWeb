/**
 * Otel Yönetimi Sayfası
 *
 * İki ana bölüm:
 *   1. Otel Bilgileri: Ad, adres, belgeler, görseller
 *   2. Online Rezervasyon Kanalı: Kanal ayarları ve oda tipi yönetimi
 */

import React from 'react';
import { Box } from '@mui/material';

import { PageHeader } from '../../components/common';
import { HotelInfoSection, ReservationChannelSection, CheckinPolicySettings } from '../../components/hotel-management';
import CommissionSettings from '../../components/hotel-management/CommissionSettings';

const HotelManagement: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Otel Yönetimi"
        subtitle="Otel bilgilerini, modülleri ve online kanal ayarlarını yönetin"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <HotelInfoSection />
        <CheckinPolicySettings />
        <CommissionSettings />
        <ReservationChannelSection />
      </Box>
    </div>
  );
};

export default HotelManagement;

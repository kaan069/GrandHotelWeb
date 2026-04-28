import React from 'react';
import { Grid } from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  MeetingRoom as RoomIcon,
  KingBed as KingBedIcon,
  SingleBed as SingleBedIcon,
} from '@mui/icons-material';

import { StatCard } from '../common';

interface StatisticsSectionProps {
  occupiedRooms: number;
  availableRooms: number;
  totalRooms: number;
  singleRooms: number;
  doubleRooms: number;
  occupancyRate: string | number;
  canViewFinancials: boolean;
  dailyRevenue?: number;
  monthlyRevenue?: number;
  monthlyGrowthPercent?: number;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  occupiedRooms,
  availableRooms,
  totalRooms,
  singleRooms,
  doubleRooms,
  occupancyRate,
  canViewFinancials,
  dailyRevenue = 0,
  monthlyRevenue = 0,
  monthlyGrowthPercent = 0,
}) => {
  return (
    <Grid container spacing={2.5} sx={{ mt: 1 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Dolu Oda"
          value={occupiedRooms}
          icon={<RoomIcon />}
          color="error"
          subtitle={`${availableRooms} müsait / ${totalRooms} toplam`}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Tek Konaklayan"
          value={singleRooms}
          icon={<SingleBedIcon />}
          color="info"
          subtitle="1 misafirli oda sayısı"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Çift Konaklayan"
          value={doubleRooms}
          icon={<KingBedIcon />}
          color="primary"
          subtitle="2+ misafirli oda sayısı"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Doluluk Oranı"
          value={`%${occupancyRate}`}
          icon={<TrendingUpIcon />}
          color="success"
        />
      </Grid>

      {canViewFinancials && (
        <>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Günlük Ciro"
              value={`${dailyRevenue.toLocaleString('tr-TR')} ₺`}
              icon={<MoneyIcon />}
              color="secondary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Aylık Ciro"
              value={`${monthlyRevenue.toLocaleString('tr-TR')} ₺`}
              icon={<MoneyIcon />}
              color="secondary"
              change={monthlyGrowthPercent}
              subtitle="geçen aya göre"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default StatisticsSection;

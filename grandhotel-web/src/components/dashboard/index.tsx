import React from 'react';
import { Grid } from '@mui/material';
import RoomPanel from './RoomPanel';
import CheckInOutLists from './CheckInOutLists';
import StatisticsSection from './StatisticsSection';
import OccupancyReportDialog from './OccupancyReportDialog';
import HousekeepingReportDialog from './HousekeepingReportDialog';
import { RoomGuest } from '../../utils/constants';

interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  notes?: string;
}

interface CheckInOutItem {
  id: number;
  guest: string;
  room: string;
  time: string;
}

interface DashboardContentProps {
  rooms: Room[];
  filteredRooms: Room[];
  floors: number[];
  selectedFloor: string;
  onFloorChange: (value: string) => void;
  cleaningFilter: string;
  onCleaningFilterChange: (value: string) => void;
  occupancyFilter: string;
  onOccupancyFilterChange: (value: string) => void;
  onStatusChange: (roomId: string | number, newStatus: string) => void;
  onRoomAction: (roomId: string | number, actionType: string) => void;
  onRoomClick: (room: { id: string | number; roomNumber: string | number }) => void;
  onReportOpen: () => void;
  onHousekeepingOpen: () => void;
  onNavigate: (path: string) => void;
  checkIns: CheckInOutItem[];
  checkOuts: CheckInOutItem[];
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

const DashboardContent: React.FC<DashboardContentProps> = ({
  rooms,
  filteredRooms,
  floors,
  selectedFloor,
  onFloorChange,
  cleaningFilter,
  onCleaningFilterChange,
  occupancyFilter,
  onOccupancyFilterChange,
  onStatusChange,
  onRoomAction,
  onRoomClick,
  onReportOpen,
  onHousekeepingOpen,
  onNavigate,
  checkIns,
  checkOuts,
  occupiedRooms,
  availableRooms,
  totalRooms,
  singleRooms,
  doubleRooms,
  occupancyRate,
  canViewFinancials,
  dailyRevenue,
  monthlyRevenue,
  monthlyGrowthPercent,
}) => {
  return (
    <>
      <RoomPanel
        rooms={rooms}
        filteredRooms={filteredRooms}
        floors={floors}
        selectedFloor={selectedFloor}
        onFloorChange={onFloorChange}
        cleaningFilter={cleaningFilter}
        onCleaningFilterChange={onCleaningFilterChange}
        occupancyFilter={occupancyFilter}
        onOccupancyFilterChange={onOccupancyFilterChange}
        onStatusChange={onStatusChange}
        onRoomAction={onRoomAction}
        onRoomClick={onRoomClick}
        onReportOpen={onReportOpen}
        onHousekeepingOpen={onHousekeepingOpen}
        onNavigate={onNavigate}
      />

      <CheckInOutLists
        checkIns={checkIns}
        checkOuts={checkOuts}
      />

      <StatisticsSection
        occupiedRooms={occupiedRooms}
        availableRooms={availableRooms}
        totalRooms={totalRooms}
        singleRooms={singleRooms}
        doubleRooms={doubleRooms}
        occupancyRate={occupancyRate}
        canViewFinancials={canViewFinancials}
        dailyRevenue={dailyRevenue}
        monthlyRevenue={monthlyRevenue}
        monthlyGrowthPercent={monthlyGrowthPercent}
      />
    </>
  );
};

interface DashboardDialogsProps {
  reportDialogOpen: boolean;
  onReportClose: () => void;
  housekeepingReportOpen: boolean;
  onHousekeepingClose: () => void;
  rooms: Room[];
  canViewFinancials: boolean;
}

const DashboardDialogs: React.FC<DashboardDialogsProps> = ({
  reportDialogOpen,
  onReportClose,
  housekeepingReportOpen,
  onHousekeepingClose,
  rooms,
  canViewFinancials,
}) => {
  return (
    <>
      <OccupancyReportDialog
        open={reportDialogOpen}
        onClose={onReportClose}
        rooms={rooms}
        canViewFinancials={canViewFinancials}
      />
      <HousekeepingReportDialog
        open={housekeepingReportOpen}
        onClose={onHousekeepingClose}
        rooms={rooms}
      />
    </>
  );
};

export { DashboardContent, DashboardDialogs };
export default DashboardContent;

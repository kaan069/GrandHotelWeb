import React from 'react';
import { Grid } from '@mui/material';
import GuestListSection from './GuestListSection';
import CustomerManagementSection from './CustomerManagementSection';
import StayInfoPanel from './StayInfoPanel';
import QuickReservationSection from './QuickReservationSection';
import RoomNoteSection from './RoomNoteSection';
import MinibarSection from './MinibarSection';
import AuditLogSection from './AuditLogSection';
import KbsSection from './KbsSection';
import { RoomGuest, Company, FolioItem } from '../../../utils/constants';
import type { ApiRoomMinibarItem } from '../../../api/services';

export { default as RoomHeaderToolbar } from './RoomHeaderToolbar';
export { default as NewGuestDialog } from './NewGuestDialog';
export { default as FolioDetailDialog } from './FolioDetailDialog';
export { default as StayHistoryDialog } from './StayHistoryDialog';
export { default as GuestCardDialog } from './GuestCardDialog';

interface RoomDetailSectionsProps {
  /* GuestListSection */
  guests: RoomGuest[];
  beds: { type: string }[];
  onMenuAction: (action: 'history' | 'card' | 'block' | 'remove', guestId: number) => void;
  /* CustomerManagementSection */
  customerMode: 'new' | 'registered';
  onCustomerModeChange: (mode: 'new' | 'registered') => void;
  onNewGuestClick: () => void;
  onSearchGuestClick: () => void;
  /* QuickReservationSection */
  quickRes: { firstName: string; lastName: string; phone: string };
  onQuickResChange: (field: 'firstName' | 'lastName' | 'phone', value: string) => void;
  onQuickResSubmit: () => void;
  /* RoomNoteSection */
  note: string;
  onNoteChange: (value: string) => void;
  onNoteSave: () => void;
  /* MinibarSection */
  minibarItems: ApiRoomMinibarItem[];
  /* KbsSection + AuditLogSection */
  roomId: number;
  isOccupied: boolean;
  isAdmin?: boolean;
  /* StayInfoPanel */
  checkInDate: string;
  onCheckInDateChange: (value: string) => void;
  checkOutDate: string;
  onCheckOutDateChange: (value: string) => void;
  selectedCompanyId: string;
  onCompanyChange: (value: string) => void;
  nightlyRate: string;
  onNightlyRateChange: (value: string) => void;
  companies: Company[];
  folios: FolioItem[];
  folioTotal: number;
  onFolioDetailOpen: () => void;
}

const RoomDetailSections: React.FC<RoomDetailSectionsProps> = ({
  guests,
  beds,
  onMenuAction,
  customerMode,
  onCustomerModeChange,
  onNewGuestClick,
  onSearchGuestClick,
  quickRes,
  onQuickResChange,
  onQuickResSubmit,
  note,
  onNoteChange,
  onNoteSave,
  minibarItems,
  roomId,
  isOccupied,
  isAdmin = false,
  checkInDate,
  onCheckInDateChange,
  checkOutDate,
  onCheckOutDateChange,
  selectedCompanyId,
  onCompanyChange,
  nightlyRate,
  onNightlyRateChange,
  companies,
  folios,
  folioTotal,
  onFolioDetailOpen,
}) => {
  return (
    <Grid container spacing={2.5}>
      {/* Sol Panel - Odada Kalanlar + Müşteri Yönetimi */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <GuestListSection
              guests={guests}
              beds={beds}
              onMenuAction={onMenuAction}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CustomerManagementSection
              customerMode={customerMode}
              onCustomerModeChange={onCustomerModeChange}
              onNewGuestClick={onNewGuestClick}
              onSearchGuestClick={onSearchGuestClick}
            />
          </Grid>
        </Grid>

        <QuickReservationSection
          quickRes={quickRes}
          onQuickResChange={onQuickResChange}
          onSubmit={onQuickResSubmit}
        />

        <RoomNoteSection
          note={note}
          onNoteChange={onNoteChange}
          onSave={onNoteSave}
        />

      </Grid>

      {/* Sağ Panel - Konaklama Bilgileri + Minibar */}
      <Grid size={{ xs: 12, md: 4 }}>
        <StayInfoPanel
          checkInDate={checkInDate}
          onCheckInDateChange={onCheckInDateChange}
          checkOutDate={checkOutDate}
          onCheckOutDateChange={onCheckOutDateChange}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={onCompanyChange}
          nightlyRate={nightlyRate}
          onNightlyRateChange={onNightlyRateChange}
          companies={companies}
          folios={folios}
          folioTotal={folioTotal}
          onFolioDetailOpen={onFolioDetailOpen}
        />

        <MinibarSection items={minibarItems} />

        <KbsSection roomId={roomId} isOccupied={isOccupied} />

        {isAdmin && <AuditLogSection roomId={roomId} />}
      </Grid>
    </Grid>
  );
};

export default RoomDetailSections;

import React from 'react';
import NewReservationDialog from './NewReservationDialog';
import BulkReservationDialog from './BulkReservationDialog';
import type { NewReservationResult } from './NewReservationDialog';
import type { BulkReservationResult } from './BulkReservationDialog';

interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  price: number;
  status: string;
}

interface ReservationDialogsProps {
  rooms: Room[];
  newResDialogOpen: boolean;
  onNewResClose: () => void;
  onNewResSave: (result: NewReservationResult) => void;
  bulkDialogOpen: boolean;
  onBulkClose: () => void;
  onBulkSave: (result: BulkReservationResult) => void;
}

const ReservationDialogs: React.FC<ReservationDialogsProps> = ({
  rooms,
  newResDialogOpen,
  onNewResClose,
  onNewResSave,
  bulkDialogOpen,
  onBulkClose,
  onBulkSave,
}) => {
  return (
    <>
      <NewReservationDialog
        open={newResDialogOpen}
        onClose={onNewResClose}
        rooms={rooms}
        onSave={onNewResSave}
      />
      <BulkReservationDialog
        open={bulkDialogOpen}
        onClose={onBulkClose}
        rooms={rooms}
        onSave={onBulkSave}
      />
    </>
  );
};

export default ReservationDialogs;
export type { NewReservationResult, BulkReservationResult };

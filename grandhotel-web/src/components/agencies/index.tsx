import React from 'react';
import AgencyAddDialog from './AgencyAddDialog';
import AgencyDetailContent from './AgencyDetailContent';
import type { Agency } from '../../utils/constants';
import type { AgencyAddResult } from './AgencyAddDialog';

interface AgencyContentProps {
  activeAgency: Agency | null;
  onReservationClick?: (reservationId: number) => void;
  addDialogOpen: boolean;
  onAddClose: () => void;
  onAddSave: (result: AgencyAddResult) => void;
}

const AgencyContent: React.FC<AgencyContentProps> = ({
  activeAgency,
  onReservationClick,
  addDialogOpen,
  onAddClose,
  onAddSave,
}) => {
  return (
    <>
      {activeAgency && (
        <AgencyDetailContent
          agency={activeAgency}
          onReservationClick={onReservationClick}
        />
      )}

      <AgencyAddDialog
        open={addDialogOpen}
        onClose={onAddClose}
        onSave={onAddSave}
      />
    </>
  );
};

export default AgencyContent;
export type { AgencyAddResult };

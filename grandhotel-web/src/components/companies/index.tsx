import React from 'react';
import CompanyAddDialog from './CompanyAddDialog';
import CompanyDetailContent from './CompanyDetailContent';
import { Company, StayHistory } from '../../utils/constants';
import type { CompanyAddResult } from './CompanyAddDialog';

interface CompanyContentProps {
  activeCompany: Company | null;
  onStayClick: (stay: StayHistory) => void;
  addDialogOpen: boolean;
  onAddClose: () => void;
  onAddSave: (result: CompanyAddResult) => void;
}

const CompanyContent: React.FC<CompanyContentProps> = ({
  activeCompany,
  onStayClick,
  addDialogOpen,
  onAddClose,
  onAddSave,
}) => {
  return (
    <>
      {activeCompany && (
        <CompanyDetailContent
          company={activeCompany}
          onStayClick={onStayClick}
        />
      )}

      <CompanyAddDialog
        open={addDialogOpen}
        onClose={onAddClose}
        onSave={onAddSave}
      />
    </>
  );
};

export default CompanyContent;
export type { CompanyAddResult };

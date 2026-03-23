/**
 * NightAuditButton — Gün Sonu butonu + dialog trigger
 */

import React, { useState } from 'react';
import { Button } from '@mui/material';
import { NightsStay as NightsStayIcon } from '@mui/icons-material';

import usePermission from '../../hooks/usePermission';
import NightAuditDialog from './NightAuditDialog';

const NightAuditButton: React.FC = () => {
  const { canRunNightAudit } = usePermission();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!canRunNightAudit) return null;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="warning"
        startIcon={<NightsStayIcon />}
        onClick={() => setDialogOpen(true)}
        sx={{ textTransform: 'none', fontSize: '0.8125rem', borderRadius: 2, mr: 0.5 }}
      >
        Gün Sonu
      </Button>

      <NightAuditDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
};

export default NightAuditButton;

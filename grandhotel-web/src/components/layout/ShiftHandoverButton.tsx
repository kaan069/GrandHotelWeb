/**
 * ShiftHandoverButton — Mesai Devret / Aktif Mesai butonu + dialog
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import { ROLES, ShiftHandover, type Role } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';
import { createShift, getActiveShift } from '../../utils/shiftStorage';
import { staffApi } from '../../api/services';

/** Mesai devri ön büro vardiyasıdır — backend FRONT_OFFICE_ROLES */
const FRONT_OFFICE_ROLES: Role[] = [ROLES.PATRON, ROLES.MANAGER, ROLES.RECEPTION, ROLES.RECEPTION_MANAGER];

const ShiftHandoverButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null);
  const [staffList, setStaffList] = useState<{ id: number; name: string; role: string }[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftHandover | null>(null);

  const { canAccess } = usePermission();
  const { showSuccess, showError } = useNotification();
  const canHandover = canAccess(FRONT_OFFICE_ROLES);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getActiveShift().then(setActiveShift);
  }, []);

  if (!canHandover) return null;

  const handleOpen = async () => {
    setSelectedEmployee(null);
    setDialogOpen(true);
    try {
      const data = await staffApi.getAll({ status: 'active' });
      setStaffList(
        data
          .filter((emp) => {
            if (emp.id === user?.id) return false;
            // Ön büro vardiyası: devralan ön büro rolüne sahip olmalı (backend IsFrontOffice ile aynı grup)
            const empRoles: string[] = emp.roles || [];
            return empRoles.some((r) => (FRONT_OFFICE_ROLES as string[]).includes(r));
          })
          .map((emp) => ({
            id: emp.id,
            name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
            role: emp.roleLabels?.[0] || emp.roles?.[0] || '',
          }))
      );
    } catch {
      setStaffList([]);
    }
  };

  const handleConfirm = async () => {
    if (selectedEmployee && user) {
      try {
        await createShift(user.id, selectedEmployee.id);
        const active = await getActiveShift();
        setActiveShift(active);
        setDialogOpen(false);
        setSelectedEmployee(null);
        showSuccess(`Mesai ${selectedEmployee.name} adlı personele devredildi`);
      } catch (err) {
        showError(getApiErrorMessage(err, 'Mesai devredilemedi'));
      }
    }
  };

  return (
    <>
      {/* Mesai Devret veya Aktif Mesai butonu */}
      {!activeShift ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<SwapHorizIcon />}
          onClick={handleOpen}
          sx={{ textTransform: 'none', fontSize: '0.8125rem', borderRadius: 2, mr: 0.5 }}
        >
          Mesai Devret
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          color="success"
          startIcon={<SwapHorizIcon />}
          onClick={() => navigate('/shift-handover')}
          sx={{ textTransform: 'none', fontSize: '0.8125rem', borderRadius: 2, mr: 0.5 }}
        >
          Mesai Aktif
        </Button>
      )}

      {/* Mesai Devir Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" />
          Mesai Devret
        </DialogTitle>
        <DialogContent>
          {!selectedEmployee ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mesaiyi devredeceğiniz personeli seçin:
              </Typography>
              <List disablePadding>
                {staffList.map((emp) => (
                  <ListItemButton
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    sx={{ borderRadius: 1, mb: 0.5, border: '1px solid', borderColor: 'divider' }}
                  >
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary={emp.name} secondary={emp.role} />
                  </ListItemButton>
                ))}
              </List>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>{selectedEmployee.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Bu personele mesaiyi devretmek istediğinize emin misiniz?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!selectedEmployee ? (
            <Button onClick={() => setDialogOpen(false)} color="inherit">İptal</Button>
          ) : (
            <>
              <Button onClick={() => setSelectedEmployee(null)} color="inherit">Geri</Button>
              <Button onClick={handleConfirm} variant="contained" color="primary">Devret</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShiftHandoverButton;

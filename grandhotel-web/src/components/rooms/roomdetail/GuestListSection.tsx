import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Box,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  PersonRemove as PersonRemoveIcon,
  KingBed as KingBedIcon,
  SingleBed as SingleBedIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';

import { RoomGuest, BED_TYPE_LABELS } from '../../../utils/constants';

interface BedConfig {
  type: string;
}

interface BedAssignment {
  bed: BedConfig;
  guests: RoomGuest[];
}

interface GuestListSectionProps {
  guests: RoomGuest[];
  beds: BedConfig[];
  onMenuAction: (action: 'history' | 'card' | 'block' | 'remove', guestId: number) => void;
}

/** Yatak tipine göre genişlik oranı */
const getBedFlex = (type: string): number => {
  if (type === 'king' || type === 'double') return 2;
  return 1;
};

/** Yatak tipine göre ikon */
const BedIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'king' || type === 'double') {
    return <KingBedIcon sx={{ fontSize: 18, opacity: 0.7 }} />;
  }
  return <SingleBedIcon sx={{ fontSize: 18, opacity: 0.7 }} />;
};

/** Misafir-yatak ilk eşleşmesi: misafirler sırayla yataklara atanır */
const assignGuestsToBeds = (beds: BedConfig[], guests: RoomGuest[]): BedAssignment[] => {
  const assignments: BedAssignment[] = beds.map((b) => ({
    bed: b,
    guests: [],
  }));

  let guestIdx = 0;
  for (let i = 0; i < assignments.length && guestIdx < guests.length; i++) {
    const bedType = assignments[i].bed.type;
    const capacity = bedType === 'double' || bedType === 'king' ? 2 : 1;
    for (let c = 0; c < capacity && guestIdx < guests.length; c++) {
      assignments[i].guests.push(guests[guestIdx]);
      guestIdx++;
    }
  }

  if (guestIdx < guests.length && assignments.length > 0) {
    const lastBed = assignments[assignments.length - 1];
    while (guestIdx < guests.length) {
      lastBed.guests.push(guests[guestIdx]);
      guestIdx++;
    }
  }

  return assignments;
};

const GuestListSection: React.FC<GuestListSectionProps> = ({ guests, beds, onMenuAction }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGuestId, setMenuGuestId] = useState<number | null>(null);

  /* Drag & Drop state */
  const [dragOverBedIdx, setDragOverBedIdx] = useState<number | null>(null);
  const [dragGuestId, setDragGuestId] = useState<number | null>(null);

  const effectiveBeds = beds && beds.length > 0 ? beds : [{ type: 'single' }];
  const [assignments, setAssignments] = useState<BedAssignment[]>(() =>
    assignGuestsToBeds(effectiveBeds, guests || [])
  );

  /* guests veya beds değişince yeniden hesapla */
  useEffect(() => {
    const eBeds = beds && beds.length > 0 ? beds : [{ type: 'single' }];
    setAssignments(assignGuestsToBeds(eBeds, guests || []));
  }, [guests, beds]);

  /* === Kebab menü === */
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, guestId: number) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuGuestId(guestId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuGuestId(null);
  };

  const handleAction = (action: 'history' | 'card' | 'block' | 'remove') => {
    if (menuGuestId) {
      onMenuAction(action, menuGuestId);
    }
    handleMenuClose();
  };

  /* === Drag & Drop handlers === */
  const handleDragStart = (e: React.DragEvent, guestId: number) => {
    setDragGuestId(guestId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(guestId));
  };

  const handleDragEnd = () => {
    setDragGuestId(null);
    setDragOverBedIdx(null);
  };

  const handleDragOver = (e: React.DragEvent, bedIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBedIdx(bedIdx);
  };

  const handleDragLeave = () => {
    setDragOverBedIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetBedIdx: number) => {
    e.preventDefault();
    setDragOverBedIdx(null);

    const guestId = Number(e.dataTransfer.getData('text/plain'));
    if (!guestId) return;

    setAssignments((prev) => {
      const next = prev.map((a) => ({ ...a, guests: [...a.guests] }));

      /* Kaynak yatağı bul ve misafiri çıkar */
      let movedGuest: RoomGuest | null = null;
      for (const a of next) {
        const idx = a.guests.findIndex((g) => g.guestId === guestId);
        if (idx !== -1) {
          movedGuest = a.guests[idx];
          a.guests.splice(idx, 1);
          break;
        }
      }

      /* Hedef yatağa ekle */
      if (movedGuest && next[targetBedIdx]) {
        next[targetBedIdx].guests.push(movedGuest);
      }

      return next;
    });

    setDragGuestId(null);
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <KingBedIcon sx={{ fontSize: 20 }} />
            Oda Düzeni
            {guests && guests.length > 0 && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                ({guests.length} misafir)
              </Typography>
            )}
          </Typography>

          {/* Yatak düzeni */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {assignments.map((assignment, idx) => {
              const { bed, guests: bedGuests } = assignment;
              const isEmpty = bedGuests.length === 0;
              const isLarge = bed.type === 'king' || bed.type === 'double';
              const isDragOver = dragOverBedIdx === idx;

              return (
                <Box
                  key={idx}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  sx={{
                    flex: getBedFlex(bed.type),
                    minWidth: isLarge ? 220 : 140,
                    maxWidth: isLarge ? 360 : 200,
                  }}
                >
                  {/* Yatak başlığı (headboard) */}
                  <Box
                    sx={{
                      height: 14,
                      borderRadius: '10px 10px 0 0',
                      background: isDragOver
                        ? 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)'
                        : isEmpty
                          ? 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)'
                          : 'linear-gradient(135deg, #5D4037 0%, #795548 100%)',
                      transition: 'background 0.2s',
                    }}
                  />

                  {/* Yatak gövdesi */}
                  <Box
                    sx={{
                      border: isDragOver
                        ? '2px solid #42A5F5'
                        : isEmpty
                          ? '2px dashed #E0E0E0'
                          : '2px solid #D7CCC8',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      bgcolor: isDragOver ? '#E3F2FD' : isEmpty ? '#FAFAFA' : '#FFF8E1',
                      p: 2,
                      minHeight: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Yatak tipi etiketi */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <BedIcon type={bed.type} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {BED_TYPE_LABELS[bed.type] || bed.type}
                      </Typography>
                    </Box>

                    {isEmpty ? (
                      <Typography
                        variant="body2"
                        color={isDragOver ? 'primary' : 'text.disabled'}
                        sx={{ fontStyle: 'italic', py: 1 }}
                      >
                        {isDragOver ? 'Buraya bırak' : 'Boş'}
                      </Typography>
                    ) : (
                      bedGuests.map((guest) => (
                        <Box
                          key={guest.guestId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, guest.guestId)}
                          onDragEnd={handleDragEnd}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            width: '100%',
                            justifyContent: 'center',
                            bgcolor: dragGuestId === guest.guestId
                              ? 'rgba(33, 150, 243, 0.18)'
                              : 'rgba(33, 150, 243, 0.08)',
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.75,
                            cursor: 'grab',
                            opacity: dragGuestId === guest.guestId ? 0.5 : 1,
                            transition: 'opacity 0.15s, background-color 0.15s',
                            '&:active': { cursor: 'grabbing' },
                          }}
                        >
                          <DragIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.25 }} />
                          <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              textAlign: 'center',
                              userSelect: 'none',
                            }}
                          >
                            {guest.guestName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, guest.guestId)}
                            sx={{ p: 0.25 }}
                          >
                            <MoreVertIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Kebab Menü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <MenuItem onClick={() => handleAction('history')}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Konaklama Geçmişi</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('card')}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Müşteri Kartı Aç</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('remove')} sx={{ color: 'warning.main' }}>
          <ListItemIcon><PersonRemoveIcon fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Misafiri Odadan Çıkar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('block')} sx={{ color: 'error.main' }}>
          <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Müşteriyi Engelle</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default GuestListSection;

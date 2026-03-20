import React from 'react';
import { Box, Typography, IconButton, Chip, Tabs, Tab } from '@mui/material';
import {
  Close as CloseIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';

interface RoomTab {
  roomId: number;
  roomNumber: string;
  checkIn?: string;
  checkOut?: string;
}

interface RoomTabBarProps {
  tabs: RoomTab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (e: React.MouseEvent, index: number) => void;
  onBackToChart: () => void;
}

const RoomTabBar: React.FC<RoomTabBarProps> = ({ tabs, activeIndex, onTabChange, onTabClose, onBackToChart }) => {
  if (tabs.length === 0) return null;

  return (
    <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '8px 8px 0 0' }}>
      <Tabs
        value={activeIndex === -1 ? false : activeIndex}
        onChange={(_, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 42, '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontSize: '0.8125rem', fontWeight: 500 } }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.roomId}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <HotelIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" fontWeight={activeIndex === index ? 600 : 400}>
                  Oda {tab.roomNumber}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => onTabClose(e, index)}
                  sx={{ ml: 0.5, p: 0.2, '&:hover': { color: 'error.main' } }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            }
          />
        ))}
      </Tabs>
      {activeIndex !== -1 && (
        <Box sx={{ px: 1, pb: 0.5 }}>
          <Chip
            label="Çizelgeye Dön"
            size="small"
            variant="outlined"
            onClick={onBackToChart}
            sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default RoomTabBar;

/**
 * BookingLayout - Public booking sitesi layout'u
 *
 * Header + sayfa içeriği (Outlet) + Footer.
 * PMS layout'undan bağımsız, sidebar yok.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import BookingHeader from './BookingHeader';
import BookingFooter from './BookingFooter';

const BookingLayout: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      <BookingHeader />

      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <BookingFooter />
    </Box>
  );
};

export default BookingLayout;

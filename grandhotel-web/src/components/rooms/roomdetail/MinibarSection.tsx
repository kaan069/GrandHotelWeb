import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { LocalBar as MinibarIcon } from '@mui/icons-material';
import type { ApiRoomMinibarItem } from '../../../api/services';

interface MinibarSectionProps {
  items: ApiRoomMinibarItem[];
}

const MinibarSection: React.FC<MinibarSectionProps> = ({ items }) => {
  const minibarTotal = items.reduce((sum, item) => sum + item.consumed * parseFloat(item.price), 0);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          <MinibarIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Minibar
        </Typography>

        {items.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Ürün</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Adet</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Durum</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tutar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const cost = item.consumed * parseFloat(item.price);
                  return (
                    <TableRow key={item.productId}>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{item.productName}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8125rem' }}>
                        {item.placed}/{item.remaining}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8125rem', color: item.consumed > 0 ? 'error.main' : 'text.secondary' }}>
                        {item.consumed > 0 ? `${item.consumed} içildi` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>
                        {cost > 0 ? `${cost.toLocaleString('tr-TR')} ₺` : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }} colSpan={3}>
                    Minibar Toplam
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                    {minibarTotal.toLocaleString('tr-TR')} ₺
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Minibarda ürün bulunmuyor.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MinibarSection;

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

interface CheckInOutItem {
  id: number;
  guest: string;
  room: string;
  time: string;
}

interface CheckInOutListsProps {
  checkIns: CheckInOutItem[];
  checkOuts: CheckInOutItem[];
}

interface CollapsibleListProps {
  title: string;
  icon: React.ReactNode;
  chipColor: 'info' | 'warning';
  items: CheckInOutItem[];
  emptyText: string;
  defaultOpen?: boolean;
}

const CollapsibleList: React.FC<CollapsibleListProps> = ({
  title, icon, chipColor, items, emptyText, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardContent sx={{ pb: open ? undefined : '16px !important' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: open ? 2 : 0,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setOpen((v) => !v)}
        >
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label={items.length} color={chipColor} size="small" />
            <IconButton size="small" sx={{ ml: 0.5 }} aria-label={open ? 'Kapat' : 'Aç'}>
              {open ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {items.map((item) => (
              <ListItem
                key={item.id}
                disableGutters
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <ListItemText
                  primary={item.guest}
                  secondary={`Oda ${item.room}`}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {item.time}
                </Typography>
              </ListItem>
            ))}
            {items.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                {emptyText}
              </Typography>
            )}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const CheckInOutLists: React.FC<CheckInOutListsProps> = ({ checkIns, checkOuts }) => {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <CollapsibleList
          title="Bugünkü Girişler"
          icon={<CheckInIcon color="info" fontSize="small" />}
          chipColor="info"
          items={checkIns}
          emptyText="Bugün giriş yapacak misafir bulunmuyor"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CollapsibleList
          title="Bugünkü Çıkışlar"
          icon={<CheckOutIcon color="warning" fontSize="small" />}
          chipColor="warning"
          items={checkOuts}
          emptyText="Bugün çıkış yapacak misafir bulunmuyor"
        />
      </Grid>
    </Grid>
  );
};

export default CheckInOutLists;

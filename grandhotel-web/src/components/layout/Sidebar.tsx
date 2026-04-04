/**
 * Sidebar Bileşeni
 *
 * Uygulamanın sol menü navigasyonunu oluşturur.
 * Özellikler:
 *   - Rol bazlı menü filtreleme (kullanıcının rolüne göre menü öğeleri gösterilir)
 *   - Alt menü (children) desteği (accordion tarzı açılır/kapanır)
 *   - Daraltılabilir sidebar (mini/full mod)
 *   - Aktif sayfa vurgulaması
 *   - Otel logosu ve adı gösterimi
 *
 * Props:
 *   - open (boolean): Sidebar açık mı kapalı mı
 *   - onToggle (function): Sidebar aç/kapa fonksiyonu
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/* İkonlar */
import {
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  BookOnline as BookOnlineIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  SwapHoriz as SwapHorizIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  LocalBar as LocalBarIcon,
  Badge as BadgeIcon,
  Videocam as VideocamIcon,
  TableRestaurant as TableRestaurantIcon,
  SoupKitchen as SoupKitchenIcon,
  PointOfSale as PointOfSaleIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Storefront as StorefrontIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';

import { MENU_ITEMS, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, APP_NAME, MenuItem, MenuChildItem } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * İkon adını MUI ikon bileşenine çevirir.
 * constants.js'deki MENU_ITEMS'da tanımlanan icon stringleri burada eşleştirilir.
 */
const iconMap: Record<string, React.ElementType> = {
  Dashboard: DashboardIcon,
  Hotel: HotelIcon,
  BookOnline: BookOnlineIcon,
  People: PeopleIcon,
  AdminPanelSettings: AdminIcon,
  Assessment: AssessmentIcon,
  SwapHoriz: SwapHorizIcon,
  Receipt: ReceiptIcon,
  Business: BusinessIcon,
  Settings: SettingsIcon,
  LocalBar: LocalBarIcon,
  Badge: BadgeIcon,
  Videocam: VideocamIcon,
  TableRestaurant: TableRestaurantIcon,
  SoupKitchen: SoupKitchenIcon,
  PointOfSale: PointOfSaleIcon,
  RestaurantMenu: RestaurantMenuIcon,
  Storefront: StorefrontIcon,
  Extension: ExtensionIcon,
};

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* Alt menü açık/kapalı durumları - { menuId: boolean } */
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const userRole = user?.role || 'reception';

  /**
   * Kullanıcının rolüne göre menü öğelerini filtreler.
   * Sadece kullanıcının yetkili olduğu menü öğeleri gösterilir.
   */
  const enabledModules = user?.enabledModules || ['base'];
  const filteredMenuItems = MENU_ITEMS.filter(
    (item: MenuItem) => item.roles.includes(userRole) && (!item.module || enabledModules.includes(item.module))
  );

  /**
   * Alt menüyü açar/kapatır.
   * @param menuId - Menü öğesinin benzersiz kimliği
   */
  const handleToggleSubmenu = (menuId: string): void => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  /**
   * Menü öğesine tıklanınca ilgili sayfaya yönlendirir.
   * Eğer alt menüsü varsa, tıklamada alt menüyü açar/kapatır.
   * @param item - Menü öğesi (MENU_ITEMS'dan)
   */
  const handleMenuClick = (item: MenuItem): void => {
    if (item.children && item.children.length > 0) {
      handleToggleSubmenu(item.id);
    } else {
      navigate(item.path);
      /* Mobilde menüye tıklayınca sidebar'ı kapat */
      if (isMobile) {
        onToggle();
      }
    }
  };

  /**
   * Alt menü öğesine tıklanınca ilgili sayfaya yönlendirir.
   * @param path - Yönlendirilecek sayfa yolu
   */
  const handleSubmenuClick = (path: string): void => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  /**
   * Verilen yolun aktif sayfa olup olmadığını kontrol eder.
   * @param path - Kontrol edilecek sayfa yolu
   * @returns boolean
   */
  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  /* Sidebar genişliği - açık/kapalı duruma göre */
  const drawerWidth = open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  /** Sidebar içeriği */
  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'custom.sidebar',
        color: 'custom.sidebarText',
        overflow: 'hidden',
      }}
    >
      {/* === Logo ve Otel Adı === */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: open ? '16px 20px' : '16px 8px',
          minHeight: 64,
        }}
      >
        {open && (
          <Typography
            variant="h3"
            sx={{
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {APP_NAME}
          </Typography>
        )}
        {/* Daralt/Genişlet butonu (sadece desktop) */}
        {!isMobile && (
          <IconButton
            onClick={onToggle}
            sx={{ color: 'custom.sidebarText', ml: open ? 0 : 'auto', mr: open ? 0 : 'auto' }}
            size="small"
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* === Menü Listesi === */}
      <List
        component="nav"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          /* Özel scrollbar */
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          },
        }}
      >
        {filteredMenuItems.map((item: MenuItem) => {
          const IconComponent = iconMap[item.icon];
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.id];

          return (
            <React.Fragment key={item.id}>
              {/* Ana menü öğesi */}
              <Tooltip
                title={!open ? item.label : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  sx={{
                    mx: 1,
                    my: 0.3,
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2 : 1.5,
                    bgcolor: active ? 'custom.sidebarActive' : 'transparent',
                    color: active ? '#FFFFFF' : 'custom.sidebarText',
                    '&:hover': {
                      bgcolor: active ? 'custom.sidebarActive' : 'custom.sidebarHover',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 0,
                      justifyContent: 'center',
                      color: 'inherit',
                    }}
                  >
                    {IconComponent && <IconComponent fontSize="small" />}
                  </ListItemIcon>

                  {open && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: active ? 600 : 400,
                        }}
                      />
                      {/* Alt menü ok ikonu */}
                      {hasChildren && (
                        isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>

              {/* Alt menü öğeleri */}
              {hasChildren && open && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children!.map((child: MenuChildItem) => (
                      <ListItemButton
                        key={child.id}
                        onClick={() => handleSubmenuClick(child.path)}
                        sx={{
                          mx: 1,
                          my: 0.2,
                          borderRadius: 2,
                          pl: 6.5,
                          minHeight: 36,
                          bgcolor: isActive(child.path) ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          color: isActive(child.path) ? '#FFFFFF' : 'custom.sidebarText',
                          '&:hover': {
                            bgcolor: 'custom.sidebarHover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            fontWeight: isActive(child.path) ? 500 : 400,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* === Alt Bilgi === */}
      {open && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            GrandHotel PMS v1.0
          </Typography>
        </Box>
      )}
    </Box>
  );

  /* Mobilde geçici (temporary) drawer, desktop'ta kalıcı (permanent) drawer */
  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onToggle}
          ModalProps={{ keepMounted: true }} // Mobil performans için
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              transition: 'width 0.2s ease',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;

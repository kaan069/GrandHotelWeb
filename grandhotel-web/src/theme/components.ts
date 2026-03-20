/**
 * GrandHotel PMS - MUI Bileşen Override'ları
 *
 * MUI bileşenlerinin varsayılan stillerini uygulama genelinde özelleştirir.
 * Buton, kart, tablo, input gibi bileşenlerin görünümü tek yerden kontrol edilir.
 *
 * Yeni bir bileşen override'ı eklemek için:
 * MUI bileşen adını (örn: MuiButton) key olarak ekleyin.
 * Bkz: https://mui.com/material-ui/customization/theme-components/
 */

import { Components, Theme } from '@mui/material/styles';

const components: Components<Omit<Theme, 'components'>> & Record<string, unknown> = {
  /* --- Butonlar --- */
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,               // Yuvarlatılmış köşeler
        padding: '8px 20px',
        boxShadow: 'none',             // Varsayılan gölge kaldırıldı
        '&:hover': {
          boxShadow: 'none',
        },
      },
      sizeSmall: {
        padding: '4px 12px',
        fontSize: '0.8125rem',
      },
      sizeLarge: {
        padding: '12px 28px',
        fontSize: '1rem',
      },
      /* Contained butonlar için hafif gölge */
      contained: {
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
      /* Outlined butonlar için border kalınlığı */
      outlined: {
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
        },
      },
    },
    defaultProps: {
      disableElevation: true,           // Tüm butonlarda elevation kapalı
    },
  },

  /* --- Kartlar --- */
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid #E2E8F0',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: '16px 20px',
      },
      title: {
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '16px 20px',
        '&:last-child': {
          paddingBottom: 16,
        },
      },
    },
  },

  /* --- Kağıt (Paper) --- */
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
    },
  },

  /* --- Tablo --- */
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          borderBottom: '2px solid #E2E8F0',
          padding: '12px 16px',
          whiteSpace: 'nowrap',
        },
      },
    },
  },

  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-body': {
          fontSize: '0.875rem',
          padding: '12px 16px',
          borderBottom: '1px solid #F1F5F9',
        },
        '& .MuiTableRow-root:hover': {
          backgroundColor: '#F8FAFC',
        },
      },
    },
  },

  /* --- Form Input'ları --- */
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',                   // Varsayılan boyut küçük
      fullWidth: true,                 // Varsayılan tam genişlik
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1565C0',
          },
        },
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      input: {
        padding: '10px 14px',
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    },
  },

  /* --- Select --- */
  MuiSelect: {
    defaultProps: {
      size: 'small',
    },
  },

  /* --- Chip (Etiket) --- */
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: '0.75rem',
      },
      sizeSmall: {
        height: 24,
      },
    },
  },

  /* --- Dialog (Modal) --- */
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.125rem',
        fontWeight: 600,
        padding: '20px 24px 12px',
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '12px 24px',
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '12px 24px 20px',
        gap: 8,
      },
    },
  },

  /* --- Tooltip --- */
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#1E293B',
        fontSize: '0.75rem',
        borderRadius: 6,
        padding: '6px 12px',
      },
    },
  },

  /* --- Tab --- */
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        minHeight: 44,
      },
    },
  },

  /* --- Breadcrumb --- */
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
      },
    },
  },

  /* --- Alert --- */
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontSize: '0.875rem',
      },
    },
  },

  /* --- Badge --- */
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontSize: '0.6875rem',
        fontWeight: 600,
      },
    },
  },

  /* --- DataGrid (Tablo) --- */
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        borderRadius: 12,
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#F8FAFC',
          borderBottom: '2px solid #E2E8F0',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#64748B',
        },
        '& .MuiDataGrid-cell': {
          fontSize: '0.875rem',
          borderBottom: '1px solid #F1F5F9',
          padding: '0 16px',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#F8FAFC',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '2px solid #E2E8F0',
        },
      },
    },
    defaultProps: {
      density: 'comfortable',
      disableColumnMenu: true,
      pageSizeOptions: [10, 25, 50, 100],
    },
  },
};

export default components;

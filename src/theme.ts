import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0078BE', // Bleu WFP/Partner Connect plus vif
      light: '#3399DD',
      dark: '#005A8C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#003C5F', // Bleu foncé plus profond
      light: '#005280',
      dark: '#002540',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    text: {
      primary: '#212121',
      secondary: '#424242',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      color: '#000000',
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#000000',
      letterSpacing: '-0.3px',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#1e293b',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#1e293b',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#1e293b',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#1e293b',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#475569',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#475569',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#475569',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#64748b',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '0.9375rem',
          fontWeight: 600,
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.12)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(0, 120, 190, 0.04)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #0078BE 30%, #0091E6 90%)',
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #003C5F 30%, #004B7A 90%)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'rgba(0, 120, 190, 0.08)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        },
        title: {
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#1e293b',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
            borderBottom: '2px solid #e2e8f0',
            fontSize: '0.95rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e2e8f0',
          padding: '16px',
          fontSize: '0.9375rem',
        },
        head: {
          fontWeight: 600,
          color: '#1e293b',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:last-child td': {
            borderBottom: 0,
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 120, 190, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 120, 190, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 120, 190, 0.12)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '0.85rem',
          height: '28px',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
        },
        colorPrimary: {
          backgroundColor: 'rgba(0, 120, 190, 0.1)',
          color: '#0078BE',
        },
        colorSecondary: {
          backgroundColor: 'rgba(0, 60, 95, 0.1)',
          color: '#003C5F',
        },
        colorSuccess: {
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          color: '#2E7D32',
        },
        colorError: {
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          color: '#D32F2F',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            height: '3px',
            borderRadius: '3px',
            backgroundColor: '#0078BE',
          },
        },
        indicator: {
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          minWidth: '120px',
          transition: 'all 0.2s',
          '&.Mui-selected': {
            color: '#0078BE',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 120, 190, 0.04)',
            color: '#0078BE',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          padding: '12px 16px',
          border: '1.5px solid',
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#2E7D32',
          borderColor: '#86efac',
          '& .MuiAlert-icon': {
            color: '#22c55e',
          },
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#D32F2F',
          borderColor: '#fca5a5',
          '& .MuiAlert-icon': {
            color: '#ef4444',
          },
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          color: '#f59e0b',
          '& .MuiAlert-icon': {
            color: '#f59e0b',
          },
        },
        standardInfo: {
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          color: '#0284c7',
          '& .MuiAlert-icon': {
            color: '#0284c7',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderWidth: '1.5px',
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '1.5px',
            },
          },
        },
      },
    },


    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          fontSize: '0.75rem',
          padding: '8px 12px',
          borderRadius: '6px',
        },
      },
    },
  },
});
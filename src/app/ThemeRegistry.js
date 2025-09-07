'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a custom Material UI theme with dark mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Blue
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#6d28d9',
    },
    background: {
      default: '#0f172a', // Dark blue-gray
      paper: '#1e293b', // Lighter dark blue-gray
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#1e293b',
            '&:hover': {
              backgroundColor: '#334155',
            },
            '&.Mui-focused': {
              backgroundColor: '#334155',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#1e293b',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          border: '1px solid #334155',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

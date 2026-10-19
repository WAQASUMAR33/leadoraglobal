'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const AdminThemeContext = createContext({
  mode: 'dark',
  isDark: true,
  isLight: false,
  toggleTheme: () => {},
  setMode: () => {}
});

export function AdminThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_theme_mode');
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
    } catch (e) {
      console.error('Error reading theme from localStorage:', e);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('admin_theme_mode', next);
      } catch (e) {
        console.error('Error saving theme to localStorage:', e);
      }
      return next;
    });
  };

  const isDark = mode === 'dark';
  const isLight = mode === 'light';

  // Build Material UI theme tailored to dark/light with sharp geometry
  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: mode,
        primary: {
          main: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#38bdf8',
          light: '#7dd3fc',
          dark: '#0284c7'
        },
        background: {
          default: isDark ? '#070a12' : '#f1f5f9',
          paper: isDark ? '#0c1220' : '#ffffff'
        },
        text: {
          primary: isDark ? '#f8fafc' : '#0f172a',
          secondary: isDark ? '#94a3b8' : '#475569'
        },
        divider: isDark ? '#1e293b' : '#e2e8f0'
      },
      shape: {
        borderRadius: 0
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              backgroundColor: isDark ? '#0c1220' : '#ffffff',
              border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
              boxShadow: isDark
                ? '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 600
            }
          }
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 0,
              backgroundColor: isDark ? '#0c1220' : '#ffffff',
              border: `1px solid ${isDark ? '#1e293b' : '#cbd5e1'}`
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              fontWeight: 700
            }
          }
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
              color: isDark ? '#f8fafc' : '#0f172a'
            },
            head: {
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#94a3b8' : '#475569',
              fontWeight: 700
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 0
              }
            }
          }
        }
      }
    });
  }, [mode, isDark]);

  // Sync theme mode to document element data attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
      document.body.style.backgroundColor = isDark ? '#070a12' : '#f1f5f9';
      document.body.style.color = isDark ? '#f8fafc' : '#0f172a';
    }
  }, [mode, isDark]);

  return (
    <AdminThemeContext.Provider value={{ mode, isDark, isLight, toggleTheme, setMode }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}

export const AppThemeProvider = AdminThemeProvider;
export const useAppTheme = useAdminTheme;


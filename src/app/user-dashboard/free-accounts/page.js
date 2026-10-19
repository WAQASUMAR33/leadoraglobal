"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  PersonOutline,
  Search,
  CheckCircle,
  HourglassEmpty,
  AccountTree
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function FreeAccountsPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [inactiveData, setInactiveData] = useState({
    inactiveMembers: [],
    stats: {
      totalInactive: 0,
      potentialRevenue: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInactivePackageTree = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/free-accounts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setInactiveData(data);
      } else {
        setError('Failed to fetch free accounts');
      }
    } catch (err) {
      console.error('Error fetching free accounts:', err);
      setError('Error loading free accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchInactivePackageTree();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const filteredMembers = inactiveData?.allMembers?.filter(member => {
    const q = searchTerm.toLowerCase();
    return (member.name || '').toLowerCase().includes(q) ||
           (member.username || '').toLowerCase().includes(q) ||
           (member.phoneNumber || '').toLowerCase().includes(q);
  }) || [];

  const totalMembers = filteredMembers.length;
  const noPackageMembers = filteredMembers.filter(m => m.isPackageInactive || !m.package).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonOutline sx={{ color: '#f59e0b', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              Free & Unsubscribed Downline Accounts
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Directory of members in your downline network who have registered without an activated investment package.
            </Typography>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, border: '1px solid #ef4444', bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Filtered Members
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5 }}>
                {totalMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Activation
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>
                {noPackageMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Downline Tree Depth
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
                Level {inactiveData?.treeStats?.maxLevel || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Input */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search free accounts by name, username, or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: textSecondary }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 0, color: textPrimary, bgcolor: bgSubtle }
          }}
        />
      </Card>

      {/* Table */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Unsubscribed Accounts Ledger ({filteredMembers.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : filteredMembers.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: bgSubtle }}>
                <TableRow>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Level</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Member Username</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Full Name</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Package Status</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Registration Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.id || m.username} hover sx={{ '&:hover': { bgcolor: bgSubtle } }}>
                    <TableCell>
                      <Chip
                        label={`L${m.level || 1}`}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          color: '#f59e0b'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: textPrimary }}>
                      @{m.username}
                    </TableCell>
                    <TableCell sx={{ color: textPrimary }}>
                      {m.name || '-'}
                    </TableCell>
                    <TableCell sx={{ color: textSecondary, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                      {m.phoneNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.packageStatus || 'FREE / NO PACKAGE'}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HourglassEmpty sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Free Accounts Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              All registered downline members have activated packages.
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}

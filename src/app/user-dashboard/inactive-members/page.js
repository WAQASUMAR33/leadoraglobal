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
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton
} from '@mui/material';
import {
  WarningAmber,
  Search,
  ExpandMore,
  ExpandLess,
  HourglassDisabled,
  AccountTree,
  List as ListIcon
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function InactiveMembersPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [inactiveData, setInactiveData] = useState({
    levels: {},
    stats: {
      totalInactive: 0,
      potentialRevenue: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState({ 1: true });
  const [viewMode, setViewMode] = useState('list');

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchInactiveMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/inactive-members', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setInactiveData(data);
      } else {
        setError('Failed to fetch inactive members');
      }
    } catch (err) {
      console.error('Error fetching inactive members:', err);
      setError('Error loading inactive members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchInactiveMembers();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const filteredMembers = inactiveData?.members?.filter(m => {
    const q = searchTerm.toLowerCase();
    return (m.fullname || m.name || '').toLowerCase().includes(q) ||
           (m.username || '').toLowerCase().includes(q) ||
           (m.email || '').toLowerCase().includes(q) ||
           (m.phoneNumber || '').toLowerCase().includes(q);
  }) || [];

  const membersByLevel = {};
  filteredMembers.forEach(m => {
    const lvl = m.level || 1;
    if (!membersByLevel[lvl]) membersByLevel[lvl] = [];
    membersByLevel[lvl].push(m);
  });

  const totalInactiveMembers = filteredMembers.length;
  const noPackageMembers = filteredMembers.filter(m => m.packageStatus === 'No Package' || !m.packageStatus).length;
  const expiredMembers = filteredMembers.filter(m => m.packageStatus === 'Expired').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarningAmber sx={{ color: '#ef4444', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Inactive Package Downline
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Identify registered accounts with lapsed or unpurchased subscriptions to re-engage your team.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ListIcon />}
              onClick={() => setViewMode('list')}
              size="small"
              sx={{
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: viewMode === 'list' ? '#3b82f6' : 'transparent',
                borderColor: borderCard,
                color: viewMode === 'list' ? '#ffffff' : textPrimary,
                '&:hover': { bgcolor: viewMode === 'list' ? '#2563eb' : bgSubtle }
              }}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'contained' : 'outlined'}
              startIcon={<AccountTree />}
              onClick={() => setViewMode('tree')}
              size="small"
              sx={{
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: viewMode === 'tree' ? '#3b82f6' : 'transparent',
                borderColor: borderCard,
                color: viewMode === 'tree' ? '#ffffff' : textPrimary,
                '&:hover': { bgcolor: viewMode === 'tree' ? '#2563eb' : bgSubtle }
              }}
            >
              Grouped Levels
            </Button>
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
                Total Inactive
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#ef4444', mt: 0.5 }}>
                {totalInactiveMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Never Subscribed
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
                Expired Tiers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
                {expiredMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by member name, username, email, or phone number..."
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

      {/* Main View */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Inactive Accounts ({filteredMembers.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : filteredMembers.length > 0 ? (
          viewMode === 'list' ? (
            <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: bgSubtle }}>
                  <TableRow>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Level</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Member Username</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Full Name</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Email / Phone</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined</TableCell>
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
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary }}>
                        @{m.username || '-'}
                      </TableCell>
                      <TableCell sx={{ color: textPrimary }}>
                        {m.fullname || m.name || '-'}
                      </TableCell>
                      <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                        {m.email || m.phoneNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.packageStatus || 'INACTIVE'}
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
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.keys(membersByLevel).map((level) => {
                const membersAtLevel = membersByLevel[level];
                const isExpanded = !!expandedLevels[level];

                return (
                  <Paper key={level} sx={{ border: `1px solid ${borderCard}`, borderRadius: 0, bgcolor: bgSubtle }}>
                    <Box
                      onClick={() => toggleLevel(level)}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isLight ? '#f1f5f9' : '#1e293b' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={`Level ${level}`}
                          size="small"
                          sx={{ borderRadius: 0, bgcolor: '#3b82f6', color: '#fff', fontWeight: 800 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                          {membersAtLevel.length} Inactive Member{membersAtLevel.length > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <IconButton size="small" sx={{ color: textSecondary }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider sx={{ borderColor: borderCard }} />
                      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {membersAtLevel.map((m) => (
                          <Paper key={m.id || m.username} sx={{ p: 1.5, bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                                  {m.fullname || m.name || m.username} (@{m.username})
                                </Typography>
                                <Typography variant="caption" sx={{ color: textSecondary }}>
                                  Contact: {m.email || m.phoneNumber || '-'}
                                </Typography>
                              </Box>
                              <Chip
                                label={m.packageStatus || 'INACTIVE'}
                                size="small"
                                sx={{
                                  borderRadius: 0,
                                  fontWeight: 800,
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444'
                                }}
                              />
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Box>
          )
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HourglassDisabled sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Inactive Members Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              All members in your genealogy network have active packages.
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}

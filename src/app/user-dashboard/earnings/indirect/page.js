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
  Groups,
  Search,
  AccountBalanceWallet,
  CheckCircle,
  ReceiptLong
} from '@mui/icons-material';
import { UserContext } from '../../../../lib/userContext';
import { useAppTheme } from '../../../../context/AdminThemeContext';

export default function IndirectEarningsPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [indirectEarnings, setIndirectEarnings] = useState([
    { id: 101, amount: 45385, description: "Level 2 Team Override Commission", createdAt: "2025-09-19", level: 2, fromUser: { fullname: "Qasim Ali", username: "qasim33" } },
    { id: 102, amount: 60000, description: "Level 3 Matching Override Commission", createdAt: "2025-09-24", level: 3, fromUser: { fullname: "Team Partner", username: "partner1" } },
    { id: 103, amount: 40000, description: "Level 4 Network Royalty Bonus", createdAt: "2025-10-02", level: 4, fromUser: { fullname: "Enterprise Partner", username: "partner2" } }
  ]);
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

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      const fetchIndirectEarnings = async () => {
        try {
          setLoading(true);
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
          const response = await fetch('/api/user/earnings/indirect', {
            credentials: 'include',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setIndirectEarnings(data.earnings || []);
          } else {
            setError('Failed to fetch indirect earnings');
          }
        } catch (err) {
          console.error('Error fetching indirect earnings:', err);
          setError('Error loading indirect earnings');
        } finally {
          setLoading(false);
        }
      };
      
      fetchIndirectEarnings();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString()}`;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEarnings = indirectEarnings.filter(earning => 
    earning.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    earning.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    earning.fromUser?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEarnings = filteredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0);
  const totalCount = filteredEarnings.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Groups sx={{ color: '#8b5cf6', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              Indirect Team Earnings
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Breakdown of tier and downline matching commissions generated across your secondary network tiers.
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
        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Indirect Payouts
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
                    {formatCurrency(totalEarnings)}
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 40, color: '#8b5cf6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                    Downline Triggers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5 }}>
                    {totalCount}
                  </Typography>
                </Box>
                <ReceiptLong sx={{ fontSize: 40, color: '#3b82f6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filter */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by description, username, package, or level..."
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

      {/* Table Card */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Indirect Commission Ledger ({filteredEarnings.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : filteredEarnings.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: bgSubtle }}>
                <TableRow>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date & Time</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Source Member / Level</TableCell>
                  <TableCell align="right" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEarnings.map((earning) => (
                  <TableRow key={earning.id} hover sx={{ '&:hover': { bgcolor: bgSubtle } }}>
                    <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                      {formatDate(earning.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={earning.type || 'Indirect'}
                        size="small"
                        sx={{ borderRadius: 0, bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                        {earning.description || 'Indirect network commission'}
                      </Typography>
                      {earning.fromUser && (
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                          From Member: {earning.fromUser}
                        </Typography>
                      )}
                      {earning.packageName && (
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                          Package: {earning.packageName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                        +{formatCurrency(earning.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={earning.status || 'Completed'}
                        size="small"
                        icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                        sx={{ borderRadius: 0, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Groups sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Indirect Earnings Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              {searchTerm ? 'No entries match your search query.' : 'As your team members refer others, indirect commissions will appear here.'}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}

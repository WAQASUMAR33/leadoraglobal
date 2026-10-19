"use client";

import { useState, useEffect, useContext, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Paper
} from '@mui/material';
import {
  History,
  CheckCircle,
  Pending,
  Cancel,
  Search,
  ArrowBack,
  ReceiptLong,
  Assessment
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function WithdrawalsHistoryPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [withdrawalHistory, setWithdrawalHistory] = useState([
    {
      id: 101,
      amount: 25000,
      netAmount: 22500,
      fee: 2500,
      status: "approved",
      paymentMethod: { type: "bank", title: "Meezan Bank Limited", accountNumber: "01020304050607" },
      createdAt: "2026-10-15T12:00:00Z"
    },
    {
      id: 102,
      amount: 15000,
      netAmount: 13500,
      fee: 1500,
      status: "approved",
      paymentMethod: { type: "easypaisa", title: "EasyPaisa Mobile Account", accountNumber: "03001234567" },
      createdAt: "2026-10-05T14:30:00Z"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchWithdrawalHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/withdrawals', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setWithdrawalHistory(data.withdrawals || []);
      } else {
        setError('Failed to fetch withdrawal history');
      }
    } catch (err) {
      console.error('Error fetching withdrawal history:', err);
      setError('Error loading withdrawal history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchWithdrawalHistory();
      if (context?.refreshUserData) context.refreshUserData();
    }
  }, [mounted, context, fetchWithdrawalHistory]);

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

  const filteredWithdrawals = withdrawalHistory.filter(w => {
    const ref = (w.withdrawalRef || w.id?.toString() || '').toLowerCase();
    const method = (typeof w.paymentMethod === 'string' ? w.paymentMethod : JSON.stringify(w.paymentMethod || '')).toLowerCase();
    const matchesSearch = ref.includes(searchTerm.toLowerCase()) || method.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <History sx={{ color: '#3b82f6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Withdrawal Requests Archive
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Track the status, deductions, and transfer confirmations for all historical payouts.
              </Typography>
            </Box>
          </Box>
          <Button
            component={Link}
            href="/user-dashboard/withdraw"
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: 0,
              borderColor: borderCard,
              color: textPrimary,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Back to Withdraw
          </Button>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, border: '1px solid #ef4444', bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by reference ID or destination account..."
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
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              InputLabelProps={{ sx: { color: textSecondary } }}
              InputProps={{ sx: { borderRadius: 0, color: textPrimary, bgcolor: bgSubtle } }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Withdrawals List */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Payout Records ({filteredWithdrawals.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : filteredWithdrawals.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
            {filteredWithdrawals.map((w) => {
              const statusColor = w.status === 'approved' ? '#10b981' : w.status === 'rejected' ? '#ef4444' : '#f59e0b';
              const methodDetails = typeof w.paymentMethod === 'string' ? w.paymentMethod : (w.paymentMethod?.bankName || w.paymentMethod?.type || 'Bank Transfer');
              const accountDetails = typeof w.paymentMethod === 'object' ? `${w.paymentMethod?.accountName || ''} (${w.paymentMethod?.accountNumber || w.paymentMethod?.mobileNumber || ''})` : (w.accountDetails || '-');

              return (
                <Paper
                  key={w.id}
                  sx={{
                    p: 2.5,
                    bgcolor: bgSubtle,
                    border: `1px solid ${borderCard}`,
                    borderRadius: 0
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ReceiptLong sx={{ color: '#3b82f6', fontSize: 24 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
                          Ref #{w.withdrawalRef || w.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary }}>
                          Requested: {formatDate(w.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={(w.status || 'pending').toUpperCase()}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        bgcolor: `${statusColor}20`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`
                      }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                        Requested Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                        {formatCurrency(w.amount)}
                      </Typography>
                      {w.feeAmount ? (
                        <Typography variant="caption" sx={{ color: '#ef4444', display: 'block' }}>
                          Fee: -{formatCurrency(w.feeAmount)} | Net: {formatCurrency(w.netAmount)}
                        </Typography>
                      ) : null}
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                        Destination Account
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, mt: 0.5 }}>
                        {methodDetails}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                        {accountDetails}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                        Processing Log
                      </Typography>
                      <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5, fontSize: '0.82rem' }}>
                        {w.processedAt ? `Processed on: ${formatDate(w.processedAt)}` : 'Awaiting administrative verification'}
                      </Typography>
                      {w.adminNotes && (
                        <Typography variant="caption" sx={{ color: '#3b82f6', display: 'block', mt: 0.5 }}>
                          Admin Note: {w.adminNotes}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Withdrawal Records Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              {searchTerm || statusFilter !== 'all' ? 'No records match your selected filters.' : 'Your withdrawal requests will appear here once submitted.'}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}

"use client";

import { useState, useEffect, useContext } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  History,
  CheckCircle,
  Pending,
  Cancel,
  Search,
  FilterList,
  Download
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function WithdrawalsHistoryPage() {
  const context = useContext(UserContext);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchWithdrawalHistory();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);
  
  // Safety check for context
  if (!context) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  const { user, isAuthenticated } = context;

  // Withdrawal status options
  const statusOptions = {
    pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
    approved: { label: 'Approved', color: 'success', icon: <CheckCircle /> },
    rejected: { label: 'Rejected', color: 'error', icon: <Cancel /> },
    processing: { label: 'Processing', color: 'info', icon: <Pending /> }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/withdrawals', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawalHistory(data.withdrawals || []);
      } else {
        setError('Failed to fetch withdrawal history');
      }
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      setError('Error loading withdrawal history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter withdrawals based on search and status
  const filteredWithdrawals = withdrawalHistory.filter(withdrawal => {
    const matchesSearch = withdrawal.withdrawalRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Withdrawal History
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by reference or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export functionality to be implemented');
                }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            All Withdrawals ({filteredWithdrawals.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredWithdrawals.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredWithdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: statusOptions[withdrawal.status]?.color + '.light' }}>
                        {statusOptions[withdrawal.status]?.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(withdrawal.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reference: {withdrawal.withdrawalRef}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={statusOptions[withdrawal.status]?.label}
                      color={statusOptions[withdrawal.status]?.color}
                      variant="outlined"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Amount Breakdown
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Requested Amount:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(withdrawal.amount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="error.main">Processing Fee (10%):</Typography>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                            -{formatCurrency(withdrawal.feeAmount || 0)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Net Amount:</Typography>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(withdrawal.netAmount || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Payment Details
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Method:</strong> {withdrawal.paymentMethod}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Account:</strong> {withdrawal.accountDetails}
                        </Typography>
                        {withdrawal.notes && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Notes:</strong> {withdrawal.notes}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Requested: {formatDate(withdrawal.createdAt)}
                    </Typography>
                    {withdrawal.processedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Processed: {formatDate(withdrawal.processedAt)}
                      </Typography>
                    )}
                  </Box>

                  {withdrawal.adminNotes && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Admin Notes:
                      </Typography>
                      <Typography variant="body2">
                        {withdrawal.adminNotes}
                      </Typography>
                    </Box>
                  )}
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Withdrawal History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No withdrawals match your current filters.'
                  : "You haven't made any withdrawal requests yet."
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

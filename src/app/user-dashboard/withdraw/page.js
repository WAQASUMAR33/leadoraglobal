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
  Avatar
} from '@mui/material';
import {
  History,
  CheckCircle,
  Pending,
  Cancel
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function WithdrawPage() {
  const context = useContext(UserContext);
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated } = context || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user && !dataFetched) {
      const fetchData = async () => {
        try {
          setHistoryLoading(true);
          setDataFetched(true); // Prevent multiple calls
          
          // Refresh user data first to get latest balance
          if (context?.refreshUserData) {
            await context.refreshUserData();
          }
          
          // Fetch withdrawal history
          const withdrawalResponse = await fetch('/api/user/withdrawals', {
            credentials: 'include'
          });

          if (withdrawalResponse.ok) {
            const withdrawalData = await withdrawalResponse.json();
            setWithdrawalHistory(withdrawalData.withdrawals || []);
          } else {
            console.error('Failed to fetch withdrawal history');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setDataFetched(false); // Reset on error to allow retry
        } finally {
          setHistoryLoading(false);
        }
      };
      
      fetchData();
    }
  }, [mounted, context, dataFetched]);
  
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


  // Withdrawal status options
  const statusOptions = {
    pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
    approved: { label: 'Approved', color: 'success', icon: <CheckCircle /> },
    rejected: { label: 'Rejected', color: 'error', icon: <Cancel /> },
    processing: { label: 'Processing', color: 'info', icon: <Pending /> }
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

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, maxWidth: '100%', mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.5rem', md: '2rem' } }}>
        Withdrawal History
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Withdrawal History Section */}
      <Box sx={{ mt: 2 }}>
        <Card sx={{ p: { xs: 1, md: 2 } }}>
          <CardContent sx={{ p: { xs: 1, md: 2 } }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <History />
              Withdrawal History
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : withdrawalHistory.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {withdrawalHistory.map((withdrawal) => (
                  <Card key={withdrawal.id} variant="outlined" sx={{ p: { xs: 1, md: 2 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: statusOptions[withdrawal.status]?.color + '.light', width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                          {statusOptions[withdrawal.status]?.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            {formatCurrency(withdrawal.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            Reference: {withdrawal.withdrawalRef}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={statusOptions[withdrawal.status]?.label}
                        color={statusOptions[withdrawal.status]?.color}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: 'grey.800', borderRadius: 1, border: '1px solid', borderColor: 'grey.700' }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            Amount Breakdown
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'grey.300', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Requested:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                              {formatCurrency(withdrawal.amount)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'error.light', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Fee (10%):</Typography>
                            <Typography variant="body2" sx={{ color: 'error.light', fontWeight: 'bold', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                              -{formatCurrency(withdrawal.feeAmount || 0)}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1, borderColor: 'grey.600' }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Net Amount:</Typography>
                            <Typography variant="body2" sx={{ color: 'success.light', fontWeight: 'bold', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                              {formatCurrency(withdrawal.netAmount || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: 'grey.800', borderRadius: 1, border: '1px solid', borderColor: 'grey.700' }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            Payment Details
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ color: 'grey.300', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            <strong style={{ color: 'white' }}>Method:</strong> {withdrawal.paymentMethod}
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ color: 'grey.300', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            <strong style={{ color: 'white' }}>Account:</strong> {withdrawal.accountDetails}
                          </Typography>
                          {withdrawal.notes && (
                            <Typography variant="body2" gutterBottom sx={{ color: 'grey.300', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                              <strong style={{ color: 'white' }}>Notes:</strong> {withdrawal.notes}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                        Requested: {formatDate(withdrawal.createdAt)}
                      </Typography>
                      {withdrawal.processedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                          Processed: {formatDate(withdrawal.processedAt)}
                        </Typography>
                      )}
                    </Box>

                    {withdrawal.adminNotes && (
                      <Box sx={{ mt: 2, p: { xs: 1, md: 2 }, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Admin Notes:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {withdrawal.adminNotes}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <History sx={{ fontSize: { xs: 36, md: 48 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  No Withdrawal History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  You haven&apos;t made any withdrawal requests yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

    </Box>
  );
}

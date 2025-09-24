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
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  History,
  CheckCircle,
  Pending,
  Cancel,
  Add,
  AccountBalance,
  Phone,
  Email,
  AttachMoney
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
  
  // Withdrawal form states
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [withdrawalFormData, setWithdrawalFormData] = useState({
    amount: '',
    paymentMethodId: '',
    notes: ''
  });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  const { user, isAuthenticated } = context || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setPaymentMethodsLoading(true);
      const response = await fetch('/api/user/payment-methods', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        console.error('Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

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
          
          // Fetch withdrawal history and payment methods in parallel
          const [withdrawalResponse] = await Promise.all([
            fetch('/api/user/withdrawals', { credentials: 'include' }),
            fetchPaymentMethods()
          ]);

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

  // Handle withdrawal form submission
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawalFormData.amount || !withdrawalFormData.paymentMethodId) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(withdrawalFormData.amount);
    if (isNaN(amount) || amount < 1000) {
      setError('Minimum withdrawal amount is PKR 1,000');
      return;
    }

    if (amount > user.balance) {
      setError('Insufficient balance for withdrawal');
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      setError(null);
      
      const response = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          paymentMethodId: withdrawalFormData.paymentMethodId,
          notes: withdrawalFormData.notes || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Withdrawal request submitted successfully!');
        setWithdrawalFormData({ amount: '', paymentMethodId: '', notes: '' });
        setShowWithdrawalForm(false);
        
        // Refresh data
        if (context?.refreshUserData) {
          await context.refreshUserData();
        }
        
        // Refresh withdrawal history
        const withdrawalResponse = await fetch('/api/user/withdrawals', {
          credentials: 'include'
        });
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalHistory(withdrawalData.withdrawals || []);
        }
      } else {
        setError(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Error submitting withdrawal request');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setWithdrawalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get payment method icon
  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'bank_transfer':
        return <AccountBalance />;
      case 'easypaisa':
      case 'jazzcash':
        return <Phone />;
      case 'paypal':
        return <Email />;
      default:
        return <AttachMoney />;
    }
  };

  // Format payment method display
  const formatPaymentMethod = (method) => {
    switch (method.type) {
      case 'bank_transfer':
        return `${method.bankName} - ${method.accountName} (${method.accountNumber})`;
      case 'easypaisa':
      case 'jazzcash':
        return `${method.type.toUpperCase()} - ${method.accountName} (${method.mobileNumber})`;
      case 'paypal':
        return `PayPal - ${method.email}`;
      default:
        return method.type;
    }
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
        Withdraw Funds
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Balance Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
                Available Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(user?.balance || 0)}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
              <AttachMoney sx={{ fontSize: 30 }} />
            </Avatar>
          </Box>
        </CardContent>
      </Card>

      {/* Withdrawal Request Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              New Withdrawal Request
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowWithdrawalForm(true)}
              disabled={!user?.balance || user.balance < 1000}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                }
              }}
            >
              Request Withdrawal
            </Button>
          </Box>
          
          {(!user?.balance || user.balance < 1000) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Minimum balance of PKR 1,000 required to make withdrawal requests.
            </Alert>
          )}
          
          {paymentMethods.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                No payment methods found. Please add a payment method first.
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                component="a"
                href="/user-dashboard/payment-methods"
                sx={{ mt: 1 }}
              >
                Add Payment Method
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

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

      {/* Withdrawal Form Dialog */}
      <Dialog 
        open={showWithdrawalForm} 
        onClose={() => setShowWithdrawalForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Request Withdrawal
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleWithdrawalSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Amount Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Withdrawal Amount (PKR)"
                  type="number"
                  value={withdrawalFormData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  required
                  inputProps={{ min: 1000, max: user?.balance || 0 }}
                  helperText={`Minimum: PKR 1,000 | Maximum: ${formatCurrency(user?.balance || 0)}`}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>PKR</Typography>
                  }}
                />
              </Grid>

              {/* Payment Method Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={withdrawalFormData.paymentMethodId}
                    onChange={(e) => handleFormChange('paymentMethodId', e.target.value)}
                    label="Payment Method"
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getPaymentMethodIcon(method.type)}
                          <Box>
                            <Typography variant="body1">
                              {formatPaymentMethod(method)}
                            </Typography>
                            {method.isDefault && (
                              <Chip 
                                label="Default" 
                                size="small" 
                                color="primary" 
                                sx={{ height: 16, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Notes Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={withdrawalFormData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Add any additional notes for your withdrawal request..."
                />
              </Grid>

              {/* Withdrawal Summary */}
              {withdrawalFormData.amount && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Withdrawal Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Requested Amount:</Typography>
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(withdrawalFormData.amount)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="error">Processing Fee (10%):</Typography>
                      <Typography color="error" sx={{ fontWeight: 'bold' }}>
                        -{formatCurrency(parseFloat(withdrawalFormData.amount) * 0.1)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Net Amount:
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(parseFloat(withdrawalFormData.amount) * 0.9)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowWithdrawalForm(false)}
            disabled={submittingWithdrawal}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawalSubmit}
            variant="contained"
            disabled={submittingWithdrawal || !withdrawalFormData.amount || !withdrawalFormData.paymentMethodId}
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              }
            }}
          >
            {submittingWithdrawal ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

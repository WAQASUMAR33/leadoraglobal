"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Link
} from '@mui/material';
import {
  AccountBalance,
  AttachMoney,
  History,
  CheckCircle,
  Pending,
  Cancel,
  Info,
  Warning
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function WithdrawPage() {
  const context = useContext(UserContext);
  
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    paymentMethodId: '',
    notes: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated } = context || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      const fetchData = async () => {
        try {
          setHistoryLoading(true);
          
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

          // Fetch payment methods
          const paymentResponse = await fetch('/api/user/payment-methods', {
            credentials: 'include'
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            setPaymentMethods(paymentData.paymentMethods || []);
          } else {
            console.error('Failed to fetch payment methods');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setHistoryLoading(false);
        }
      };
      
      fetchData();
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

  // Helper function to get payment method type label
  const getPaymentMethodTypeLabel = (type) => {
    switch (type) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'easypaisa': return 'EasyPaisa';
      case 'jazzcash': return 'JazzCash';
      case 'paypal': return 'PayPal';
      default: return type;
    }
  };

  // Helper function to get payment method details
  const getPaymentMethodDetails = (method) => {
    switch (method.type) {
      case 'bank_transfer':
        return `${method.bankName} - ${method.accountNumber}`;
      case 'easypaisa':
      case 'jazzcash':
        return method.mobileNumber;
      case 'paypal':
        return method.email;
      default:
        return method.accountNumber || method.mobileNumber || method.email;
    }
  };

  // Withdrawal status options
  const statusOptions = {
    pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
    approved: { label: 'Approved', color: 'success', icon: <CheckCircle /> },
    rejected: { label: 'Rejected', color: 'error', icon: <Cancel /> },
    processing: { label: 'Processing', color: 'info', icon: <Pending /> }
  };


  const handleInputChange = (field, value) => {
    setWithdrawalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!withdrawalData.amount || parseFloat(withdrawalData.amount) <= 0) {
      setError('Please enter a valid withdrawal amount');
      return false;
    }

    if (parseFloat(withdrawalData.amount) < 1000) {
      setError('Minimum withdrawal amount is PKR 1,000');
      return false;
    }

    // Check minimum balance requirement
    if ((user?.balance || 0) < 1000) {
      setError('Minimum balance required is PKR 1,000 to make withdrawal requests');
      return false;
    }

    // Check if user has enough balance for the withdrawal amount
    if (parseFloat(withdrawalData.amount) > (user?.balance || 0)) {
      setError('Insufficient balance for withdrawal');
      return false;
    }

    if (!withdrawalData.paymentMethodId) {
      setError('Please select a payment method');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(withdrawalData.amount),
          paymentMethodId: parseInt(withdrawalData.paymentMethodId),
          notes: withdrawalData.notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Withdrawal request submitted successfully!');
        setWithdrawalData({
          amount: '',
          paymentMethodId: '',
          notes: ''
        });
        setConfirmDialogOpen(false);
        fetchWithdrawalHistory(); // Refresh history
        
        // Refresh user data to get updated balance
        if (context?.refreshUserData) {
          await context.refreshUserData();
        }
        
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (validateForm()) {
      setConfirmDialogOpen(true);
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
        Withdrawal Request
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Withdrawal Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                Request Withdrawal
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Current Balance */}
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance />
                    Available Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {formatCurrency(user?.balance || 0)}
                  </Typography>
                </Box>

                {/* Withdrawal Amount */}
                <TextField
                  label="Withdrawal Amount (PKR)"
                  type="number"
                  value={withdrawalData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 1000, step: 100 }}
                  helperText="Minimum withdrawal amount is PKR 1,000"
                />

                {/* Fee Information */}
                {withdrawalData.amount && parseFloat(withdrawalData.amount) > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'grey.800', borderRadius: 2, border: '1px solid', borderColor: 'grey.700' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                      <Info />
                      Withdrawal Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'grey.300' }}>Requested Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                          {formatCurrency(withdrawalData.amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'warning.light' }}>Processing Fee (10%):</Typography>
                        <Typography variant="body2" sx={{ color: 'warning.light', fontWeight: 'bold' }}>
                          -{formatCurrency(parseFloat(withdrawalData.amount) * 0.1)}
                        </Typography>
                      </Box>
                      <Divider sx={{ borderColor: 'grey.600' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>Amount You&apos;ll Receive:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.light' }}>
                          {formatCurrency(parseFloat(withdrawalData.amount) * 0.9)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic', color: 'grey.400' }}>
                        * Fee is deducted when withdrawal is approved by admin
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Payment Method Selection */}
                <FormControl fullWidth required>
                  <InputLabel>Select Payment Method</InputLabel>
                  <Select
                    value={withdrawalData.paymentMethodId}
                    onChange={(e) => handleInputChange('paymentMethodId', e.target.value)}
                    label="Select Payment Method"
                  >
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {getPaymentMethodTypeLabel(method.type)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getPaymentMethodDetails(method)}
                            </Typography>
                            {method.isDefault && (
                              <Typography variant="caption" color="success.main">
                                Default
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          No payment methods available. Please add a payment method first.
                        </Typography>
                      </MenuItem>
                    )}
                  </Select>
                  {paymentMethods.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      You need to add a payment method before making withdrawal requests. 
                      <Link href="/user-dashboard/payment-methods" sx={{ ml: 1, color: 'primary.main' }}>
                        Add Payment Method
                      </Link>
                    </Typography>
                  )}
                </FormControl>

                {/* Notes */}
                <TextField
                  label="Notes (Optional)"
                  multiline
                  rows={2}
                  value={withdrawalData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  fullWidth
                  placeholder="Any additional notes or instructions"
                />

                {/* Submit Button */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleConfirmSubmit}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Withdrawal History */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History />
                Withdrawal History
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : withdrawalHistory.length > 0 ? (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {withdrawalHistory.map((withdrawal) => (
                    <ListItem key={withdrawal.id} sx={{ px: 0, py: 1, flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ bgcolor: statusOptions[withdrawal.status]?.color + '.light', width: 32, height: 32 }}>
                          {statusOptions[withdrawal.status]?.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(withdrawal.amount)}
                            </Typography>
                            <Chip
                              label={statusOptions[withdrawal.status]?.label}
                              color={statusOptions[withdrawal.status]?.color}
                              size="small"
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {withdrawal.paymentMethod} • {formatDate(withdrawal.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Fee Breakdown */}
                      <Box sx={{ ml: 5, p: 1, bgcolor: 'grey.800', borderRadius: 1, fontSize: '0.75rem', border: '1px solid', borderColor: 'grey.700' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'grey.300' }}>Fee (10%):</Typography>
                          <Typography variant="caption" sx={{ color: 'error.light', fontWeight: 'bold' }}>
                            -{formatCurrency(withdrawal.feeAmount || 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: 'grey.300' }}>Net Amount:</Typography>
                          <Typography variant="caption" sx={{ color: 'success.light', fontWeight: 'bold' }}>
                            {formatCurrency(withdrawal.netAmount || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No withdrawal requests yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                Important Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  • Minimum withdrawal: PKR 1,000
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Processing fee: 10% of requested amount (deducted on approval)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Processing time: 1-3 business days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • KYC verification required
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Withdrawal History Section */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <History />
              Complete Withdrawal History
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : withdrawalHistory.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {withdrawalHistory.map((withdrawal) => (
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
                  You haven&apos;t made any withdrawal requests yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Withdrawal Request
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please review your withdrawal request details:
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.800', borderRadius: 1, border: '1px solid', borderColor: 'grey.700' }}>
            <Typography variant="body2" gutterBottom sx={{ color: 'grey.300' }}>
              <strong style={{ color: 'white' }}>Requested Amount:</strong> {formatCurrency(withdrawalData.amount)}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: 'warning.light' }}>
              <strong style={{ color: 'white' }}>Processing Fee (10%):</strong> -{formatCurrency(parseFloat(withdrawalData.amount) * 0.1)}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', color: 'success.light' }}>
              <strong style={{ color: 'white' }}>Amount You&apos;ll Receive:</strong> {formatCurrency(parseFloat(withdrawalData.amount) * 0.9)}
            </Typography>
            <Divider sx={{ my: 1, borderColor: 'grey.600' }} />
            <Typography variant="body2" sx={{ color: 'grey.300' }}>
              <strong style={{ color: 'white' }}>Payment Method:</strong> {(() => {
                const selectedMethod = paymentMethods.find(m => m.id === parseInt(withdrawalData.paymentMethodId));
                return selectedMethod ? `${getPaymentMethodTypeLabel(selectedMethod.type)} - ${getPaymentMethodDetails(selectedMethod)}` : 'Not selected';
              })()}
            </Typography>
            {withdrawalData.notes && (
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                <strong style={{ color: 'white' }}>Notes:</strong> {withdrawalData.notes}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Your withdrawal request will be reviewed and processed within 1-3 business days.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Confirm Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

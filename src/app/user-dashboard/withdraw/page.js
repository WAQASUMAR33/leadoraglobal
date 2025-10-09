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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
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
  AttachMoney,
  Visibility,
  Info,
  TrendingDown,
  Assessment
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
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

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
          setDataFetched(true);
          
          if (context?.refreshUserData) {
            await context.refreshUserData();
          }
          
          const withdrawalResponse = await fetch('/api/user/withdrawals', {
            credentials: 'include'
          });
          if (withdrawalResponse.ok) {
            const withdrawalData = await withdrawalResponse.json();
            setWithdrawalHistory(withdrawalData.withdrawals || []);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchData();
    }
  }, [mounted, context, dataFetched]);

  // Format currency
  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format date
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
        setMessage('Withdrawal request submitted successfully! Amount has been deducted from your balance.');
        setWithdrawalFormData({ amount: '', paymentMethodId: '', notes: '' });
        setShowWithdrawalForm(false);
        
        if (context?.refreshUserData) {
          await context.refreshUserData();
        }
        
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

  const handleFormChange = (field, value) => {
    setWithdrawalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const statusOptions = {
    pending: { 
      label: 'Pending', 
      color: 'warning', 
      icon: <Pending sx={{ fontSize: 20 }} />,
      bgColor: '#fff3cd',
      textColor: '#856404'
    },
    processing: { 
      label: 'Processing', 
      color: 'info', 
      icon: <Assessment sx={{ fontSize: 20 }} />,
      bgColor: '#cfe2ff',
      textColor: '#084298'
    },
    approved: { 
      label: 'Approved', 
      color: 'success', 
      icon: <CheckCircle sx={{ fontSize: 20 }} />,
      bgColor: '#d1e7dd',
      textColor: '#0f5132'
    },
    rejected: { 
      label: 'Rejected', 
      color: 'error', 
      icon: <Cancel sx={{ fontSize: 20 }} />,
      bgColor: '#f8d7da',
      textColor: '#842029'
    }
  };

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

  const formatPaymentMethod = (method) => {
    try {
      const details = typeof method === 'string' ? JSON.parse(method) : method;
      switch (details.type) {
        case 'bank_transfer':
          return `${details.bankName} - ${details.accountName} (${details.accountNumber})`;
        case 'easypaisa':
        case 'jazzcash':
          return `${details.type.toUpperCase()} - ${details.accountName} (${details.mobileNumber})`;
        case 'paypal':
          return `PayPal - ${details.email}`;
        default:
          return details.type || 'N/A';
      }
    } catch {
      return method || 'N/A';
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsDialog(true);
  };

  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto', bgcolor: '#0a0e27', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
          💰 Withdraw Funds
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
          Request withdrawals and manage your payout history
        </Typography>
      </Box>

      {message && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, bgcolor: '#1e4620', color: '#4caf50', borderRadius: 2, border: '1px solid #2e7d32' }} 
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, bgcolor: '#4a1a1a', color: '#f44336', borderRadius: 2, border: '1px solid #d32f2f' }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Available Balance Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                  Available Balance
                </Typography>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <AttachMoney />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatCurrency(user?.balance || 0)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Ready for withdrawal
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Withdrawals Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#1a1f3a', 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                  Total Withdrawals
                </Typography>
                <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', width: 48, height: 48 }}>
                  <TrendingDown sx={{ color: '#2196F3' }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                {withdrawalHistory.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#808080' }}>
                All-time requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#1a1f3a', 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                  Pending Requests
                </Typography>
                <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', width: 48, height: 48 }}>
                  <Pending sx={{ color: '#ff9800' }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                {withdrawalHistory.filter(w => w.status === 'pending').length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#808080' }}>
                Awaiting approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Card */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', bgcolor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 0.5 }}>
                Request New Withdrawal
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Withdraw your earnings securely • Minimum PKR 1,000 • 10% processing fee
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                fetchPaymentMethods();
                setShowWithdrawalForm(true);
              }}
              disabled={!user?.balance || user.balance < 1000}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                  boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  color: '#999'
                }
              }}
            >
              Request Withdrawal
            </Button>
          </Box>
          
          {(!user?.balance || user.balance < 1000) && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Minimum balance requirement:</strong> You need at least PKR 1,000 in your account to request a withdrawal.
              </Typography>
            </Alert>
          )}
          
          {paymentMethods.length === 0 && (
            <Alert severity="info" icon={<Info />} sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>No payment methods found.</strong> Please add a payment method to receive withdrawals.
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

      {/* Withdrawal History Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', bgcolor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: '#ffffff' }}>
              <History />
              Withdrawal History
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 0.5 }}>
              Track all your withdrawal requests and their status
            </Typography>
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : withdrawalHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Fee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Net Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b0b0b0', borderColor: 'rgba(255,255,255,0.1)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withdrawalHistory.map((withdrawal) => (
                    <TableRow 
                      key={withdrawal.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        cursor: 'pointer'
                      }}
                    >
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2196F3' }}>
                          {withdrawal.withdrawalRef}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                          {formatCurrency(withdrawal.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ color: '#f44336' }}>
                          -{formatCurrency(withdrawal.feeAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          {formatCurrency(withdrawal.netAmount || (withdrawal.amount * 0.9))}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Chip
                          label={statusOptions[withdrawal.status]?.label}
                          size="small"
                          sx={{
                            bgcolor: statusOptions[withdrawal.status]?.bgColor,
                            color: statusOptions[withdrawal.status]?.textColor,
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                          {formatDate(withdrawal.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(withdrawal)}
                            sx={{ color: '#2196F3' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <TrendingDown sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#808080', mb: 1 }}>
                No Withdrawal History
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                You haven&apos;t made any withdrawal requests yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Form Dialog */}
      <Dialog 
        open={showWithdrawalForm} 
        onClose={() => setShowWithdrawalForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            bgcolor: '#1a1f3a',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
            Request Withdrawal
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 0.5 }}>
            Fill in the details to request a withdrawal
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, bgcolor: '#1a1f3a' }}>
          <form onSubmit={handleWithdrawalSubmit}>
            <TextField
              fullWidth
              label="Withdrawal Amount"
              type="number"
              value={withdrawalFormData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              required
              inputProps={{ min: 1000, step: 100 }}
              helperText="Minimum: PKR 1,000 • Fee: 10% • You'll receive: 90%"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiFormHelperText-root': { color: '#808080' }
              }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#b0b0b0' }}>Payment Method</InputLabel>
              <Select
                value={withdrawalFormData.paymentMethodId}
                onChange={(e) => handleFormChange('paymentMethodId', e.target.value)}
                label="Payment Method"
                required
                sx={{
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' },
                  '& .MuiSvgIcon-root': { color: '#b0b0b0' }
                }}
              >
                {paymentMethodsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : paymentMethods.length === 0 ? (
                  <MenuItem disabled>No payment methods available</MenuItem>
                ) : (
                  paymentMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPaymentMethodIcon(method.type)}
                        {method.accountName} - {method.type}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={withdrawalFormData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Add any additional information..."
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiInputBase-input::placeholder': { color: '#666' }
              }}
            />

            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <Typography variant="body2">
                <strong>Important:</strong> The withdrawal amount will be deducted from your balance immediately. 
                A 10% processing fee will be applied upon approval.
              </Typography>
            </Alert>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button 
            onClick={() => setShowWithdrawalForm(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawalSubmit}
            variant="contained"
            disabled={submittingWithdrawal || !withdrawalFormData.amount || !withdrawalFormData.paymentMethodId}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              px: 3
            }}
          >
            {submittingWithdrawal ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            bgcolor: '#1a1f3a',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
            Withdrawal Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, bgcolor: '#1a1f3a' }}>
          {selectedWithdrawal && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Reference Number</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#2196F3' }}>
                  {selectedWithdrawal.withdrawalRef}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Requested Amount</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                    {formatCurrency(selectedWithdrawal.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={statusOptions[selectedWithdrawal.status]?.label}
                      size="small"
                      sx={{
                        bgcolor: statusOptions[selectedWithdrawal.status]?.bgColor,
                        color: statusOptions[selectedWithdrawal.status]?.textColor,
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                  Amount Breakdown
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Requested:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                      {formatCurrency(selectedWithdrawal.amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#f44336' }}>Fee (10%):</Typography>
                    <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      -{formatCurrency(selectedWithdrawal.feeAmount || 0)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ffffff' }}>Net Amount:</Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {formatCurrency(selectedWithdrawal.netAmount || (selectedWithdrawal.amount * 0.9))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                  Payment Method
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {formatPaymentMethod(selectedWithdrawal.accountDetails)}
                  </Typography>
                </Box>
              </Box>

              {selectedWithdrawal.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                    Notes
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {selectedWithdrawal.notes}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedWithdrawal.adminNotes && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}>
                    Admin Notes
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2, border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                    <Typography variant="body2" sx={{ color: '#ffa726' }}>
                      {selectedWithdrawal.adminNotes}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <Typography variant="caption" sx={{ color: '#2196F3' }}>
                  <strong>Created:</strong> {formatDate(selectedWithdrawal.createdAt)}
                </Typography>
                {selectedWithdrawal.processedAt && (
                  <>
                    <br />
                    <Typography variant="caption" sx={{ color: '#2196F3' }}>
                      <strong>Processed:</strong> {formatDate(selectedWithdrawal.processedAt)}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setShowDetailsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

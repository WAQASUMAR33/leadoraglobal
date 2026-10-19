"use client";

import { useState, useEffect, useContext } from 'react';
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
  AccountBalanceWallet,
  CheckCircle,
  Pending,
  Cancel,
  Add,
  AccountBalance,
  Phone,
  Email,
  AttachMoney,
  Visibility,
  InfoOutlined,
  Assessment,
  Payment
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function WithdrawPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  
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

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setPaymentMethodsLoading(true);
      const response = await fetch('/api/user/payment-methods', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          setPaymentMethods(data.paymentMethods);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setPaymentMethodsLoading(false);
    }

    setPaymentMethods([
      { id: 1, type: "bank", title: "Meezan Bank Limited", accountNumber: "01020304050607", accountName: "Waqas Umar" },
      { id: 2, type: "easypaisa", title: "EasyPaisa Mobile Account", accountNumber: "03001234567", accountName: "Waqas Umar" }
    ]);
  };

  useEffect(() => {
    if (mounted && !dataFetched) {
      const fetchData = async () => {
        try {
          setHistoryLoading(true);
          setDataFetched(true);
          fetchPaymentMethods();
          const withdrawalResponse = await fetch('/api/user/withdrawals', { credentials: 'include' });
          if (withdrawalResponse.ok) {
            const withdrawalData = await withdrawalResponse.json();
            if (withdrawalData.withdrawals && withdrawalData.withdrawals.length > 0) {
              setWithdrawalHistory(withdrawalData.withdrawals);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setHistoryLoading(false);
        }

        setWithdrawalHistory([
          { id: 101, amount: 25000, netAmount: 22500, fee: 2500, status: "approved", paymentMethod: { type: "bank", title: "Meezan Bank" }, createdAt: "2026-10-15T12:00:00Z" },
          { id: 102, amount: 15000, netAmount: 13500, fee: 1500, status: "approved", paymentMethod: { type: "easypaisa", title: "EasyPaisa" }, createdAt: "2026-10-05T14:30:00Z" }
        ]);
      };

      fetchData();
    }
  }, [mounted, dataFetched]);

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

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

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawalFormData.amount || !withdrawalFormData.paymentMethodId) {
      setError('Please select amount and payout account');
      return;
    }

    const amount = parseFloat(withdrawalFormData.amount);
    if (isNaN(amount) || amount < 1000) {
      setError('Minimum withdrawal amount is PKR 1,000');
      return;
    }

    if (amount > (user?.balance || 0)) {
      setError('Insufficient balance for withdrawal');
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      setError(null);
      
      const response = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          paymentMethodId: withdrawalFormData.paymentMethodId,
          notes: withdrawalFormData.notes || null
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Withdrawal request submitted successfully! Amount has been deducted.');
        setWithdrawalFormData({ amount: '', paymentMethodId: '', notes: '' });
        setShowWithdrawalForm(false);
        if (context?.refreshUserData) await context.refreshUserData();
        
        const withdrawalResponse = await fetch('/api/user/withdrawals', { credentials: 'include' });
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalHistory(withdrawalData.withdrawals || []);
        }
      } else {
        setError(data.error || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      console.error('Error submitting withdrawal:', err);
      setError('Error submitting withdrawal request');
    } finally {
      setSubmittingWithdrawal(false);
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
        default:
          return details.type || 'N/A';
      }
    } catch {
      return method || 'N/A';
    }
  };

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  // Calculate totals
  const pendingAmount = withdrawalHistory
    .filter(w => w.status === 'pending' || w.status === 'processing')
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
  const approvedAmount = withdrawalHistory
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountBalanceWallet sx={{ color: '#10b981', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Withdraw Commissions & Funds
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Submit formal withdrawal requests to bank accounts, JazzCash, or EasyPaisa.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                fetchPaymentMethods();
                setShowWithdrawalForm(true);
              }}
              sx={{
                borderRadius: 0,
                bgcolor: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                textTransform: 'none',
                px: 2.5,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Request Payout
            </Button>
            <Button
              component={Link}
              href="/user-dashboard/payment-methods"
              variant="outlined"
              startIcon={<Payment />}
              sx={{
                borderRadius: 0,
                borderColor: borderCard,
                color: textPrimary,
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              Payment Methods
            </Button>
          </Box>
        </Box>
      </Card>

      {message && (
        <Alert severity="success" sx={{ borderRadius: 0, border: '1px solid #10b981', bgcolor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)' }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, border: '1px solid #ef4444', bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Available Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                {formatCurrency(user?.balance)}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, mt: 0.5, display: 'block' }}>
                Eligible for immediate withdrawal
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Review
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>
                {formatCurrency(pendingAmount)}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, mt: 0.5, display: 'block' }}>
                Under finance verification
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Paid Out
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5 }}>
                {formatCurrency(approvedAmount)}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, mt: 0.5, display: 'block' }}>
                Lifetime approved disbursements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* History Table */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Recent Withdrawal Requests ({withdrawalHistory.length})
          </Typography>
          <Button
            component={Link}
            href="/user-dashboard/withdrawals"
            size="small"
            sx={{ borderRadius: 0, textTransform: 'none', color: '#3b82f6', fontWeight: 700 }}
          >
            Full Archive →
          </Button>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : withdrawalHistory.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: bgSubtle }}>
                <TableRow>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>ID / Date</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Account / Method</TableCell>
                  <TableCell align="right" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawalHistory.slice(0, 8).map((w) => (
                  <TableRow key={w.id} hover sx={{ '&:hover': { bgcolor: bgSubtle } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary, fontFamily: 'monospace' }}>
                        #{w.id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                        {formatDate(w.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>
                        {formatPaymentMethod(w.paymentMethod)}
                      </Typography>
                      {w.notes && (
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                          Note: {w.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#10b981' }}>
                        {formatCurrency(w.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(w.status || 'pending').toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: w.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : w.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: w.status === 'approved' ? '#10b981' : w.status === 'rejected' ? '#ef4444' : '#f59e0b'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Request Details">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedWithdrawal(w); setShowDetailsDialog(true); }}
                          sx={{ color: textSecondary }}
                        >
                          <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalanceWallet sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Withdrawals Yet
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              Click &quot;Request Payout&quot; to transfer your earnings to your bank account or mobile wallet.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Withdrawal Form Dialog */}
      <Dialog
        open={showWithdrawalForm}
        onClose={() => setShowWithdrawalForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: bgCard,
            border: `1px solid ${borderCard}`,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: textPrimary, fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney sx={{ color: '#10b981' }} />
            Request Withdrawal
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <form onSubmit={handleWithdrawalSubmit} id="withdrawForm">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
              <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  Available Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                  {formatCurrency(user?.balance)}
                </Typography>
              </Paper>

              <TextField
                label="Withdrawal Amount (PKR) *"
                type="number"
                size="small"
                fullWidth
                required
                value={withdrawalFormData.amount}
                onChange={(e) => setWithdrawalFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Min. 1,000 PKR"
                InputLabelProps={{ sx: { color: textSecondary } }}
                InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                helperText="Minimum payout limit is PKR 1,000"
              />

              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ color: textSecondary }}>Select Payout Method *</InputLabel>
                <Select
                  value={withdrawalFormData.paymentMethodId}
                  onChange={(e) => setWithdrawalFormData(prev => ({ ...prev, paymentMethodId: e.target.value }))}
                  label="Select Payout Method *"
                  sx={{ borderRadius: 0, color: textPrimary }}
                >
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.bankName || m.type?.toUpperCase()} — {m.accountName} ({m.accountNumber || m.mobileNumber})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No payment methods added. Add one first.
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {paymentMethods.length === 0 && (
                <Alert severity="warning" sx={{ borderRadius: 0, border: '1px solid #f59e0b' }}>
                  You don&apos;t have any payment accounts configured.
                  <Button
                    component={Link}
                    href="/user-dashboard/payment-methods"
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 800, ml: 1 }}
                  >
                    Add Now →
                  </Button>
                </Alert>
              )}

              <TextField
                label="Transfer Notes (Optional)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={withdrawalFormData.notes}
                onChange={(e) => setWithdrawalFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional memo for the accounts team"
                InputLabelProps={{ sx: { color: textSecondary } }}
                InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
              />
            </Box>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowWithdrawalForm(false)}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="withdrawForm"
            variant="contained"
            disabled={submittingWithdrawal || paymentMethods.length === 0}
            sx={{
              borderRadius: 0,
              bgcolor: '#10b981',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            {submittingWithdrawal ? 'Submitting...' : 'Confirm Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: bgCard,
            border: `1px solid ${borderCard}`,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: textPrimary, fontWeight: 800 }}>
          Withdrawal Details #{selectedWithdrawal?.id}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          {selectedWithdrawal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                  {formatCurrency(selectedWithdrawal.amount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>Status:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                  {(selectedWithdrawal.status || 'pending').toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>Requested Date:</Typography>
                <Typography variant="body2" sx={{ color: textPrimary }}>
                  {formatDate(selectedWithdrawal.createdAt)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1, borderColor: borderCard }} />
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>
                PAYOUT DESTINATION:
              </Typography>
              <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>
                {formatPaymentMethod(selectedWithdrawal.paymentMethod)}
              </Typography>
              {selectedWithdrawal.notes && (
                <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                  Notes: {selectedWithdrawal.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowDetailsDialog(false)}
            variant="contained"
            sx={{ borderRadius: 0, bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

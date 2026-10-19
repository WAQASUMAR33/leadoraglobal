"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  AccountBalanceWallet,
  SwapHoriz,
  CheckCircle,
  WarningAmber,
  Security,
  FlashOn
} from '@mui/icons-material';
import { UserContext } from '../../../../lib/userContext';
import { useAppTheme } from '../../../../context/AdminThemeContext';

export default function TransferToWalletPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [transferData, setTransferData] = useState({
    amount: '',
    fromAccount: '',
    toAccount: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/user/accounts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchAccounts();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const handleInputChange = (field, value) => {
    setTransferData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      setError('Please enter a valid transfer amount');
      return false;
    }
    if (parseFloat(transferData.amount) < 100) {
      setError('Minimum transfer amount is PKR 100');
      return false;
    }
    if (!transferData.fromAccount) {
      setError('Please select source account');
      return false;
    }
    if (!transferData.toAccount) {
      setError('Please select destination account');
      return false;
    }
    if (transferData.fromAccount === transferData.toAccount) {
      setError('Source and destination accounts cannot be the same');
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
      const response = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(transferData.amount),
          fromAccount: transferData.fromAccount,
          toAccount: transferData.toAccount,
          notes: transferData.notes
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Transfer completed successfully!');
        setTransferData({ amount: '', fromAccount: '', toAccount: '', notes: '' });
        setConfirmDialogOpen(false);
        fetchAccounts();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to complete transfer');
      }
    } catch (err) {
      console.error('Error completing transfer:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = () => {
    if (validateForm()) {
      setConfirmDialogOpen(true);
    }
  };

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString()}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SwapHoriz sx={{ color: '#3b82f6', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              Internal Account Transfer
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Move available balances instantly between your commissions wallet, shopping balance, and primary account.
            </Typography>
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

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 2 }}>
                Transfer Parameters
              </Typography>
              <Divider sx={{ mb: 3, borderColor: borderCard }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Transfer Amount (PKR) *"
                  type="number"
                  size="small"
                  fullWidth
                  value={transferData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Min. PKR 100"
                  InputLabelProps={{ sx: { color: textSecondary } }}
                  InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: textSecondary }}>Source Account *</InputLabel>
                  <Select
                    value={transferData.fromAccount}
                    onChange={(e) => handleInputChange('fromAccount', e.target.value)}
                    label="Source Account *"
                    sx={{ borderRadius: 0, color: textPrimary }}
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.name} — {formatCurrency(acc.balance)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: textSecondary }}>Destination Account *</InputLabel>
                  <Select
                    value={transferData.toAccount}
                    onChange={(e) => handleInputChange('toAccount', e.target.value)}
                    label="Destination Account *"
                    sx={{ borderRadius: 0, color: textPrimary }}
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.name} — {formatCurrency(acc.balance)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Remarks (Optional)"
                  multiline
                  rows={2}
                  size="small"
                  fullWidth
                  value={transferData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Reason or ledger reference"
                  InputLabelProps={{ sx: { color: textSecondary } }}
                  InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleConfirmTransfer}
                  disabled={loading}
                  startIcon={<FlashOn />}
                  sx={{
                    borderRadius: 0,
                    bgcolor: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 800,
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#2563eb' }
                  }}
                >
                  Review & Transfer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Policy & Guidance */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 1 }}>
                  Transfer Terms
                </Typography>
                <Divider sx={{ mb: 2, borderColor: borderCard }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase' }}>
                      Limit
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, mt: 0.5 }}>
                      Min: PKR 100 • Max: Available Balance
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                      Fee Structure
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, mt: 0.5 }}>
                      0% Transaction Fee for internal wallets
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                    <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 800, textTransform: 'uppercase' }}>
                      Settlement Speed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, mt: 0.5 }}>
                      Immediate execution with real-time balance adjustment
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber sx={{ color: '#f59e0b' }} />
            Confirm Wallet Transfer
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            Confirm transfer details below. Internal transfers are immediate:
          </Typography>
          <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, mb: 2 }}>
            <Typography variant="body2" sx={{ color: textPrimary, mb: 0.5 }}>
              <strong>Amount:</strong> {formatCurrency(transferData.amount)}
            </Typography>
            <Typography variant="body2" sx={{ color: textPrimary, mb: 0.5 }}>
              <strong>From:</strong> {accounts.find(a => a.id === transferData.fromAccount)?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: textPrimary }}>
              <strong>To:</strong> {accounts.find(a => a.id === transferData.toAccount)?.name}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 0,
              bgcolor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            {loading ? 'Processing...' : 'Confirm & Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

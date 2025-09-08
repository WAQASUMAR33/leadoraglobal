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
  MenuItem
} from '@mui/material';
import {
  AccountBalanceWallet,
  SwapHoriz,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function TransferToWalletPage() {
  const context = useContext(UserContext);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchAccounts();
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

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/user/accounts', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setTransferData(prev => ({
      ...prev,
      [field]: value
    }));
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
        headers: {
          'Content-Type': 'application/json'
        },
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
        setTransferData({
          amount: '',
          fromAccount: '',
          toAccount: '',
          notes: ''
        });
        setConfirmDialogOpen(false);
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to complete transfer');
      }
    } catch (error) {
      console.error('Error completing transfer:', error);
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

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount).toLocaleString()}`;
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
        Transfer to Wallet
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Transfer Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHoriz />
                Transfer Funds
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Transfer Amount */}
                <TextField
                  label="Transfer Amount (PKR)"
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 100, step: 10 }}
                  helperText="Minimum transfer amount is PKR 100"
                />

                {/* Source Account */}
                <FormControl fullWidth required>
                  <InputLabel>From Account</InputLabel>
                  <Select
                    value={transferData.fromAccount}
                    onChange={(e) => handleInputChange('fromAccount', e.target.value)}
                    label="From Account"
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Destination Account */}
                <FormControl fullWidth required>
                  <InputLabel>To Account</InputLabel>
                  <Select
                    value={transferData.toAccount}
                    onChange={(e) => handleInputChange('toAccount', e.target.value)}
                    label="To Account"
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Notes */}
                <TextField
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={transferData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  fullWidth
                  placeholder="Any additional notes for this transfer"
                />

                {/* Transfer Button */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleConfirmTransfer}
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
                  {loading ? 'Processing...' : 'Transfer Funds'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transfer Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet />
                Transfer Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Transfer Limits:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Minimum: PKR 100
                  </Typography>
                  <Typography variant="body2">
                    • Maximum: No limit
                  </Typography>
                </Alert>

                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Processing Time:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Instant transfer between your accounts
                  </Typography>
                  <Typography variant="body2">
                    • No fees charged
                  </Typography>
                </Alert>

                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Security:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • All transfers are secure
                  </Typography>
                  <Typography variant="body2">
                    • Transaction history is maintained
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Transfers */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transfers
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent transfers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            Confirm Transfer
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please review your transfer details:
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Transfer Amount:</strong> {formatCurrency(transferData.amount)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>From:</strong> {accounts.find(a => a.id === transferData.fromAccount)?.name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>To:</strong> {accounts.find(a => a.id === transferData.toAccount)?.name}
            </Typography>
            {transferData.notes && (
              <Typography variant="body2">
                <strong>Notes:</strong> {transferData.notes}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            This transfer will be processed instantly and cannot be reversed.
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
            {loading ? 'Processing...' : 'Confirm Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

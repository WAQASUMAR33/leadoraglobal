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
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ShoppingBag,
  Send,
  Refresh,
  SwapHoriz,
  CheckCircle,
  AccountBalanceWallet
} from '@mui/icons-material';
import { UserContext } from "../../../lib/userContext";
import { useAppTheme } from "../../../context/AdminThemeContext";

export default function TransferShoppingPage() {
  const { user, isAuthenticated } = useContext(UserContext) || {};
  const { isLight } = useAppTheme();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    username: '',
    amount: '',
    description: ''
  });
  const [shoppingAmount, setShoppingAmount] = useState(0);
  const [filterType, setFilterType] = useState('all');

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: filterType });
      const response = await fetch(`/api/user/shopping-transfers?${params}`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        setTransfers(result.data?.transfers || []);
      } else {
        setError('Failed to fetch transfer history');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Error loading transfer history');
    } finally {
      setLoading(false);
    }
  };

  const fetchShoppingAmount = async () => {
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setShoppingAmount(parseFloat(data.user.shoppingAmount || 0));
        }
      }
    } catch (err) {
      console.error('Error fetching shopping amount:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchShoppingAmount();
      fetchTransfers();
    }
  }, [isAuthenticated, filterType]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/shopping-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferForm)
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message || 'Shopping funds transferred successfully');
        setTransferDialog(false);
        setTransferForm({ username: '', amount: '', description: '' });
        fetchShoppingAmount();
        fetchTransfers();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError('Error processing transfer');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

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

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShoppingBag sx={{ color: '#06b6d4', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Transfer Shopping Amount
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Send accumulated shopping credits to other registered community members instantly.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setTransferDialog(true)}
            sx={{
              borderRadius: 0,
              bgcolor: '#06b6d4',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#0891b2' }
            }}
          >
            Send Shopping Credit
          </Button>
        </Box>
      </Card>

      {/* Balance Card */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Your Available Shopping Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#06b6d4', mt: 0.5 }}>
                {formatCurrency(shoppingAmount)}
              </Typography>
            </Box>
            <AccountBalanceWallet sx={{ fontSize: 48, color: '#06b6d4' }} />
          </Box>
        </CardContent>
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

      {/* Filter and Action Bar */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['all', 'sent', 'received'].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'contained' : 'outlined'}
                onClick={() => setFilterType(type)}
                size="small"
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: filterType === type ? '#06b6d4' : 'transparent',
                  borderColor: borderCard,
                  color: filterType === type ? '#ffffff' : textPrimary,
                  '&:hover': { bgcolor: filterType === type ? '#0891b2' : bgSubtle }
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => { fetchShoppingAmount(); fetchTransfers(); }}
            sx={{
              borderRadius: 0,
              borderColor: borderCard,
              color: textPrimary,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Refresh
          </Button>
        </Box>
      </Card>

      {/* Transfers Table */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            Shopping Credit Activity ({transfers.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#06b6d4' }} />
          </Box>
        ) : transfers.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: bgSubtle }}>
                <TableRow>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Counterparty</TableCell>
                  <TableCell align="right" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</TableCell>
                  <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((t) => {
                  const isSent = t.type === 'sent' || t.fromUserId === user?.id;
                  return (
                    <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: bgSubtle } }}>
                      <TableCell>
                        <Chip
                          label={isSent ? 'SENT' : 'RECEIVED'}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            bgcolor: isSent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: isSent ? '#ef4444' : '#10b981'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                          {isSent ? `To: ${t.toUser || t.recipientUsername || '-'}` : `From: ${t.fromUser || t.senderUsername || '-'}`}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 900, color: isSent ? '#ef4444' : '#10b981' }}>
                          {isSent ? '-' : '+'}{formatCurrency(t.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                        {t.description || '-'}
                      </TableCell>
                      <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                        {formatDate(t.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingBag sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No Shopping Transfers Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              Transfers of shopping credits to and from other members will be recorded here.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialog}
        onClose={() => setTransferDialog(false)}
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
            <Send sx={{ color: '#06b6d4' }} />
            Send Shopping Credit
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <form id="transferShoppingForm" onSubmit={handleTransferSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  Available Shopping Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#06b6d4', mt: 0.5 }}>
                  {formatCurrency(shoppingAmount)}
                </Typography>
              </Paper>

              <TextField
                label="Recipient Username *"
                required
                size="small"
                fullWidth
                value={transferForm.username}
                onChange={(e) => setTransferForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter member username"
                InputLabelProps={{ sx: { color: textSecondary } }}
                InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
              />

              <TextField
                label="Transfer Amount (PKR) *"
                type="number"
                required
                size="small"
                fullWidth
                value={transferForm.amount}
                onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                InputLabelProps={{ sx: { color: textSecondary } }}
                InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
              />

              <TextField
                label="Description / Note (Optional)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={transferForm.description}
                onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Reason or invoice note"
                InputLabelProps={{ sx: { color: textSecondary } }}
                InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
              />
            </Box>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setTransferDialog(false)}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="transferShoppingForm"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 0,
              bgcolor: '#06b6d4',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0891b2' }
            }}
          >
            {loading ? 'Processing...' : 'Send Credit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

"use client";

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Send,
  AccountBalanceWallet,
  Refresh,
  Person,
  CheckCircle,
  SwapHoriz
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function TransferToOthersPage() {
  const { user, isAuthenticated } = useContext(UserContext);
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

  const [filters, setFilters] = useState({
    type: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: filters.type
      });

      const response = await fetch(`/api/user/transfers?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setTransfers(result.data?.transfers || []);
        if (result.data?.pagination) {
          setPagination(result.data.pagination);
        }
      } else {
        setError('Failed to fetch transfer history');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Error loading transfer history');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.type]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransfers();
    }
  }, [pagination.page, filters.type, isAuthenticated, fetchTransfers]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferForm)
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message || 'Balance transferred successfully');
        setTransferDialog(false);
        setTransferForm({ username: '', amount: '', description: '' });
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
            <SwapHoriz sx={{ color: '#3b82f6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                P2P Member Wallet Transfer
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Directly transfer E-Wallet funds to any member using their username with zero network delay.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setTransferDialog(true)}
            sx={{
              borderRadius: 0,
              bgcolor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Transfer to Member
          </Button>
        </Box>
      </Card>

      {/* Balance Card */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Your Current Available Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                {formatCurrency(user?.balance)}
              </Typography>
            </Box>
            <AccountBalanceWallet sx={{ fontSize: 48, color: '#10b981' }} />
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: textSecondary }}>Transfer Type</InputLabel>
            <Select
              value={filters.type}
              label="Transfer Type"
              onChange={(e) => {
                setFilters(prev => ({ ...prev, type: e.target.value }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              sx={{ borderRadius: 0, color: textPrimary }}
            >
              <MenuItem value="all">All Transfers</MenuItem>
              <MenuItem value="sent">Sent P2P</MenuItem>
              <MenuItem value="received">Received P2P</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => fetchTransfers()}
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
            P2P Transaction Ledger ({transfers.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#2563eb' }} />
          </Box>
        ) : transfers.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: bgSubtle }}>
                  <TableRow>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Direction</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Member Counterparty</TableCell>
                    <TableCell align="right" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Description / Memo</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t) => {
                    const isSent = t.fromUserId === user?.id || t.type === 'sent';
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

            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={(e, val) => setPagination(prev => ({ ...prev, page: val }))}
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 0,
                      color: textPrimary
                    }
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SwapHoriz sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
              No P2P Transfers Found
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              Transfers to other members will appear here once executed.
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
            <Send sx={{ color: '#3b82f6' }} />
            Transfer Wallet Funds
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <form id="transferToOthersForm" onSubmit={handleTransferSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  Available Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                  {formatCurrency(user?.balance)}
                </Typography>
              </Paper>

              <TextField
                label="Recipient Member Username *"
                required
                size="small"
                fullWidth
                value={transferForm.username}
                onChange={(e) => setTransferForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter exact username"
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
                label="Remarks (Optional)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={transferForm.description}
                onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Transfer memo"
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
            form="transferToOthersForm"
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
            {loading ? 'Processing...' : 'Send Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

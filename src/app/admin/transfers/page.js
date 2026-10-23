"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
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
  Chip,
  IconButton,
  InputAdornment,
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
  CircularProgress,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export default function AdminTransfersPage() {
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
    type: 'all',
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: filters.type,
        status: filters.status
      });

      const response = await fetch(`/api/admin/transfers?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setTransfers(result.data.transfers || []);
        setPagination(result.data.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 0 });
      } else {
        setError('Failed to fetch transfer history');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Error loading transfer history');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.type, filters.status]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferForm)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTransferDialog(false);
        setTransferForm({ username: '', amount: '', description: '' });
        fetchTransfers();
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <SwapHorizIcon sx={{ color: '#818cf8', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Direct Wallet Transfers
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Disburse funds directly into recipient user wallets and monitor peer-to-peer ledger activity.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchTransfers}
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 0,
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              '&:hover': { borderColor: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.1)' }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            onClick={() => setTransferDialog(true)}
            sx={{
              borderRadius: 0,
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            New Transfer
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity="success" sx={{ borderRadius: 0, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by username..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontSize: 18 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  sx={{
                    borderRadius: 0,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' }
                  }}
                >
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Transfer Types</MenuItem>
                  <MenuItem value="admin_to_user" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Admin Disbursal</MenuItem>
                  <MenuItem value="user_to_user" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Peer to Peer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{
                    borderRadius: 0,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' }
                  }}
                >
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Statuses</MenuItem>
                  <MenuItem value="completed" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Completed</MenuItem>
                  <MenuItem value="pending" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Pending</MenuItem>
                  <MenuItem value="failed" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            Transfer Ledger History
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {transfers.length} Transactions Listed
          </Typography>
        </Box>

        {loading && transfers.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 2 }}>
            <CircularProgress size={36} sx={{ color: '#6366f1' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Loading Transfers...</Typography>
          </Box>
        ) : transfers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <SwapHorizIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>No Transfer Records Found</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ID & TYPE
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    SENDER (FROM)
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    RECIPIENT (TO)
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    NOTE / DESCRIPTION
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    DATE
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' }, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>#{t.id}</Typography>
                      <Chip
                        label={t.transferType === 'admin_to_user' ? 'ADMIN DISBURSE' : 'P2P'}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          height: 18,
                          backgroundColor: t.transferType === 'admin_to_user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: t.transferType === 'admin_to_user' ? '#818cf8' : 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {t.fromUser ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>{t.fromUser.fullname}</Typography>
                          <Typography variant="caption" sx={{ color: '#818cf8' }}>@{t.fromUser.username}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 700 }}>System Vault</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>{t.toUser?.fullname}</Typography>
                      <Typography variant="caption" sx={{ color: '#38bdf8' }}>@{t.toUser?.username}</Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 800 }}>
                        PKR {parseFloat(t.amount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
                      {t.description || 'No comment'}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Chip
                        label={(t.status || 'completed').toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          backgroundColor: t.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: t.status === 'completed' ? '#34d399' : '#f87171',
                          border: `1px solid ${t.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                      {formatDate(t.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialog}
        onClose={() => setTransferDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Direct Transfer to User</Typography>
          <IconButton onClick={() => setTransferDialog(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleTransferSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Recipient Username"
              value={transferForm.username}
              onChange={(e) => setTransferForm({ ...transferForm, username: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              required
              fullWidth
              size="small"
              type="number"
              label="Amount (PKR)"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Transfer Description / Reason"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setTransferDialog(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" disabled={loading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {loading ? 'Processing...' : 'Transfer Funds'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

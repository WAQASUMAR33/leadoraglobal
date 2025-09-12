"use client";

import { useState, useEffect, useContext } from 'react';
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
  Grid
} from '@mui/material';
import {
  Send,
  Search,
  Person,
  AccountBalance,
  History,
  CheckCircle,
  Cancel,
  Refresh,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function TransferToOthersPage() {
  const { user, isAuthenticated } = useContext(UserContext);
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

  // Filters and pagination
  const [filters, setFilters] = useState({
    type: 'all' // 'sent', 'received', 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  // Fetch transfers
  const fetchTransfers = async () => {
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
        setTransfers(result.data.transfers);
        setPagination(result.data.pagination);
      } else {
        setError('Failed to fetch transfer history');
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Error loading transfer history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransfers();
    }
  }, [pagination.page, filters.type, isAuthenticated]);

  // Handle transfer form submission
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transferForm)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTransferDialog(false);
        setTransferForm({ username: '', amount: '', description: '' });
        fetchTransfers(); // Refresh the list
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setError('Error processing transfer');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Check if transfer is sent or received
  const isSentTransfer = (transfer) => {
    return transfer.fromUserId === user?.id;
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Please log in to access this page</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Transfer to Others
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send money to other users and view your transfer history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setTransferDialog(true)}
          sx={{ minWidth: 150 }}
        >
          Send Money
        </Button>
      </Box>

      {/* Current Balance */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" color="primary.main">
                Current Balance
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                PKR {user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
              </Typography>
            </Box>
            <AccountBalance sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filters.type}
                label="Filter"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="all">All Transfers</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="received">Received</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTransfers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Transfer History Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <History sx={{ mr: 1 }} />
            <Typography variant="h6">Transfer History</Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No transfers found
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => {
                    const isSent = isSentTransfer(transfer);
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell>#{transfer.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isSent ? (
                              <>
                                <TrendingDown color="error" />
                                <Chip label="Sent" color="error" size="small" />
                              </>
                            ) : (
                              <>
                                <TrendingUp color="success" />
                                <Chip label="Received" color="success" size="small" />
                              </>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {transfer.fromUser ? (
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {transfer.fromUser.fullname}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{transfer.fromUser.username}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              System
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {transfer.toUser.fullname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{transfer.toUser.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium" 
                            color={isSent ? "error.main" : "success.main"}
                          >
                            {isSent ? '-' : '+'}PKR {parseFloat(transfer.amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transfer.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.status}
                            color={getStatusColor(transfer.status)}
                            size="small"
                            icon={transfer.status === 'completed' ? <CheckCircle /> : <Cancel />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(transfer.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Send sx={{ mr: 1 }} />
            Send Money to User
          </Box>
        </DialogTitle>
        <form onSubmit={handleTransferSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Recipient Username"
                value={transferForm.username}
                onChange={(e) => setTransferForm(prev => ({ ...prev, username: e.target.value }))}
                required
                fullWidth
                placeholder="Enter username of the recipient"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Amount (PKR)"
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                required
                fullWidth
                placeholder="Enter amount to transfer"
                inputProps={{ min: 0, step: 0.01, max: user?.balance || 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalance />
                    </InputAdornment>
                  ),
                }}
                helperText={`Available balance: PKR ${user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}`}
              />

              <TextField
                label="Description (Optional)"
                value={transferForm.description}
                onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                placeholder="Enter description for this transfer"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransferDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Processing...' : 'Send Money'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}









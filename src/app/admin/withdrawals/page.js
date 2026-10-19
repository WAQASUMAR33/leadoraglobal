'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SyncIcon from '@mui/icons-material/Sync';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    { value: 'approved', label: 'Approved', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
    { value: 'rejected', label: 'Rejected', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
    { value: 'processing', label: 'Processing', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' }
  ];

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...withdrawals];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(w => 
        (w.withdrawalRef || '').toLowerCase().includes(q) ||
        (w.user?.fullname || '').toLowerCase().includes(q) ||
        (w.user?.username || '').toLowerCase().includes(q) ||
        (w.user?.email || '').toLowerCase().includes(q)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(w => w.status === filters.status);
    }

    setFilteredWithdrawals(filtered);
  }, [withdrawals, filters]);

  useEffect(() => {
    applyFilters();
  }, [withdrawals, filters, applyFilters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawals', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      } else {
        setError('Failed to fetch withdrawal requests');
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Network error while fetching withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setNewStatus(withdrawal.status);
    setAdminNotes(withdrawal.adminNotes || '');
    setShowStatusModal(true);
  };

  const handleViewPaymentGateway = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowPaymentGatewayModal(true);
  };

  const updateWithdrawalStatus = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        setWithdrawals(withdrawals.map(w => 
          w.id === selectedWithdrawal.id 
            ? { ...w, status: newStatus, adminNotes: adminNotes }
            : w
        ));
        setShowStatusModal(false);
        setSelectedWithdrawal(null);
        setAdminNotes('');
      } else {
        setError('Failed to update withdrawal status');
      }
    } catch (err) {
      console.error('Error updating withdrawal status:', err);
      setError('Network error while updating withdrawal status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const opt = statusOptions.find(o => o.value === status);
    return (
      <Chip
        label={opt ? opt.label.toUpperCase() : (status || 'UNKNOWN').toUpperCase()}
        size="small"
        sx={{
          borderRadius: 0,
          fontWeight: 700,
          fontSize: '0.68rem',
          backgroundColor: opt ? opt.bg : 'rgba(255,255,255,0.08)',
          color: opt ? opt.color : 'rgba(255,255,255,0.8)',
          border: `1px solid ${opt ? opt.color + '44' : 'rgba(255,255,255,0.15)'}`
        }}
      />
    );
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

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount || 0).toLocaleString()}`;
  };

  if (loading && withdrawals.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Withdrawal Ledger...
        </Typography>
      </Box>
    );
  }

  // Summary counts
  const totalVolume = withdrawals.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PaymentsOutlinedIcon sx={{ color: '#f87171', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Withdrawal Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Process member payout requests, verify recipient bank details, and enforce audit compliance.
          </Typography>
        </Box>

        <Button
          onClick={fetchWithdrawals}
          variant="outlined"
          size="small"
          startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 0,
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 600,
            '&:hover': { borderColor: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.1)' }
          }}
        >
          Refresh Ledger
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.01) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>
                  PENDING REQUESTS
                </Typography>
                <HourglassEmptyIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#fbbf24' }}>
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.01) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>
                  SETTLED / APPROVED
                </Typography>
                <CheckCircleIcon sx={{ color: '#34d399', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#34d399' }}>
                {approvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.01) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>
                  TOTAL REQUESTED VOLUME
                </Typography>
                <PaymentsOutlinedIcon sx={{ color: '#818cf8', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#818cf8' }}>
                {formatCurrency(totalVolume)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by reference, user name, or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontSize: 20 }} />
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                  <MenuItem value="pending" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Pending</MenuItem>
                  <MenuItem value="approved" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Approved</MenuItem>
                  <MenuItem value="processing" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Processing</MenuItem>
                  <MenuItem value="rejected" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            Withdrawal Request Ledger
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {filteredWithdrawals.length} Entries
          </Typography>
        </Box>

        {filteredWithdrawals.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <PaymentsOutlinedIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
              No Withdrawal Requests Found
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5, display: 'block' }}>
              No withdrawal records match the active criteria.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    REFERENCE & MEMBER
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    AMOUNTS (FEE / NET)
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    PAYMENT CHANNEL
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    TIMESTAMP
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow
                    key={withdrawal.id}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                      borderColor: 'rgba(255,255,255,0.04)'
                    }}
                  >
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700, fontSize: '0.82rem' }}>
                        {withdrawal.withdrawalRef}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mt: 0.3 }}>
                        {withdrawal.user?.fullname || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                        @{withdrawal.user?.username} • {withdrawal.user?.email}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700 }}>
                        {formatCurrency(withdrawal.amount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#f87171', display: 'block' }}>
                        Fee: -{formatCurrency(withdrawal.feeAmount || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700, display: 'block' }}>
                        Net: {formatCurrency(withdrawal.netAmount || 0)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                        {withdrawal.paymentMethod}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {getStatusBadge(withdrawal.status)}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                      {formatDate(withdrawal.createdAt)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewWithdrawal(withdrawal)}
                            size="small"
                            sx={{
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              borderRadius: 0,
                              p: 0.8,
                              '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.1)' }
                            }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Gateway Account Information">
                          <IconButton
                            onClick={() => handleViewPaymentGateway(withdrawal)}
                            size="small"
                            sx={{
                              color: '#34d399',
                              border: '1px solid rgba(52, 211, 153, 0.25)',
                              borderRadius: 0,
                              p: 0.8,
                              '&:hover': { backgroundColor: 'rgba(52, 211, 153, 0.1)' }
                            }}
                          >
                            <AccountBalanceOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Update Status">
                          <IconButton
                            onClick={() => handleUpdateStatus(withdrawal)}
                            size="small"
                            sx={{
                              color: '#818cf8',
                              border: '1px solid rgba(129, 140, 248, 0.25)',
                              borderRadius: 0,
                              p: 0.8,
                              '&:hover': { backgroundColor: 'rgba(129, 140, 248, 0.1)' }
                            }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: '#0d131f',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
              Withdrawal Order Details
            </Typography>
            <Typography variant="caption" sx={{ color: '#818cf8', fontFamily: 'monospace' }}>
              REF: {selectedWithdrawal?.withdrawalRef}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowDetailsModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedWithdrawal && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#818cf8', mb: 1.5 }}>
                      MEMBER INFORMATION
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Full Name:</Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>{selectedWithdrawal.user?.fullname || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Username:</Typography>
                        <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600 }}>@{selectedWithdrawal.user?.username}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Email:</Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff' }}>{selectedWithdrawal.user?.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>User ID:</Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>{selectedWithdrawal.userId}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#34d399', mb: 1.5 }}>
                      FINANCIAL SETTLEMENT
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Gross Amount:</Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>{formatCurrency(selectedWithdrawal.amount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#f87171' }}>Platform Fee (10%):</Typography>
                        <Typography variant="caption" sx={{ color: '#f87171', fontWeight: 700 }}>-{formatCurrency(selectedWithdrawal.feeAmount || 0)}</Typography>
                      </Box>
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700 }}>Net Disbursed:</Typography>
                        <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem' }}>{formatCurrency(selectedWithdrawal.netAmount || 0)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Status:</Typography>
                        {getStatusBadge(selectedWithdrawal.status)}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fbbf24', mb: 1 }}>
                      ACCOUNT DETAILS / INSTRUCTIONS
                    </Typography>
                    <Box sx={{ p: 1.5, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 0 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-line', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {selectedWithdrawal.accountDetails || 'No specific account string provided.'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            onClick={() => setShowDetailsModal(false)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: '#0d131f',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Update Withdrawal Status
          </Typography>
          <IconButton onClick={() => setShowStatusModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedWithdrawal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Box sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                  Target Request Reference:
                </Typography>
                <Typography variant="body2" sx={{ color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>
                  {selectedWithdrawal.withdrawalRef} ({formatCurrency(selectedWithdrawal.amount)})
                </Typography>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Select Next State</InputLabel>
                <Select
                  value={newStatus}
                  label="Select Next State"
                  onChange={(e) => setNewStatus(e.target.value)}
                  sx={{
                    borderRadius: 0,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' }
                  }}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Administrative Audit Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Include internal references, bank transaction IDs, or reason for rejection..."
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                InputProps={{
                  sx: {
                    borderRadius: 0,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            onClick={() => setShowStatusModal(false)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
          >
            Cancel
          </Button>
          <Button
            onClick={updateWithdrawalStatus}
            disabled={updating}
            variant="contained"
            size="small"
            sx={{
              borderRadius: 0,
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            {updating ? 'Updating...' : 'Commit Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Gateway Dialog */}
      <Dialog
        open={showPaymentGatewayModal}
        onClose={() => setShowPaymentGatewayModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: '#0d131f',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Payment Gateway Details
          </Typography>
          <IconButton onClick={() => setShowPaymentGatewayModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedWithdrawal && (
            <Box sx={{ mt: 1 }}>
              {(() => {
                try {
                  const details = JSON.parse(selectedWithdrawal.accountDetails);
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Account Title / Name:</Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700 }}>{details.accountName || 'N/A'}</Typography>
                      </Box>
                      {details.bankName && (
                        <Box sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Bank Organization:</Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>{details.bankName}</Typography>
                        </Box>
                      )}
                      {details.accountNumber && (
                        <Box sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Account / IBAN Number:</Typography>
                          <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>{details.accountNumber}</Typography>
                        </Box>
                      )}
                      {details.mobileNumber && (
                        <Box sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Mobile Wallet Phone:</Typography>
                          <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>{details.mobileNumber}</Typography>
                        </Box>
                      )}
                    </Box>
                  );
                } catch {
                  return (
                    <Box sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography variant="body2" sx={{ color: '#ffffff', whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                        {selectedWithdrawal.accountDetails}
                      </Typography>
                    </Box>
                  );
                }
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            onClick={() => setShowPaymentGatewayModal(false)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

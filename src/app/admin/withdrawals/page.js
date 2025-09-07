"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Visibility,
  Edit,
  AttachMoney,
  Person,
  CalendarToday,
  AccountBalance,
  CheckCircle,
  Cancel,
  Pending,
  Info
} from '@mui/icons-material';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Withdrawal status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'processing', label: 'Processing', color: 'info' }
  ];

  useEffect(() => {
    fetchWithdrawals();
  }, []);

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
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Network error while fetching withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setWithdrawalDialogOpen(true);
  };

  const handleUpdateStatus = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setNewStatus(withdrawal.status);
    setAdminNotes(withdrawal.adminNotes || '');
    setStatusDialogOpen(true);
  };

  const updateWithdrawalStatus = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        // Update the withdrawal in the local state
        setWithdrawals(withdrawals.map(withdrawal => 
          withdrawal.id === selectedWithdrawal.id 
            ? { ...withdrawal, status: newStatus, adminNotes: adminNotes }
            : withdrawal
        ));
        setStatusDialogOpen(false);
        setSelectedWithdrawal(null);
        setAdminNotes('');
      } else {
        setError('Failed to update withdrawal status');
      }
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      setError('Network error while updating withdrawal status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'processing': return <Pending />;
      default: return <Pending />;
    }
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

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Withdrawal Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {withdrawal.withdrawalRef}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {withdrawal.user?.fullname || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {withdrawal.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(withdrawal.amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fee: {formatCurrency(withdrawal.feeAmount || 0)}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                          Net: {formatCurrency(withdrawal.netAmount || 0)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalance fontSize="small" color="action" />
                        <Typography variant="body2">
                          {withdrawal.paymentMethod}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={withdrawal.status}
                        color={getStatusColor(withdrawal.status)}
                        size="small"
                        variant="outlined"
                        icon={getStatusIcon(withdrawal.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(withdrawal.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewWithdrawal(withdrawal)}
                            color="primary"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(withdrawal)}
                            color="secondary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {withdrawals.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No withdrawal requests found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Details Dialog */}
      <Dialog
        open={withdrawalDialogOpen}
        onClose={() => setWithdrawalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney />
            Withdrawal Details - {selectedWithdrawal?.withdrawalRef}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box sx={{ mt: 2 }}>
              {/* Withdrawal Summary */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        User Information
                      </Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedWithdrawal.user?.fullname || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>User ID:</strong> {selectedWithdrawal.userId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedWithdrawal.user?.email || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Withdrawal Details
                      </Typography>
                      <Typography variant="body2">
                        <strong>Requested Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        <strong>Withdrawal Fee (20%):</strong> -{formatCurrency(selectedWithdrawal.feeAmount || 0)}
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                        <strong>Net Amount:</strong> {formatCurrency(selectedWithdrawal.netAmount || 0)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Payment Method:</strong> {selectedWithdrawal.paymentMethod}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> 
                        <Chip
                          label={selectedWithdrawal.status}
                          color={getStatusColor(selectedWithdrawal.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Account Details */}
              <Typography variant="h6" gutterBottom>
                <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
                Account Details
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {selectedWithdrawal.accountDetails}
                  </Typography>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedWithdrawal.notes && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    User Notes
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2">
                        {selectedWithdrawal.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Admin Notes */}
              {selectedWithdrawal.adminNotes && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Admin Notes
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2">
                        {selectedWithdrawal.adminNotes}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawalDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Withdrawal Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reference: {selectedWithdrawal?.withdrawalRef}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Amount: {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Chip
                      label={option.label}
                      color={option.color}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin Notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Add any notes or comments about this withdrawal request"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={updateWithdrawalStatus}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

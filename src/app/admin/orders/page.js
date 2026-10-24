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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Filter states
  const [usernameFilter, setUsernameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    { value: 'processing', label: 'Processing', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    { value: 'shipped', label: 'Shipped', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
    { value: 'delivered', label: 'Delivered', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    { value: 'cancelled', label: 'Cancelled', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending Payment', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    { value: 'paid', label: 'Paid Verified', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    { value: 'failed', label: 'Failed', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
    { value: 'refunded', label: 'Refunded', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Network error while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (usernameFilter.trim()) {
      filtered = filtered.filter(order => 
        order.user?.username?.toLowerCase().includes(usernameFilter.toLowerCase()) ||
        order.user?.fullname?.toLowerCase().includes(usernameFilter.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, usernameFilter, statusFilter, paymentStatusFilter]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setStatusDialogOpen(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus
        })
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus, paymentStatus: newPaymentStatus }
            : order
        ));
        setStatusDialogOpen(false);
        setSelectedOrder(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Network error while updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusChip = (status, options) => {
    const opt = options.find(o => o.value === status);
    return (
      <Chip
        label={opt ? opt.label.toUpperCase() : (status || '').toUpperCase()}
        size="small"
        sx={{
          borderRadius: 0,
          fontWeight: 700,
          fontSize: '0.65rem',
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

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString()}`;

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Order Management Ledger...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ReceiptLongIcon sx={{ color: '#818cf8', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Order Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Track member ecommerce purchases, update delivery status, and verify checkout settlements.
          </Typography>
        </Box>

        <Button
          onClick={fetchOrders}
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
          Sync Orders
        </Button>
      </Box>

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
                placeholder="Search order number or username..."
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Order Statuses</MenuItem>
                  {statusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
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
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Payment States</MenuItem>
                  {paymentStatusOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            Orders Registry
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {filteredOrders.length} Orders Listed
          </Typography>
        </Box>

        {filteredOrders.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
              No Orders Found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ORDER # & CUSTOMER
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ITEMS & TOTAL
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    DELIVERY STATUS
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    PAYMENT STATUS
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
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' }, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        {order.user?.fullname || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                        @{order.user?.username}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 800 }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                        {order.orderItems?.length || 0} Products Ordered
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {getStatusChip(order.status, statusOptions)}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {getStatusChip(order.paymentStatus, paymentStatusOptions)}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                      {formatDate(order.createdAt)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                        <Tooltip title="View Order Items & Address">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order)}
                            sx={{ color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 0, p: 0.8 }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Fulfillment Status">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(order)}
                            sx={{ color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: 0, p: 0.8 }}
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

      {/* Order Details Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Order Details</Typography>
            <Typography variant="caption" sx={{ color: '#818cf8', fontFamily: 'monospace' }}>ORDER #{selectedOrder?.orderNumber}</Typography>
          </Box>
          <IconButton onClick={() => setOrderDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#818cf8', mb: 1 }}>CUSTOMER</Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>{selectedOrder.user?.fullname}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>@{selectedOrder.user?.username} • {selectedOrder.user?.email}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#34d399', mb: 1 }}>PAYMENT & AMOUNT</Typography>
                      <Typography variant="h6" sx={{ color: '#34d399', fontWeight: 800 }}>{formatCurrency(selectedOrder.totalAmount)}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {getStatusChip(selectedOrder.status, statusOptions)}
                        {getStatusChip(selectedOrder.paymentStatus, paymentStatusOptions)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Items */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>ORDERED ITEMS</Typography>
                <TableContainer sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.06)' }}>Product</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.06)' }}>Unit Price</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.06)' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.06)' }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.orderItems?.map(item => (
                        <TableRow key={item.id} sx={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff' }}>{item.product?.title || 'Product'}</TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{formatCurrency(item.price)}</TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', color: '#818cf8', fontWeight: 700 }}>x{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)', color: '#34d399', fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Shipping Address */}
              <Box sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fbbf24', mb: 1 }}>SHIPPING ADDRESS</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line' }}>
                  {typeof selectedOrder.shippingAddress === 'string' ? selectedOrder.shippingAddress : JSON.stringify(selectedOrder.shippingAddress, null, 2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setOrderDialogOpen(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Update Order Status</Typography>
          <Typography variant="caption" sx={{ color: '#818cf8' }}>Order: #{selectedOrder?.orderNumber}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Delivery Status</InputLabel>
            <Select
              value={newStatus}
              label="Delivery Status"
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{
                borderRadius: 0,
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              {statusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Payment Status</InputLabel>
            <Select
              value={newPaymentStatus}
              label="Payment Status"
              onChange={(e) => setNewPaymentStatus(e.target.value)}
              sx={{
                borderRadius: 0,
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              {paymentStatusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setStatusDialogOpen(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
          <Button onClick={updateOrderStatus} disabled={updating} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
            {updating ? 'Updating...' : 'Save State'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

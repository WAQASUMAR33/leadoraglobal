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
  Divider
} from '@mui/material';
import {
  Visibility,
  Edit,
  LocalShipping,
  Payment,
  Person,
  ShoppingCart,
  CalendarToday,
  AttachMoney
} from '@mui/icons-material';

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

  // Order status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'processing', label: 'Processing', color: 'info' },
    { value: 'shipped', label: 'Shipped', color: 'primary' },
    { value: 'delivered', label: 'Delivered', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending Payment Proof', color: 'warning' },
    { value: 'paid', label: 'Paid', color: 'success' },
    { value: 'failed', label: 'Failed', color: 'error' },
    { value: 'refunded', label: 'Refunded', color: 'info' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, usernameFilter, statusFilter, paymentStatusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filter by username
    if (usernameFilter.trim()) {
      filtered = filtered.filter(order => 
        order.user?.username?.toLowerCase().includes(usernameFilter.toLowerCase()) ||
        order.user?.fullname?.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by payment status
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus, paymentStatus: newPaymentStatus }
            : order
        ));
        setStatusDialogOpen(false);
        setSelectedOrder(null);
        
        // Show success message if balance was added
        if (result.message && result.message.includes('balance')) {
          setError(null);
          // You could add a success notification here
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Network error while updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  const getPaymentStatusColor = (status) => {
    const statusOption = paymentStatusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'default';
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
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        Order Management
      </Typography>

      {/* New Logic Information */}
      <Alert severity="info" sx={{ mb: 3, bgcolor: 'info.dark', color: 'info.contrastText' }}>
        <Typography variant="body2">
          <strong>New Shopping Logic:</strong> Users without active packages can shop and send payment proof. 
          When you approve their order (set status to &quot;Delivered&quot; and payment to &quot;Paid&quot;), 
          the order amount will be automatically added to their account balance.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: 'error.dark', color: 'error.contrastText' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by Username"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.secondary' }}>Order Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Order Status"
                  sx={{
                    bgcolor: 'background.default',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
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
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.secondary' }}>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  label="Payment Status"
                  sx={{
                    bgcolor: 'background.default',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="all">All Payment Statuses</MenuItem>
                  {paymentStatusOptions.map((option) => (
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent>
          <TableContainer sx={{ maxHeight: '70vh', bgcolor: 'background.default' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.paper' }}>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Order #</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Customer</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Items</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Total</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Payment</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Date</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 'bold', bgcolor: 'background.paper' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {order.user?.fullname || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            @{order.user?.username || 'N/A'} (ID: {order.userId})
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCart fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {order.orderItems?.length || 0} items
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        color={getPaymentStatusColor(order.paymentStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {formatDate(order.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order)}
                            color="primary"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(order)}
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

          {filteredOrders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
              </Typography>
              {orders.length > 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Try adjusting your search criteria
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            Order Details - {selectedOrder?.orderNumber}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              {/* Order Summary */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Customer Information
                      </Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedOrder.user?.fullname || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>User ID:</strong> {selectedOrder.userId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Order Summary
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Amount:</strong> {formatCurrency(selectedOrder.totalAmount)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> 
                        <Chip
                          label={selectedOrder.status}
                          color={getStatusColor(selectedOrder.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2">
                        <strong>Payment:</strong> 
                        <Chip
                          label={selectedOrder.paymentStatus}
                          color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Order Items */}
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.orderItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={item.product?.image}
                              variant="rounded"
                              sx={{ width: 40, height: 40 }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {item.product?.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {item.productId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell>
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Shipping Address
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {JSON.parse(selectedOrder.shippingAddress)}
                      </Typography>
                    </CardContent>
                  </Card>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>
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
        PaperProps={{
          sx: { bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle sx={{ color: 'text.primary' }}>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} gutterBottom>
              Order: {selectedOrder?.orderNumber}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} gutterBottom>
              Customer: {selectedOrder?.user?.fullname} (@{selectedOrder?.user?.username})
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} gutterBottom>
              Amount: {formatCurrency(selectedOrder?.totalAmount)}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Order Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Order Status"
                sx={{
                  bgcolor: 'background.default',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                }}
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

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Payment Status</InputLabel>
              <Select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                label="Payment Status"
                sx={{
                  bgcolor: 'background.default',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                }}
              >
                {paymentStatusOptions.map((option) => (
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

            {/* Balance Addition Notice */}
            {newStatus === 'delivered' && newPaymentStatus === 'paid' && (
              <Alert severity="info" sx={{ mt: 2, bgcolor: 'info.dark', color: 'info.contrastText' }}>
                <Typography variant="body2">
                  <strong>Note:</strong> If the customer doesn&apos;t have an active package, 
                  the order amount will be automatically added to their account balance.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={updateOrderStatus}
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


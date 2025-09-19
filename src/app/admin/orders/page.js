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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
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
          status: newStatus
        })
      });

      if (response.ok) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus }
            : order
        ));
        setStatusDialogOpen(false);
        setSelectedOrder(null);
      } else {
        setError('Failed to update order status');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Order Management
      </Typography>

      {/* New Logic Information */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>New Shopping Logic:</strong> Users without active packages can shop and send payment proof. 
          When you approve their order (set status to &quot;Delivered&quot; and payment to &quot;Paid&quot;), 
          the order amount will be automatically added to their account balance.
        </Typography>
      </Alert>

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
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {order.user?.fullname || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {order.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCart fontSize="small" color="action" />
                        <Typography variant="body2">
                          {order.orderItems?.length || 0} items
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
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

          {orders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No orders found
              </Typography>
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
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order: {selectedOrder?.orderNumber}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
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


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
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
        Order Management
      </Typography>

      {/* New Logic Information */}
      <Alert severity="info" sx={{ mb: 3, bgcolor: '#e3f2fd', color: '#1976d2' }}>
        <Typography variant="body2">
          <strong>New Shopping Logic:</strong> Users without active packages can shop and send payment proof. 
          When you approve their order (set status to &quot;Delivered&quot; and payment to &quot;Paid&quot;), 
          the order amount will be automatically added to their account balance.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: '#ffebee', color: '#d32f2f' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Card sx={{ mb: 3, bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#333', mb: 2 }}>
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
                    bgcolor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666' }}>Order Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Order Status"
                  sx={{
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
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
                <InputLabel sx={{ color: '#666' }}>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  label="Payment Status"
                  sx={{
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
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

      <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <TableContainer sx={{ maxHeight: '70vh', bgcolor: '#ffffff' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Order #</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Customer</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Items</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Total</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Status</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Payment</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Date</TableCell>
                  <TableCell sx={{ color: '#333', fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                    <TableCell sx={{ color: '#333' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#333' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
                          {order.user?.fullname || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          @{order.user?.username || 'N/A'} (ID: {order.userId})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#333' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCart fontSize="small" sx={{ color: '#666' }} />
                        <Typography variant="body2" sx={{ color: '#333' }}>
                          {order.orderItems?.length || 0} items
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#333' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
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
                    <TableCell sx={{ color: '#333' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" sx={{ color: '#666' }} />
                        <Typography variant="body2" sx={{ color: '#333' }}>
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
              <Typography variant="h6" sx={{ color: '#666' }}>
                {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
              </Typography>
              {orders.length > 0 && (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
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
        PaperProps={{
          sx: { 
            bgcolor: '#ffffff',
            backgroundImage: 'none'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              bgcolor: '#f8f9fa', 
              borderBottom: '1px solid #e0e0e0',
              color: '#333'
            }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart sx={{ color: '#1976d2' }} />
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                  Order Details - {selectedOrder.orderNumber}
                </Typography>
          </Box>
        </DialogTitle>
            <DialogContent sx={{ bgcolor: '#ffffff', pt: 3 }}>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              {/* Order Summary */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', borderColor: '#dee2e6' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2 }}>
                        👤 Customer Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Name:</strong> {selectedOrder.user?.fullname || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Username:</strong> @{selectedOrder.user?.username || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>User ID:</strong> {selectedOrder.userId}
                      </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Email:</strong> {selectedOrder.user?.email || 'N/A'}
                      </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Phone:</strong> {selectedOrder.user?.phoneNumber || 'N/A'}
                      </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', borderColor: '#dee2e6' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2 }}>
                        📊 Order Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Total Amount:</strong> 
                          <Typography component="span" sx={{ ml: 1, fontWeight: 'bold', color: '#1976d2', fontSize: '1.1rem' }}>
                            {formatCurrency(selectedOrder.totalAmount)}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong style={{ color: '#333' }}>Order Date:</strong> {formatDate(selectedOrder.createdAt)}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#555', mb: 0.5 }}>
                            <strong style={{ color: '#333' }}>Status:</strong>
                      </Typography>
                        <Chip
                          label={selectedOrder.status}
                          color={getStatusColor(selectedOrder.status)}
                          size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#555', mb: 0.5 }}>
                            <strong style={{ color: '#333' }}>Payment Status:</strong>
                      </Typography>
                        <Chip
                          label={selectedOrder.paymentStatus}
                          color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                          size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3, borderColor: '#e0e0e0' }} />

              {/* Order Items */}
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2 }}>
                🛒 Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff', borderColor: '#dee2e6' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell sx={{ color: '#333', fontWeight: 'bold', borderColor: '#dee2e6' }}>Product</TableCell>
                      <TableCell sx={{ color: '#333', fontWeight: 'bold', borderColor: '#dee2e6' }}>Price</TableCell>
                      <TableCell sx={{ color: '#333', fontWeight: 'bold', borderColor: '#dee2e6' }}>Quantity</TableCell>
                      <TableCell sx={{ color: '#333', fontWeight: 'bold', borderColor: '#dee2e6' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.orderItems?.map((item) => (
                      <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                        <TableCell sx={{ borderColor: '#dee2e6' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
                              {item.product?.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Product ID: {item.productId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#555', borderColor: '#dee2e6' }}>
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell sx={{ color: '#555', borderColor: '#dee2e6' }}>
                          <Chip label={item.quantity} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: '#dee2e6' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1rem' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Shipping Address */}
              <Divider sx={{ my: 3, borderColor: '#e0e0e0' }} />
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
                Shipping Details
                  </Typography>
              <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', borderColor: '#dee2e6' }}>
                    <CardContent>
                  {selectedOrder.shippingAddress ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(() => {
                        try {
                          const address = typeof selectedOrder.shippingAddress === 'string' 
                            ? JSON.parse(selectedOrder.shippingAddress) 
                            : selectedOrder.shippingAddress;
                          
                          if (typeof address === 'object' && address !== null) {
                            return Object.entries(address).map(([key, value]) => (
                              <Typography key={key} variant="body2" sx={{ color: '#555' }}>
                                <strong style={{ color: '#333', textTransform: 'capitalize' }}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </strong>{' '}
                                {value || 'N/A'}
                              </Typography>
                            ));
                          }
                          return (
                            <Typography variant="body2" sx={{ color: '#555', whiteSpace: 'pre-line' }}>
                              {address || 'No shipping address provided'}
                            </Typography>
                          );
                        } catch (error) {
                          console.error('Error parsing shipping address:', error);
                          return (
                            <Typography variant="body2" sx={{ color: '#555', whiteSpace: 'pre-line' }}>
                              {selectedOrder.shippingAddress}
                            </Typography>
                          );
                        }
                      })()}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      p: 2, 
                      bgcolor: '#fff3cd', 
                      borderRadius: 1,
                      border: '1px solid #ffc107'
                    }}>
                      <Typography variant="body2" sx={{ color: '#856404' }}>
                        ⚠️ No shipping address provided for this order
                      </Typography>
                    </Box>
                  )}
                    </CardContent>
                  </Card>
            </Box>
          )}
            </DialogContent>
            <DialogActions sx={{ 
              bgcolor: '#f8f9fa', 
              borderTop: '1px solid #e0e0e0',
              px: 3,
              py: 2
            }}>
              <Button 
                onClick={() => setOrderDialogOpen(false)}
                variant="contained"
                sx={{ 
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ color: '#333' }}>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
              Order: {selectedOrder?.orderNumber}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
              Customer: {selectedOrder?.user?.fullname} (@{selectedOrder?.user?.username})
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }} gutterBottom>
              Amount: {formatCurrency(selectedOrder?.totalAmount)}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel sx={{ color: '#666' }}>Order Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Order Status"
                sx={{
                  bgcolor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
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
              <InputLabel sx={{ color: '#666' }}>Payment Status</InputLabel>
              <Select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                label="Payment Status"
                sx={{
                  bgcolor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
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
              <Alert severity="info" sx={{ mt: 2, bgcolor: '#e3f2fd', color: '#1976d2' }}>
                <Typography variant="body2">
                  <strong>Note:</strong> If the customer doesn&apos;t have an active package, 
                  the order amount will be automatically added to their account balance.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} sx={{ color: '#666' }}>
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


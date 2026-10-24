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
  Divider,
  TablePagination,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  Edit,
  LocalShipping,
  Payment,
  ShoppingCart,
  CalendarToday,
  AttachMoney,
  Receipt,
  OpenInNew,
  Close,
  Image as ImageIcon,
  Search,
  Clear
} from '@mui/icons-material';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Filter states
  const [usernameFilter, setUsernameFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Pagination states (default 50 records per page)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

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

  const fetchOrders = async (targetPage = page, targetLimit = rowsPerPage, targetStatus = statusFilter, targetPayment = paymentStatusFilter, targetSearch = debouncedSearch) => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({
        page: (targetPage + 1).toString(),
        limit: targetLimit.toString()
      });
      if (targetStatus && targetStatus !== 'all') {
        params.append('status', targetStatus);
      }
      if (targetPayment && targetPayment !== 'all') {
        params.append('paymentStatus', targetPayment);
      }
      if (targetSearch && targetSearch.trim()) {
        params.append('search', targetSearch.trim());
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        if (data.pagination) {
          setTotalCount(data.pagination.total || 0);
        }
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error while fetching orders');
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  };

  // Debounce search input so typing is completely smooth and does not trigger reloads on every stroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(usernameFilter);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [usernameFilter]);

  // Fetch when page, limits, filters, or debounced search change
  useEffect(() => {
    fetchOrders(page, rowsPerPage, statusFilter, paymentStatusFilter, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, paymentStatusFilter, debouncedSearch]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePaymentStatusChange = (e) => {
    setPaymentStatusFilter(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setUsernameFilter(e.target.value);
  };

  const handleClearSearch = () => {
    setUsernameFilter('');
    setDebouncedSearch('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  if (initialLoading) {
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#333' }}>
              Filters
            </Typography>
            <Chip 
              label={`Total Historical Orders: ${totalCount}`} 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }} 
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Order #, Tx ID, Customer"
                placeholder="Type name, email, or order #..."
                value={usernameFilter}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(usernameFilter);
                    setPage(0);
                  }
                }}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#888', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: usernameFilter ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} edge="end">
                        <Clear sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
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
                  onChange={handleStatusChange}
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
                  onChange={handlePaymentStatusChange}
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

      <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ height: 4 }}>
          {tableLoading && <LinearProgress sx={{ bgcolor: '#e3f2fd' }} />}
        </Box>
        <CardContent sx={{ pt: 1 }}>
          <TableContainer sx={{ maxHeight: '70vh', bgcolor: '#ffffff', opacity: tableLoading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
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
                {orders.map((order) => (
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                        <Chip
                          label={order.paymentStatus}
                          color={getPaymentStatusColor(order.paymentStatus)}
                          size="small"
                          variant="outlined"
                        />
                        {order.paymentMethod && (
                          <Typography variant="caption" sx={{ color: '#666', textTransform: 'capitalize', fontSize: '0.72rem' }}>
                            {order.paymentMethod}
                          </Typography>
                        )}
                        {order.paymentProof && (
                          <Chip
                            icon={<Receipt sx={{ fontSize: '14px !important' }} />}
                            label="Receipt"
                            size="small"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({
                                url: order.paymentProof,
                                title: `Payment Receipt - ${order.orderNumber}`,
                                transactionId: order.transactionId,
                                method: order.paymentMethod
                              });
                            }}
                            sx={{
                              height: 22,
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              bgcolor: '#e3f2fd',
                              color: '#1565c0',
                              '&:hover': { bgcolor: '#bbdefb' }
                            }}
                          />
                        )}
                      </Box>
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

          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 200]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            showFirstButton
            showLastButton
            sx={{
              borderTop: '1px solid #dee2e6',
              bgcolor: '#f8f9fa'
            }}
          />

          {orders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#666' }}>
                No orders found
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                Try adjusting your search or filter criteria
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

              {/* Payment Information & Proof */}
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment sx={{ color: '#1976d2' }} />
                Payment Information &amp; Proof
              </Typography>
              <Grid container spacing={3} sx={{ mb: 1 }}>
                <Grid item xs={12} md={selectedOrder.paymentProof ? 6 : 12}>
                  <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', borderColor: '#dee2e6', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                        💳 Payment Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Payment Method</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333', textTransform: 'capitalize' }}>
                            {selectedOrder.paymentMethod || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Transaction ID / Ref #</Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold', 
                            color: '#1976d2',
                            bgcolor: '#e3f2fd',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            border: '1px solid #90caf9'
                          }}>
                            {selectedOrder.transactionId || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Payment Status</Typography>
                          <Chip
                            label={selectedOrder.paymentStatus}
                            color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                            size="small"
                            sx={{ fontWeight: 'bold', mt: 0.5 }}
                          />
                        </Box>
                        {selectedOrder.paymentDetails && (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Additional Details</Typography>
                            <Typography variant="caption" sx={{ color: '#555', wordBreak: 'break-all', display: 'block', bgcolor: '#ffffff', p: 1, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                              {typeof selectedOrder.paymentDetails === 'string' 
                                ? selectedOrder.paymentDetails 
                                : JSON.stringify(selectedOrder.paymentDetails, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedOrder.paymentProof ? (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: '#f8f9fa', borderColor: '#dee2e6', height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                            🧾 Payment Proof / Receipt
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNew sx={{ fontSize: '15px !important' }} />}
                            onClick={() => window.open(selectedOrder.paymentProof, '_blank')}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.3 }}
                          >
                            Open Original
                          </Button>
                        </Box>
                        <Box
                          onClick={() => setPreviewImage({
                            url: selectedOrder.paymentProof,
                            title: `Payment Receipt - ${selectedOrder.orderNumber}`,
                            transactionId: selectedOrder.transactionId,
                            method: selectedOrder.paymentMethod
                          })}
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px dashed #90caf9',
                            bgcolor: '#ffffff',
                            cursor: 'pointer',
                            maxHeight: 220,
                            minHeight: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#1976d2',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                              '& .hover-overlay': { opacity: 1 }
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={selectedOrder.paymentProof}
                            alt="Payment Proof Receipt"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 220,
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                          <Box
                            className="hover-overlay"
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              bgcolor: 'rgba(0, 0, 0, 0.45)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              opacity: 0,
                              transition: 'opacity 0.2s ease'
                            }}
                          >
                            <Visibility sx={{ fontSize: 32, mb: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              Click to Enlarge Receipt
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: '#fffde7', borderColor: '#ffe082', height: '100%' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#856404', fontWeight: 'bold' }}>
                            ⚠️ No Payment Proof Uploaded
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#856404', display: 'block', mt: 0.5 }}>
                            This order was placed without manual slip upload (e.g. user had active package or balance).
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
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

            {selectedOrder?.paymentProof && (
              <Box sx={{ mt: 2, mb: 1, p: 1.5, bgcolor: '#f0f7ff', borderRadius: 1.5, border: '1px solid #bbdefb' }}>
                <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  💳 Attached Payment Proof:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#333', fontSize: '0.85rem' }}>
                    Tx ID: <strong>{selectedOrder.transactionId || 'N/A'}</strong> ({selectedOrder.paymentMethod || 'Manual'})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Receipt sx={{ fontSize: '15px !important' }} />}
                    onClick={() => setPreviewImage({
                      url: selectedOrder.paymentProof,
                      title: `Payment Receipt - ${selectedOrder.orderNumber}`,
                      transactionId: selectedOrder.transactionId,
                      method: selectedOrder.paymentMethod
                    })}
                    sx={{ textTransform: 'none', py: 0.2, fontSize: '0.75rem' }}
                  >
                    View Receipt
                  </Button>
                </Box>
              </Box>
            )}
            
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
      {/* Payment Receipt Full Preview Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#ffffff', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#333' }}>
              {previewImage?.title || 'Payment Receipt'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPreviewImage(null)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
          {previewImage?.transactionId && (
            <Box sx={{ mb: 1.5, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={`Transaction ID: ${previewImage.transactionId}`} 
                size="small" 
                sx={{ fontFamily: 'monospace', fontWeight: 'bold', bgcolor: '#ffffff', border: '1px solid #e0e0e0' }} 
              />
              {previewImage?.method && (
                <Chip 
                  label={`Method: ${previewImage.method}`} 
                  size="small" 
                  color="primary" 
                  sx={{ textTransform: 'capitalize' }} 
                />
              )}
            </Box>
          )}
          <Box
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              p: 1,
              bgcolor: '#ffffff',
              borderRadius: 1,
              boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)'
            }}
          >
            <Box
              component="img"
              src={previewImage?.url}
              alt="Payment Receipt Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: 1
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button
            startIcon={<OpenInNew />}
            onClick={() => window.open(previewImage?.url, '_blank')}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Open in New Tab
          </Button>
          <Button
            onClick={() => setPreviewImage(null)}
            variant="contained"
            sx={{ bgcolor: '#1976d2', textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


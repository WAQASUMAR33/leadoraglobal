"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountBalance,
  PhoneAndroid,
  CreditCard,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function PaymentMethodsPage() {
  const context = useContext(UserContext);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    mobileNumber: '',
    email: '',
    isDefault: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchPaymentMethods();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);
  
  // Safety check for context
  if (!context) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  const { user, isAuthenticated } = context;

  const paymentTypes = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'easypaisa', label: 'EasyPaisa' },
    { value: 'jazzcash', label: 'JazzCash' },
    { value: 'paypal', label: 'PayPal' }
  ];

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/payment-methods', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        setError('Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Error loading payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenDialog = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        type: method.type,
        accountName: method.accountName || '',
        accountNumber: method.accountNumber || '',
        bankName: method.bankName || '',
        branchCode: method.branchCode || '',
        mobileNumber: method.mobileNumber || '',
        email: method.email || '',
        isDefault: method.isDefault || false
      });
    } else {
      setEditingMethod(null);
      setFormData({
        type: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        branchCode: '',
        mobileNumber: '',
        email: '',
        isDefault: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      type: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchCode: '',
      mobileNumber: '',
      email: '',
      isDefault: false
    });
  };

  const validateForm = () => {
    if (!formData.type) {
      setError('Please select a payment method type');
      return false;
    }

    if (!formData.accountName.trim()) {
      setError('Please enter account holder name');
      return false;
    }

    if (formData.type === 'bank_transfer') {
      if (!formData.accountNumber.trim()) {
        setError('Please enter account number');
        return false;
      }
      if (!formData.bankName.trim()) {
        setError('Please enter bank name');
        return false;
      }
    } else if (formData.type === 'easypaisa' || formData.type === 'jazzcash') {
      if (!formData.mobileNumber.trim()) {
        setError('Please enter mobile number');
        return false;
      }
    } else if (formData.type === 'paypal') {
      if (!formData.email.trim()) {
        setError('Please enter PayPal email');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const url = editingMethod 
        ? `/api/user/payment-methods/${editingMethod.id}`
        : '/api/user/payment-methods';
      
      const method = editingMethod ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(editingMethod ? 'Payment method updated successfully!' : 'Payment method added successfully!');
        handleCloseDialog();
        fetchPaymentMethods();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/user/payment-methods/${methodId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage('Payment method deleted successfully!');
        fetchPaymentMethods();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'bank_transfer':
        return <AccountBalance />;
      case 'easypaisa':
      case 'jazzcash':
        return <PhoneAndroid />;
      case 'paypal':
        return <CreditCard />;
      default:
        return <CreditCard />;
    }
  };

  const getPaymentMethodDetails = (method) => {
    switch (method.type) {
      case 'bank_transfer':
        return `${method.bankName} - ${method.accountNumber}`;
      case 'easypaisa':
      case 'jazzcash':
        return method.mobileNumber;
      case 'paypal':
        return method.email;
      default:
        return method.accountNumber || method.mobileNumber || method.email;
    }
  };

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Payment Methods
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
            }
          }}
        >
          Add Payment Method
        </Button>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Payment Methods List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Payment Methods ({paymentMethods.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : paymentMethods.length > 0 ? (
            <List>
              {paymentMethods.map((method) => (
                <ListItem key={method.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 2 }}>
                  <ListItemIcon>
                    {getPaymentMethodIcon(method.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">
                          {method.accountName}
                        </Typography>
                        {method.isDefault && (
                          <Chip label="Default" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {paymentTypes.find(t => t.value === method.type)?.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getPaymentMethodDetails(method)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => handleOpenDialog(method)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(method.id)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CreditCard sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Payment Methods
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add a payment method to make withdrawal requests.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Add Your First Payment Method
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Payment Method Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Payment Method Type"
                >
                  {paymentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={formData.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
                required
              />
            </Grid>

            {formData.type === 'bank_transfer' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Branch Code (Optional)"
                    value={formData.branchCode}
                    onChange={(e) => handleInputChange('branchCode', e.target.value)}
                  />
                </Grid>
              </>
            )}

            {(formData.type === 'easypaisa' || formData.type === 'jazzcash') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  required
                  placeholder="03XX-XXXXXXX"
                />
              </Grid>
            )}

            {formData.type === 'paypal' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="PayPal Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Make sure all information is accurate. 
                  Incorrect details may result in failed transactions.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingMethod ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

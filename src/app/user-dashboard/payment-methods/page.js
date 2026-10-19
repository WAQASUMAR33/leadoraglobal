'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Payment,
  AccountBalance,
  PhoneIphone,
  Add,
  Edit,
  Delete,
  Search,
  Star,
  StarBorder,
  WarningAmber
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function PaymentMethodsPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: "bank", title: "Meezan Bank Limited", accountNumber: "01020304050607", accountName: "Waqas Umar", branchCode: "0102" },
    { id: 2, type: "easypaisa", title: "EasyPaisa Mobile Account", accountNumber: "03001234567", accountName: "Waqas Umar" }
  ]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState([
    { id: 1, type: "bank", title: "Meezan Bank Limited", accountNumber: "01020304050607", accountName: "Waqas Umar", branchCode: "0102" },
    { id: 2, type: "easypaisa", title: "EasyPaisa Mobile Account", accountNumber: "03001234567", accountName: "Waqas Umar" }
  ]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  });
  const [formData, setFormData] = useState({
    type: 'bank_transfer',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ibanNumber: '',
    branchCode: '',
    mobileNumber: '',
    email: '',
    isDefault: false
  });

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/payment-methods', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (context?.isAuthenticated && context?.user) {
      fetchPaymentMethods();
    }
  }, [context?.isAuthenticated, context?.user]);

  const applyFilters = useCallback(() => {
    let filtered = [...paymentMethods];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(m =>
        m.bankName?.toLowerCase().includes(q) ||
        m.accountName?.toLowerCase().includes(q) ||
        m.accountNumber?.toLowerCase().includes(q) ||
        m.mobileNumber?.toLowerCase().includes(q)
      );
    }
    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    setFilteredPaymentMethods(filtered);
  }, [paymentMethods, filters]);

  useEffect(() => {
    applyFilters();
  }, [paymentMethods, filters, applyFilters]);

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          type: 'bank_transfer',
          bankName: '',
          accountName: '',
          accountNumber: '',
          ibanNumber: '',
          branchCode: '',
          mobileNumber: '',
          email: '',
          isDefault: false
        });
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Error adding method:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditPaymentMethod = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${selectedPaymentMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedPaymentMethod(null);
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Error updating method:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${selectedPaymentMethod.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedPaymentMethod(null);
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Error deleting method:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (method) => {
    setSelectedPaymentMethod(method);
    setFormData({
      type: method.type,
      bankName: method.bankName || '',
      accountName: method.accountName || '',
      accountNumber: method.accountNumber || '',
      ibanNumber: method.ibanNumber || '',
      branchCode: method.branchCode || '',
      mobileNumber: method.mobileNumber || '',
      email: method.email || '',
      isDefault: method.isDefault || false
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (method) => {
    setSelectedPaymentMethod(method);
    setShowDeleteModal(true);
  };

  if (!context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Payment sx={{ color: '#3b82f6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Payout Payment Methods
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Configure your verified bank accounts, JazzCash, and EasyPaisa for seamless withdrawals.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddModal(true)}
            sx={{
              borderRadius: 0,
              bgcolor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Add New Account
          </Button>
        </Box>
      </Card>

      {/* Filter Bar */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by bank name, account title, or account number..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: textSecondary }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 0, color: textPrimary, bgcolor: bgSubtle }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Account Type"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              InputLabelProps={{ sx: { color: textSecondary } }}
              InputProps={{ sx: { borderRadius: 0, color: textPrimary, bgcolor: bgSubtle } }}
            >
              <MenuItem value="">All Account Types</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="jazzcash">JazzCash</MenuItem>
              <MenuItem value="easypaisa">EasyPaisa</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Methods Cards Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: '#2563eb' }} />
        </Box>
      ) : filteredPaymentMethods.length > 0 ? (
        <Grid container spacing={3}>
          {filteredPaymentMethods.map((method) => {
            const isBank = method.type === 'bank_transfer';
            const icon = isBank ? <AccountBalance sx={{ color: '#3b82f6', fontSize: 28 }} /> : <PhoneIphone sx={{ color: '#10b981', fontSize: 28 }} />;

            return (
              <Grid item xs={12} md={6} key={method.id}>
                <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%', position: 'relative' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {icon}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                            {isBank ? method.bankName : method.type?.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                            {method.type?.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Details">
                          <IconButton size="small" onClick={() => openEditModal(method)} sx={{ color: textSecondary }}>
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Account">
                          <IconButton size="small" onClick={() => openDeleteModal(method)} sx={{ color: '#ef4444' }}>
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, mb: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: textSecondary }}>Account Title:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary }}>{method.accountName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: textSecondary }}>Account / Phone No:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: textPrimary, fontFamily: 'monospace' }}>
                            {method.accountNumber || method.mobileNumber}
                          </Typography>
                        </Box>
                        {method.ibanNumber && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: textSecondary }}>IBAN:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary, fontFamily: 'monospace' }}>{method.ibanNumber}</Typography>
                          </Box>
                        )}
                        {method.branchCode && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: textSecondary }}>Branch Code:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary }}>{method.branchCode}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>

                    {method.isDefault && (
                      <Chip
                        icon={<Star sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
                        label="PRIMARY PAYOUT ACCOUNT"
                        size="small"
                        sx={{ borderRadius: 0, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 800, fontSize: '0.68rem' }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 6, textAlign: 'center' }}>
          <Payment sx={{ fontSize: 44, color: textSecondary, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 0.5 }}>
            No Payment Accounts Configured
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            Add your bank account or mobile wallet to begin withdrawing commissions.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddModal(true)}
            sx={{ borderRadius: 0, bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 800 }}
          >
            Add Payout Account
          </Button>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: bgCard,
            border: `1px solid ${borderCard}`,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: textPrimary, fontWeight: 800 }}>
          {showAddModal ? 'Add Payment Method' : 'Edit Payment Method'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <form id="paymentMethodForm" onSubmit={showAddModal ? handleAddPaymentMethod : handleEditPaymentMethod}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: textSecondary }}>Method Type *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  label="Method Type *"
                  sx={{ borderRadius: 0, color: textPrimary }}
                >
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="jazzcash">JazzCash</MenuItem>
                  <MenuItem value="easypaisa">EasyPaisa</MenuItem>
                </Select>
              </FormControl>

              {formData.type === 'bank_transfer' ? (
                <>
                  <TextField
                    label="Bank Name *"
                    required
                    size="small"
                    fullWidth
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. Meezan Bank, HBL, UBL"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                  <TextField
                    label="Account Title / Beneficiary Name *"
                    required
                    size="small"
                    fullWidth
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="Exact title on bank account"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                  <TextField
                    label="Account Number *"
                    required
                    size="small"
                    fullWidth
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Enter account number"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                  <TextField
                    label="IBAN Number (Optional)"
                    size="small"
                    fullWidth
                    value={formData.ibanNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, ibanNumber: e.target.value }))}
                    placeholder="PK..."
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                  <TextField
                    label="Branch Code (Optional)"
                    size="small"
                    fullWidth
                    value={formData.branchCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                    placeholder="Branch code"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    label="Account Title / Owner Name *"
                    required
                    size="small"
                    fullWidth
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="Name registered on wallet"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                  <TextField
                    label="Mobile Number *"
                    required
                    size="small"
                    fullWidth
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="03XXXXXXXXX"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ color: textPrimary, fontWeight: 600 }}>Set as primary payout method</Typography>}
              />
            </Box>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="paymentMethodForm"
            variant="contained"
            disabled={addLoading || editLoading}
            sx={{
              borderRadius: 0,
              bgcolor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            {addLoading || editLoading ? 'Saving...' : 'Save Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: bgCard,
            border: `1px solid ${borderCard}`,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: textPrimary, fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber sx={{ color: '#ef4444' }} />
            Delete Payment Method
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Are you sure you want to remove <strong>{selectedPaymentMethod?.bankName || selectedPaymentMethod?.type?.toUpperCase()}</strong> ({selectedPaymentMethod?.accountNumber || selectedPaymentMethod?.mobileNumber})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowDeleteModal(false)}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePaymentMethod}
            variant="contained"
            disabled={deleteLoading}
            sx={{
              borderRadius: 0,
              bgcolor: '#ef4444',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

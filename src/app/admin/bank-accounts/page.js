'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';

export default function AdminBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    bankTitle: '',
    accountTitle: ''
  });
  const [formData, setFormData] = useState({
    bank_title: '',
    bank_accountno: '',
    account_title: '',
    iban_no: ''
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const applyFilters = () => {
    let filtered = [...bankAccounts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(account => 
        (account.bank_title || '').toLowerCase().includes(q) ||
        (account.account_title || '').toLowerCase().includes(q) ||
        (account.bank_accountno || '').toLowerCase().includes(q) ||
        (account.iban_no || '').toLowerCase().includes(q)
      );
    }

    if (filters.bankTitle) {
      filtered = filtered.filter(account => 
        (account.bank_title || '').toLowerCase().includes(filters.bankTitle.toLowerCase())
      );
    }

    if (filters.accountTitle) {
      filtered = filtered.filter(account => 
        (account.account_title || '').toLowerCase().includes(filters.accountTitle.toLowerCase())
      );
    }

    setFilteredBankAccounts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [bankAccounts, filters]);

  const clearFilters = () => {
    setFilters({ search: '', bankTitle: '', accountTitle: '' });
  };

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bank_management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const response = await fetch('/api/admin/bank_management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ bank_title: '', bank_accountno: '', account_title: '', iban_no: '' });
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditBankAccount = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await fetch(`/api/admin/bank_management/${selectedBankAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedBankAccount(null);
        setFormData({ bank_title: '', bank_accountno: '', account_title: '', iban_no: '' });
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteBankAccount = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/bank_management/${selectedBankAccount.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedBankAccount(null);
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (bankAccount) => {
    setSelectedBankAccount(bankAccount);
    setFormData({
      bank_title: bankAccount.bank_title,
      bank_accountno: bankAccount.bank_accountno,
      account_title: bankAccount.account_title,
      iban_no: bankAccount.iban_no
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (bankAccount) => {
    setSelectedBankAccount(bankAccount);
    setShowDeleteModal(true);
  };

  if (loading && bankAccounts.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Banking Gateways...
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
            <AccountBalanceIcon sx={{ color: '#fbbf24', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Company Bank Accounts
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Configure active settlement deposit accounts presented to members during package purchases.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchBankAccounts}
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
            Sync
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 0,
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            Add Bank Account
          </Button>
        </Box>
      </Box>

      {/* Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by bank name, title, or account number..."
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
              <TextField
                fullWidth
                size="small"
                placeholder="Filter by bank title..."
                value={filters.bankTitle}
                onChange={(e) => setFilters({ ...filters, bankTitle: e.target.value })}
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
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={clearFilters}
                sx={{
                  borderRadius: 0,
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)',
                  py: 1,
                  fontSize: '0.8rem'
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <Grid container spacing={2.5}>
        {filteredBankAccounts.map((account) => (
          <Grid item xs={12} sm={6} lg={4} key={account.id}>
            <Card
              sx={{
                borderRadius: 0,
                backgroundColor: '#0c1220',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                position: 'relative',
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: 'rgba(99, 102, 241, 0.4)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                    {account.bank_title}
                  </Typography>
                  <Chip
                    label="ACTIVE DEPOSIT GATEWAY"
                    size="small"
                    sx={{
                      borderRadius: 0,
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Account Title
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {account.account_title}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Account Number
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                      {account.bank_accountno}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      IBAN
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a78bfa', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {account.iban_no || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openEditModal(account)}
                    sx={{
                      borderRadius: 0,
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#818cf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openDeleteModal(account)}
                    sx={{
                      borderRadius: 0,
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredBankAccounts.length === 0 && (
        <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)', p: 6, textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
          <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
            No Bank Accounts Configured
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5, display: 'block', mb: 2 }}>
            Register your company receiving accounts so users can send investment funds.
          </Typography>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="contained"
            size="small"
            sx={{ borderRadius: 0, backgroundColor: '#6366f1' }}
          >
            Create First Account
          </Button>
        </Card>
      )}

      {/* Add Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
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
            Add Company Bank Account
          </Typography>
          <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddBankAccount}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Bank Title"
              placeholder="e.g. Meezan Bank, HBL, JazzCash"
              value={formData.bank_title}
              onChange={(e) => setFormData({ ...formData, bank_title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff'
                }
              }}
            />
            <TextField
              required
              fullWidth
              size="small"
              label="Account Title"
              placeholder="e.g. Ledora Global (Pvt) Ltd"
              value={formData.account_title}
              onChange={(e) => setFormData({ ...formData, account_title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff'
                }
              }}
            />
            <TextField
              required
              fullWidth
              size="small"
              label="Account Number"
              placeholder="e.g. 010203040506"
              value={formData.bank_accountno}
              onChange={(e) => setFormData({ ...formData, bank_accountno: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontFamily: 'monospace'
                }
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="IBAN Number"
              placeholder="PK... (Optional)"
              value={formData.iban_no}
              onChange={(e) => setFormData({ ...formData, iban_no: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontFamily: 'monospace'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowAddModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={addLoading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {addLoading ? 'Saving...' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
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
            Edit Bank Account
          </Typography>
          <IconButton onClick={() => setShowEditModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleEditBankAccount}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Bank Title"
              value={formData.bank_title}
              onChange={(e) => setFormData({ ...formData, bank_title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff'
                }
              }}
            />
            <TextField
              required
              fullWidth
              size="small"
              label="Account Title"
              value={formData.account_title}
              onChange={(e) => setFormData({ ...formData, account_title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff'
                }
              }}
            />
            <TextField
              required
              fullWidth
              size="small"
              label="Account Number"
              value={formData.bank_accountno}
              onChange={(e) => setFormData({ ...formData, bank_accountno: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontFamily: 'monospace'
                }
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="IBAN Number"
              value={formData.iban_no}
              onChange={(e) => setFormData({ ...formData, iban_no: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{
                sx: {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontFamily: 'monospace'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowEditModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={editLoading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {editLoading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: '#0d131f',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f87171' }}>
            Delete Bank Account?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Are you sure you want to delete <strong>{selectedBankAccount?.bank_title}</strong> ({selectedBankAccount?.bank_accountno})? Members will no longer see this receiving account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setShowDeleteModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteBankAccount} disabled={deleteLoading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 700 }}>
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

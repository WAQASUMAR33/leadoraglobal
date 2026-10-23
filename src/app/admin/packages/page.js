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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    rankId: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [formData, setFormData] = useState({
    package_name: '',
    package_amount: '',
    package_direct_commission: '',
    package_indirect_commission: '',
    d_crages: '',
    shopping_amount: '',
    package_points: '',
    status: 'active',
    rankId: ''
  });

  useEffect(() => {
    fetchPackages();
    fetchRanks();
  }, []);

  const applyFilters = () => {
    let filtered = [...packages];

    if (filters.search) {
      filtered = filtered.filter(pkg => 
        (pkg.package_name || '').toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === filters.status);
    }

    if (filters.rankId !== 'all') {
      if (filters.rankId === '') {
        filtered = filtered.filter(pkg => !pkg.rankId);
      } else {
        filtered = filtered.filter(pkg => pkg.rankId === parseInt(filters.rankId, 10));
      }
    }

    if (filters.minAmount) {
      filtered = filtered.filter(pkg => parseFloat(pkg.package_amount) >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(pkg => parseFloat(pkg.package_amount) <= parseFloat(filters.maxAmount));
    }

    setFilteredPackages(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [packages, filters]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/admin/ranks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRanks(data.ranks || []);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchPackages();
      }
    } catch (error) {
      console.error('Error adding package:', error);
    }
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedPackage(null);
        resetForm();
        fetchPackages();
      }
    } catch (error) {
      console.error('Error updating package:', error);
    }
  };

  const handleDeletePackage = async () => {
    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedPackage(null);
        fetchPackages();
      }
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      package_name: '',
      package_amount: '',
      package_direct_commission: '',
      package_indirect_commission: '',
      d_crages: '',
      shopping_amount: '',
      package_points: '',
      status: 'active',
      rankId: ''
    });
  };

  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      package_name: pkg.package_name || '',
      package_amount: pkg.package_amount || '',
      package_direct_commission: pkg.package_direct_commission || '',
      package_indirect_commission: pkg.package_indirect_commission || '',
      d_crages: pkg.d_crages || '',
      shopping_amount: pkg.shopping_amount || '',
      package_points: pkg.package_points || '',
      status: pkg.status || 'active',
      rankId: pkg.rankId || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (pkg) => {
    setSelectedPackage(pkg);
    setShowDeleteModal(true);
  };

  const formatCurrency = (amt) => `PKR ${parseFloat(amt || 0).toLocaleString()}`;

  if (loading && packages.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Investment Packages...
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
            <CardGiftcardIcon sx={{ color: '#818cf8', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Investment Package Plans
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Configure tier prices, multi-tier direct & indirect commissions, shopping coupons, and points awards.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchPackages}
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
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
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
            Create Plan
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
                placeholder="Search package name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                  <MenuItem value="active" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Active</MenuItem>
                  <MenuItem value="inactive" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.rankId}
                  onChange={(e) => setFilters({ ...filters, rankId: e.target.value })}
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
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Associated Ranks</MenuItem>
                  {ranks.map((r) => (
                    <MenuItem key={r.id} value={r.id} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                      {r.rank_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Package Cards Grid */}
      <Grid container spacing={2.5}>
        {filteredPackages.map((pkg) => (
          <Grid item xs={12} sm={6} lg={4} key={pkg.id}>
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem' }}>
                    {pkg.package_name}
                  </Typography>
                  <Chip
                    label={pkg.status === 'active' ? 'ACTIVE TIER' : 'INACTIVE'}
                    size="small"
                    sx={{
                      borderRadius: 0,
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: pkg.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: pkg.status === 'active' ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
                      border: `1px solid ${pkg.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" sx={{ color: '#34d399', fontWeight: 800, fontSize: '1.75rem' }}>
                    {formatCurrency(pkg.package_amount)}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Direct Commission:</Typography>
                    <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>{formatCurrency(pkg.package_direct_commission)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Indirect Commission:</Typography>
                    <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>{formatCurrency(pkg.package_indirect_commission)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Career Points:</Typography>
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700 }}>{pkg.package_points || 0} pts</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Shopping Credit:</Typography>
                    <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 700 }}>{formatCurrency(pkg.shopping_amount)}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openEditModal(pkg)}
                    sx={{
                      borderRadius: 0,
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#818cf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openDeleteModal(pkg)}
                    sx={{
                      borderRadius: 0,
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
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

      {/* Add Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Create Investment Package</Typography>
          <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddPackage}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Package Name"
              value={formData.package_name}
              onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="number"
                  label="Package Price (PKR)"
                  value={formData.package_amount}
                  onChange={(e) => setFormData({ ...formData, package_amount: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Points Awarded"
                  value={formData.package_points}
                  onChange={(e) => setFormData({ ...formData, package_points: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Direct Commission (PKR)"
                  value={formData.package_direct_commission}
                  onChange={(e) => setFormData({ ...formData, package_direct_commission: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Indirect Commission (PKR)"
                  value={formData.package_indirect_commission}
                  onChange={(e) => setFormData({ ...formData, package_indirect_commission: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Shopping Balance Credit"
                  value={formData.shopping_amount}
                  onChange={(e) => setFormData({ ...formData, shopping_amount: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Associated Rank</InputLabel>
                  <Select
                    value={formData.rankId}
                    label="Associated Rank"
                    onChange={(e) => setFormData({ ...formData, rankId: e.target.value })}
                    sx={{
                      borderRadius: 0,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                  >
                    <MenuItem value="" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>None</MenuItem>
                    {ranks.map((r) => (
                      <MenuItem key={r.id} value={r.id} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                        {r.rank_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowAddModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>Save Package</Button>
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
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Edit Package Plan</Typography>
          <IconButton onClick={() => setShowEditModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleEditPackage}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Package Name"
              value={formData.package_name}
              onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="number"
                  label="Package Price (PKR)"
                  value={formData.package_amount}
                  onChange={(e) => setFormData({ ...formData, package_amount: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Points Awarded"
                  value={formData.package_points}
                  onChange={(e) => setFormData({ ...formData, package_points: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Direct Commission (PKR)"
                  value={formData.package_direct_commission}
                  onChange={(e) => setFormData({ ...formData, package_direct_commission: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Indirect Commission (PKR)"
                  value={formData.package_indirect_commission}
                  onChange={(e) => setFormData({ ...formData, package_indirect_commission: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Shopping Balance Credit"
                  value={formData.shopping_amount}
                  onChange={(e) => setFormData({ ...formData, shopping_amount: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Associated Rank</InputLabel>
                  <Select
                    value={formData.rankId}
                    label="Associated Rank"
                    onChange={(e) => setFormData({ ...formData, rankId: e.target.value })}
                    sx={{
                      borderRadius: 0,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                  >
                    <MenuItem value="" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>None</MenuItem>
                    {ranks.map((r) => (
                      <MenuItem key={r.id} value={r.id} sx={{ borderRadius: 0, fontSize: '0.82rem' }}>
                        {r.rank_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowEditModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>Update Package</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f87171' }}>Delete Package?</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Are you sure you want to delete package <strong>{selectedPackage?.package_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setShowDeleteModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
          <Button onClick={handleDeletePackage} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 700 }}>Delete Plan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

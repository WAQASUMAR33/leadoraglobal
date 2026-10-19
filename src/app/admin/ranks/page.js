'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Divider
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import StarsIcon from '@mui/icons-material/Stars';

export default function AdminRanks() {
  const [ranks, setRanks] = useState([]);
  const [filteredRanks, setFilteredRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRank, setSelectedRank] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    minPoints: '',
    maxPoints: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    required_points: '',
    details: ''
  });

  useEffect(() => {
    fetchRanks();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...ranks];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(rank => 
        (rank.title || '').toLowerCase().includes(q) ||
        (rank.details || '').toLowerCase().includes(q)
      );
    }

    if (filters.minPoints) {
      filtered = filtered.filter(rank => rank.required_points >= parseInt(filters.minPoints, 10));
    }
    if (filters.maxPoints) {
      filtered = filtered.filter(rank => rank.required_points <= parseInt(filters.maxPoints, 10));
    }

    setFilteredRanks(filtered);
  }, [ranks, filters]);

  useEffect(() => {
    applyFilters();
  }, [ranks, filters, applyFilters]);

  const clearFilters = () => {
    setFilters({ search: '', minPoints: '', maxPoints: '' });
  };

  const fetchRanks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rank_management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRanks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/rank_management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ title: '', required_points: '', details: '' });
        fetchRanks();
      }
    } catch (error) {
      console.error('Error adding rank:', error);
    }
  };

  const handleEditRank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/rank_management/${selectedRank.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedRank(null);
        setFormData({ title: '', required_points: '', details: '' });
        fetchRanks();
      }
    } catch (error) {
      console.error('Error updating rank:', error);
    }
  };

  const handleDeleteRank = async () => {
    try {
      const response = await fetch(`/api/admin/rank_management/${selectedRank.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedRank(null);
        fetchRanks();
      }
    } catch (error) {
      console.error('Error deleting rank:', error);
    }
  };

  const openEditModal = (rank) => {
    setSelectedRank(rank);
    setFormData({
      title: rank.title || '',
      required_points: (rank.required_points || 0).toString(),
      details: rank.details || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (rank) => {
    setSelectedRank(rank);
    setShowDeleteModal(true);
  };

  if (loading && ranks.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Career Qualification Tiers...
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
            <WorkspacePremiumIcon sx={{ color: '#fbbf24', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Career Rank Levels
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Establish qualification thresholds, point benchmarks, and reward tiers for members.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchRanks}
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
              setFormData({ title: '', required_points: '', details: '' });
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
            Create Rank
          </Button>
        </Box>
      </Box>

      {/* Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search rank title or details..."
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
            <Grid item xs={12} sm={4}>
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
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ranks Cards Grid */}
      <Grid container spacing={2.5}>
        {filteredRanks.map((rank) => (
          <Grid item xs={12} sm={6} lg={4} key={rank.id}>
            <Card
              sx={{
                borderRadius: 0,
                backgroundColor: '#0c1220',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.005) 100%)',
                position: 'relative',
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: '#fbbf24'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.15rem' }}>
                    {rank.title}
                  </Typography>
                  <Chip
                    icon={<StarsIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />}
                    label={`${rank.required_points} PTS REQUIRED`}
                    size="small"
                    sx={{
                      borderRadius: 0,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', minHeight: 44, mb: 2 }}>
                  {rank.details || 'No qualification notes defined.'}
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openEditModal(rank)}
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
                    onClick={() => openDeleteModal(rank)}
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
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Add Career Rank</Typography>
          <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddRank}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Rank Title"
              placeholder="e.g. Bronze, Silver, Diamond"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              required
              fullWidth
              size="small"
              type="number"
              label="Required Career Points"
              value={formData.required_points}
              onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Qualification Notes / Benefits"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowAddModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>Save Rank</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Edit Career Rank</Typography>
          <IconButton onClick={() => setShowEditModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleEditRank}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Rank Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              required
              fullWidth
              size="small"
              type="number"
              label="Required Career Points"
              value={formData.required_points}
              onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Qualification Notes / Benefits"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowEditModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>Update Rank</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Modal */}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f87171' }}>Delete Rank?</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Are you sure you want to delete rank <strong>{selectedRank?.title}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setShowDeleteModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
          <Button onClick={handleDeleteRank} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

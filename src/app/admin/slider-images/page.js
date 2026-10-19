"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import CollectionsIcon from '@mui/icons-material/Collections';

export default function SliderImagesPage() {
  const [sliderImages, setSliderImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageFile: null,
    imageUrl: '',
    linkUrl: '',
    isActive: true,
    sortOrder: 0
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchSliderImages = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/slider-images', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch slider images');
      }

      const result = await response.json();
      setSliderImages(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliderImages();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('linkUrl', formData.linkUrl || '');
      submitData.append('isActive', formData.isActive.toString());
      submitData.append('sortOrder', formData.sortOrder.toString());
      
      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
      }

      const url = editingImage ? `/api/admin/slider-images/${editingImage.id}` : '/api/admin/slider-images';
      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save slider image');
      }

      setSuccess(`Slider image ${editingImage ? 'updated' : 'created'} successfully`);
      setDialogOpen(false);
      resetForm();
      fetchSliderImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title || '',
      description: image.description || '',
      imageFile: null,
      imageUrl: image.imageUrl || '',
      linkUrl: image.linkUrl || '',
      isActive: image.isActive ?? true,
      sortOrder: image.sortOrder || 0
    });
    setImagePreview(image.imageUrl || null);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slider image?')) return;

    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/slider-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete slider image');
      }

      setSuccess('Slider image deleted successfully');
      fetchSliderImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/slider-images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess('Slider image status updated');
      fetchSliderImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingImage(null);
    setFormData({
      title: '',
      description: '',
      imageFile: null,
      imageUrl: '',
      linkUrl: '',
      isActive: true,
      sortOrder: 0
    });
    setImagePreview(null);
  };

  if (loading && sliderImages.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Slider Images...
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
            <CollectionsIcon sx={{ color: '#818cf8', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Homepage Slider Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Upload hero promotional banners and configure redirection links on the member portal.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchSliderImages}
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
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            sx={{
              borderRadius: 0,
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 700,
              px: 2,
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            Add New Slide
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ borderRadius: 0, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Table Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: '#0c1220', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            Banners Directory
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {sliderImages.length} Slides Configured
          </Typography>
        </Box>

        {sliderImages.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>No Slider Images</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    PREVIEW
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    TITLE & DESCRIPTION
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    REDIRECT TARGET
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ORDER
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    VISIBILITY
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sliderImages.map((image) => (
                  <TableRow key={image.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' }, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box
                        component="img"
                        src={image.imageUrl}
                        alt={image.title}
                        sx={{
                          width: 80,
                          height: 50,
                          objectFit: 'cover',
                          borderRadius: 0,
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700 }}>{image.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {image.description || 'No description'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {image.linkUrl ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LinkIcon sx={{ fontSize: 14, color: '#818cf8' }} />
                          <Typography variant="caption" sx={{ color: '#818cf8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {image.linkUrl}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>None</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Chip label={`#${image.sortOrder}`} size="small" sx={{ borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', fontWeight: 700, fontSize: '0.7rem' }} />
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Chip
                        label={image.isActive ? 'ACTIVE' : 'HIDDEN'}
                        size="small"
                        onClick={() => handleToggleActive(image.id, image.isActive)}
                        sx={{
                          borderRadius: 0,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          backgroundColor: image.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: image.isActive ? '#34d399' : 'rgba(255,255,255,0.5)',
                          border: `1px solid ${image.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`
                        }}
                      />
                    </TableCell>

                    <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.8 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(image)}
                          sx={{ color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: 0, p: 0.8 }}
                        >
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(image.id)}
                          sx={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 0, p: 0.8 }}
                        >
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {editingImage ? 'Edit Slider Image' : 'Add New Slider Image'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Banner Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Redirect URL (Optional)"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              placeholder="e.g. /products or https://..."
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Display Priority Order"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#34d399' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#34d399' }
                      }}
                    />
                  }
                  label="Active Display"
                  sx={{ color: '#ffffff' }}
                />
              </Grid>
            </Grid>

            {/* File Upload Box */}
            <Box sx={{ border: '1px dashed rgba(255,255,255,0.2)', p: 2, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <input accept="image/*" style={{ display: 'none' }} id="slider-upload" type="file" onChange={handleFileChange} />
              <label htmlFor="slider-upload">
                <Button component="span" variant="outlined" size="small" startIcon={<ImageIcon />} sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', mb: 1 }}>
                  {editingImage ? 'Replace Image' : 'Select Banner Image'}
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 1.5, position: 'relative', width: '100%', height: 140 }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" disabled={loading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {loading ? 'Saving...' : editingImage ? 'Update Slide' : 'Upload Slide'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

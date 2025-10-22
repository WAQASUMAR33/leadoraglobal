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
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
  Link as LinkIcon
} from '@mui/icons-material';

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

  // Fetch slider images
  const fetchSliderImages = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      console.log('Fetching slider images...');
      console.log('Admin token:', adminToken ? 'Present' : 'Missing');
      
      const response = await fetch('/api/admin/slider-images', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch slider images: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API Result:', result);
      setSliderImages(result.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliderImages();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Slider images state updated:', sliderImages);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [sliderImages, loading, error]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      // Validate that image is selected for new uploads
      if (!editingImage && !formData.imageFile) {
        setError('Please select an image file');
        setLoading(false);
        return;
      }
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('linkUrl', formData.linkUrl || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('sortOrder', formData.sortOrder);
      
      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
      }

      const url = editingImage 
        ? `/api/admin/upload-slider-image/${editingImage.id}`
        : '/api/admin/upload-slider-image';
      
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

      const result = await response.json();
      setSuccess(result.message);
      setDialogOpen(false);
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
      fetchSliderImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || '',
      imageFile: null,
      imageUrl: image.imageUrl,
      linkUrl: image.linkUrl || '',
      isActive: image.isActive,
      sortOrder: image.sortOrder
    });
    setImagePreview(image.imageUrl);
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slider image?')) {
      return;
    }

    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/slider-images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
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

  // Handle toggle active status
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
        throw new Error(errorData.error || 'Failed to update slider image');
      }

      setSuccess('Slider image status updated successfully');
      fetchSliderImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading && sliderImages.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ color: '#212529', fontWeight: 'bold' }}>
          Slider Images Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
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
            setDialogOpen(true);
          }}
          sx={{
            backgroundColor: '#007bff',
            '&:hover': {
              backgroundColor: '#0056b3'
            },
            fontWeight: 'bold',
            textTransform: 'none',
            px: 3,
            py: 1
          }}
        >
          Add New Image
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2, backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2, backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }}>
          {success}
        </Alert>
      )}

      {/* Slider Images Table */}
      <Card sx={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #dee2e6' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ backgroundColor: '#ffffff', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Link URL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Sort Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sliderImages.map((image) => (
                  <TableRow key={image.id} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Box
                        component="img"
                        src={image.imageUrl}
                        alt={image.title}
                        sx={{
                          width: 80,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid #dee2e6',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#212529' }}>
                        {image.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        {image.description ? 
                          (image.description.length > 50 ? 
                            `${image.description.substring(0, 50)}...` : 
                            image.description
                          ) : 
                          'No description'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      {image.linkUrl ? (
                        <Box display="flex" alignItems="center">
                          <LinkIcon sx={{ mr: 1, fontSize: 16, color: '#007bff' }} />
                          <Typography variant="body2" sx={{ color: '#007bff' }}>
                            {image.linkUrl.length > 30 ? 
                              `${image.linkUrl.substring(0, 30)}...` : 
                              image.linkUrl
                            }
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#6c757d' }}>
                          No link
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Chip 
                        label={image.sortOrder} 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#e3f2fd', 
                          color: '#1976d2',
                          border: '1px solid #bbdefb',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Tooltip title={image.isActive ? "Click to deactivate" : "Click to activate"}>
                        <IconButton
                          onClick={() => handleToggleActive(image.id, image.isActive)}
                          sx={{ 
                            color: image.isActive ? '#28a745' : '#6c757d',
                            '&:hover': {
                              backgroundColor: image.isActive ? 'rgba(40, 167, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)'
                            }
                          }}
                        >
                          {image.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        {new Date(image.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #dee2e6' }}>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(image)}
                            sx={{ 
                              color: '#007bff',
                              '&:hover': { backgroundColor: 'rgba(0, 123, 255, 0.1)' }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(image.id)}
                            sx={{ 
                              color: '#dc3545',
                              '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {sliderImages.length === 0 && (
            <Box textAlign="center" py={4}>
              <ImageIcon sx={{ fontSize: 64, color: '#6c757d', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#495057', mb: 1 }}>
                No slider images found
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                Click &quot;Add New Image&quot; to create your first slider image
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #dee2e6'
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ backgroundColor: '#f8f9fa', color: '#212529', fontWeight: 'bold', borderBottom: '1px solid #dee2e6' }}>
            {editingImage ? 'Edit Slider Image' : 'Add New Slider Image'}
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: '#ffffff', p: 3 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff !important',
                      '& fieldset': { borderColor: '#ced4da' },
                      '&:hover fieldset': { borderColor: '#007bff' },
                      '&.Mui-focused fieldset': { borderColor: '#007bff' },
                      '& input': { backgroundColor: '#ffffff !important' }
                    },
                    '& .MuiInputLabel-root': { color: '#495057' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#007bff' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff !important',
                      '& fieldset': { borderColor: '#ced4da' },
                      '&:hover fieldset': { borderColor: '#007bff' },
                      '&.Mui-focused fieldset': { borderColor: '#007bff' },
                      '& textarea': { backgroundColor: '#ffffff !important' }
                    },
                    '& .MuiInputLabel-root': { color: '#495057' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#007bff' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="image-upload">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    startIcon={<ImageIcon />}
                    sx={{
                      borderColor: '#ced4da',
                      color: '#495057',
                      '&:hover': {
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.04)'
                      }
                    }}
                  >
                    {editingImage ? 'Change Image' : 'Select Image'}
                  </Button>
                </label>
                {formData.imageFile && (
                  <Typography variant="body2" sx={{ mt: 1, color: '#6c757d' }}>
                    Selected: {formData.imageFile.name}
                  </Typography>
                )}
                {!formData.imageFile && editingImage && (
                  <Typography variant="body2" sx={{ mt: 1, color: '#6c757d' }}>
                    Current image will be kept if no new image is selected
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Link URL"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  helperText="Optional: URL to redirect when image is clicked"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff !important',
                      '& fieldset': { borderColor: '#ced4da' },
                      '&:hover fieldset': { borderColor: '#007bff' },
                      '&.Mui-focused fieldset': { borderColor: '#007bff' },
                      '& input': { backgroundColor: '#ffffff !important' }
                    },
                    '& .MuiInputLabel-root': { color: '#495057' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#007bff' },
                    '& .MuiFormHelperText-root': { color: '#6c757d' }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sort Order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  helperText="Lower numbers appear first"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff !important',
                      '& fieldset': { borderColor: '#ced4da' },
                      '&:hover fieldset': { borderColor: '#007bff' },
                      '&.Mui-focused fieldset': { borderColor: '#007bff' },
                      '& input': { backgroundColor: '#ffffff !important' }
                    },
                    '& .MuiInputLabel-root': { color: '#495057' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#007bff' },
                    '& .MuiFormHelperText-root': { color: '#6c757d' }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#28a745',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#28a745'
                          }
                        }
                      }}
                    />
                  }
                  label="Active"
                  sx={{ color: '#495057' }}
                />
              </Grid>
              {imagePreview && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#495057', fontWeight: 'bold' }}>
                    Image Preview:
                  </Typography>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      border: '1px solid #dee2e6',
                      borderRadius: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', p: 2 }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              sx={{
                color: '#6c757d',
                borderColor: '#ced4da',
                '&:hover': {
                  borderColor: '#adb5bd',
                  backgroundColor: 'rgba(108, 117, 125, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{
                backgroundColor: '#007bff',
                '&:hover': {
                  backgroundColor: '#0056b3'
                },
                '&:disabled': {
                  backgroundColor: '#6c757d'
                }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : (editingImage ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    hasDiscount: 'all'
  });
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    discount: '',
    sale_price: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => parseFloat(p.price) >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => parseFloat(p.price) <= parseFloat(filters.maxPrice));
    }

    if (filters.hasDiscount === 'yes') {
      filtered = filtered.filter(p => p.discount && parseFloat(p.discount) > 0);
    } else if (filters.hasDiscount === 'no') {
      filtered = filtered.filter(p => !p.discount || parseFloat(p.discount) === 0);
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const clearFilters = () => {
    setFilters({ search: '', minPrice: '', maxPrice: '', hasDiscount: 'all' });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToAPI = async (base64Data) => {
    try {
      const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      const imageUrl = result.url || result.imageUrl || result.image_url;
      if (imageUrl && !imageUrl.startsWith('http')) {
        return `https://steelblue-cod-355377.hostingersite.com/uploads/${imageUrl}`;
      }
      return imageUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      return '';
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    let currentImage = formData.image;
    if (selectedImage && !currentImage) {
      setImageUploading(true);
      try {
        const base64Data = await convertImageToBase64(selectedImage);
        currentImage = await uploadImageToAPI(base64Data);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
      setImageUploading(false);
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, image: currentImage })
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    let currentImage = formData.image;
    if (selectedImage) {
      setImageUploading(true);
      try {
        const base64Data = await convertImageToBase64(selectedImage);
        currentImage = await uploadImageToAPI(base64Data);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
      setImageUploading(false);
    }

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, image: currentImage })
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', price: '', discount: '', sale_price: '', description: '', image: '' });
    setSelectedImage(null);
    setImagePreview('');
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title || '',
      price: product.price?.toString() || '',
      discount: product.discount?.toString() || '',
      sale_price: product.sale_price?.toString() || '',
      description: product.description || '',
      image: product.image || ''
    });
    setImagePreview(product.image || '');
    setSelectedImage(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const formatCurrency = (amt) => `PKR ${parseFloat(amt || 0).toLocaleString()}`;

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading Product Inventory...
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
            <Inventory2Icon sx={{ color: '#34d399', fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Product Inventory Catalog
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Manage direct e-commerce items, apply promotional discounts, and upload product imagery.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={fetchProducts}
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
            Add Product
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
                placeholder="Search products by title or description..."
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

      {/* Products Grid */}
      <Grid container spacing={2.5}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} lg={4} key={product.id}>
            <Card
              sx={{
                borderRadius: 0,
                backgroundColor: '#0c1220',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'rgba(52, 211, 153, 0.4)' }
              }}
            >
              {/* Product Image Header */}
              <Box sx={{ width: '100%', height: 180, position: 'relative', backgroundColor: '#000000', overflow: 'hidden' }}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)' }}>
                    <Inventory2Icon sx={{ fontSize: 48 }} />
                  </Box>
                )}
                {product.discount && parseFloat(product.discount) > 0 && (
                  <Chip
                    label={`${product.discount}% OFF`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      borderRadius: 0,
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.65rem'
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', mb: 0.5 }}>
                  {product.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', mb: 2, flex: 1, minHeight: 36, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {product.description || 'No description provided.'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                  <Typography variant="h5" sx={{ color: '#34d399', fontWeight: 800 }}>
                    {formatCurrency(product.sale_price || product.price)}
                  </Typography>
                  {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', fontSize: '0.85rem' }}>
                      {formatCurrency(product.price)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => openEditModal(product)}
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
                    onClick={() => openDeleteModal(product)}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Add Product to Catalog</Typography>
          <IconButton onClick={() => setShowAddModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddProduct}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Product Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="number"
                  label="Price (PKR)"
                  value={formData.price}
                  onChange={(e) => {
                    const price = e.target.value;
                    const discount = formData.discount;
                    const sale = discount ? price - (price * discount / 100) : price;
                    setFormData({ ...formData, price, sale_price: sale.toString() });
                  }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Discount %"
                  value={formData.discount}
                  onChange={(e) => {
                    const discount = e.target.value;
                    const price = formData.price;
                    const sale = discount && price ? price - (price * discount / 100) : price;
                    setFormData({ ...formData, discount, sale_price: sale ? sale.toString() : '' });
                  }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Sale Price"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Product Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            {/* Image upload */}
            <Box sx={{ border: '1px dashed rgba(255,255,255,0.2)', p: 2, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <input type="file" accept="image/*" id="product-img" style={{ display: 'none' }} onChange={handleImageSelect} />
              <label htmlFor="product-img">
                <Button component="span" variant="outlined" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', mb: 1 }}>
                  Choose Image File
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 1.5, position: 'relative', width: '100%', height: 120 }}>
                  <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowAddModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" disabled={imageUploading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {imageUploading ? 'Uploading...' : 'Save Product'}
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
          sx: { borderRadius: 0, backgroundColor: '#0d131f', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>Edit Product</Typography>
          <IconButton onClick={() => setShowEditModal(false)} sx={{ color: 'rgba(255,255,255,0.6)', borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleEditProduct}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Product Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="number"
                  label="Price (PKR)"
                  value={formData.price}
                  onChange={(e) => {
                    const price = e.target.value;
                    const discount = formData.discount;
                    const sale = discount ? price - (price * discount / 100) : price;
                    setFormData({ ...formData, price, sale_price: sale.toString() });
                  }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Discount %"
                  value={formData.discount}
                  onChange={(e) => {
                    const discount = e.target.value;
                    const price = formData.price;
                    const sale = discount && price ? price - (price * discount / 100) : price;
                    setFormData({ ...formData, discount, sale_price: sale ? sale.toString() : '' });
                  }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Sale Price"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
                  InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Product Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' } }}
              InputProps={{ sx: { borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' } }}
            />
            {/* Image upload */}
            <Box sx={{ border: '1px dashed rgba(255,255,255,0.2)', p: 2, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <input type="file" accept="image/*" id="edit-product-img" style={{ display: 'none' }} onChange={handleImageSelect} />
              <label htmlFor="edit-product-img">
                <Button component="span" variant="outlined" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', mb: 1 }}>
                  Change Image
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 1.5, position: 'relative', width: '100%', height: 120 }}>
                  <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button onClick={() => setShowEditModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
            <Button type="submit" disabled={imageUploading} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#ffffff', fontWeight: 700 }}>
              {imageUploading ? 'Uploading...' : 'Update Product'}
            </Button>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f87171' }}>Delete Product?</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Are you sure you want to delete product <strong>{selectedProduct?.title}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setShowDeleteModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Cancel</Button>
          <Button onClick={handleDeleteProduct} variant="contained" size="small" sx={{ borderRadius: 0, backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

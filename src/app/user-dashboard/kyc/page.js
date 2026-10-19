"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  CircularProgress
} from '@mui/material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  PhotoCamera,
  Save,
  Edit,
  CheckCircle,
  PendingActions,
  WarningAmber,
  VerifiedUser,
  Badge,
  CreditCard
} from '@mui/icons-material';

export default function KYCPage() {
  const { user, isAuthenticated } = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [kycData, setKycData] = useState({
    fullname: "",
    father_name: "",
    email: "",
    phoneNumber: "",
    date_of_birth: "",
    city: "",
    country: "",
    current_address: "",
    permanent_address: "",
    gender: "",
    cnic_number: "",
    cnic_expiry_date: "",
    profile_image: "",
    id_card_front: "",
    id_card_back: "",
    beneficiary_name: "",
    beneficiary_phone_mobile: "",
    beneficiary_relation: "",
    beneficiary_address: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [existingKYC, setExistingKYC] = useState(null);
  const [kycStatus, setKycStatus] = useState("pending");
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchKYCData = useCallback(async () => {
    try {
      if (!isAuthenticated || !user) return;
      const response = await fetch('/api/user/kyc', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.kyc) {
          setExistingKYC(data.kyc);
          setKycStatus(data.kyc.kyc_status);
          setKycData({
            fullname: data.kyc.fullname || "",
            father_name: data.kyc.father_name || "",
            email: data.kyc.email || "",
            phoneNumber: data.kyc.phoneNumber || "",
            date_of_birth: data.kyc.date_of_birth ? data.kyc.date_of_birth.substring(0, 10) : "",
            city: data.kyc.city || "",
            country: data.kyc.country || "",
            current_address: data.kyc.current_address || "",
            permanent_address: data.kyc.permanent_address || "",
            gender: data.kyc.gender || "",
            cnic_number: data.kyc.cnic_number || "",
            cnic_expiry_date: data.kyc.cnic_expiry_date ? data.kyc.cnic_expiry_date.substring(0, 10) : "",
            profile_image: data.kyc.profile_image || "",
            id_card_front: data.kyc.id_card_front || "",
            id_card_back: data.kyc.id_card_back || "",
            beneficiary_name: data.kyc.beneficiary_name || "",
            beneficiary_phone_mobile: data.kyc.beneficiary_phone_mobile || "",
            beneficiary_relation: data.kyc.beneficiary_relation || "",
            beneficiary_address: data.kyc.beneficiary_address || "",
          });
        }
      }
    } catch (err) {
      console.error('Error fetching KYC:', err);
    }
  }, [isAuthenticated, user]);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      if (response.ok) {
        const data = await response.json();
        const sorted = data.map(c => ({ name: c.name.common, code: c.cca2 })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(sorted);
      } else {
        throw new Error('API failed');
      }
    } catch {
      setCountries([
        { name: "Pakistan", code: "PK" },
        { name: "United States", code: "US" },
        { name: "United Kingdom", code: "GB" },
        { name: "United Arab Emirates", code: "AE" },
        { name: "Saudi Arabia", code: "SA" },
        { name: "Canada", code: "CA" },
        { name: "Australia", code: "AU" }
      ]);
    } finally {
      setLoadingCountries(false);
    }
  };

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      fetchKYCData();
      fetchCountries();
    }
  }, [mounted, isAuthenticated, user, fetchKYCData]);

  const handleInputChange = (field, value) => {
    setKycData(prev => ({ ...prev, [field]: value }));
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:image/')) return url;
    return `/uploads/${url}`;
  };

  const uploadImageToAPI = async (base64Data) => {
    try {
      const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });
      if (response.ok) {
        const result = await response.json();
        const img = result.url || result.imageUrl || result.image_url;
        if (img) return img.startsWith('http') ? img : `https://steelblue-cod-355377.hostingersite.com/uploads/${img}`;
      }
    } catch (e) {
      console.warn('External upload failed, using fallback:', e);
    }
    return base64Data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadingImages(true);
    setMessage(null);
    setError(null);

    try {
      if (!isAuthenticated || !user) {
        setError('Authentication required');
        return;
      }

      let submissionData = { ...kycData };

      if (kycData.profile_image && kycData.profile_image.startsWith('data:image/')) {
        submissionData.profile_image = await uploadImageToAPI(kycData.profile_image);
      }
      if (kycData.id_card_front && kycData.id_card_front.startsWith('data:image/')) {
        submissionData.id_card_front = await uploadImageToAPI(kycData.id_card_front);
      }
      if (kycData.id_card_back && kycData.id_card_back.startsWith('data:image/')) {
        submissionData.id_card_back = await uploadImageToAPI(kycData.id_card_back);
      }

      const response = await fetch('/api/user/kyc', {
        method: existingKYC ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(existingKYC ? 'KYC profile updated successfully!' : 'KYC documentation submitted successfully!');
        setExistingKYC(data.kyc);
        setKycStatus(data.kyc.kyc_status);
        setIsEditing(false);
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to submit KYC verification');
      }
    } catch (err) {
      console.error('Error submitting KYC:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setKycData(prev => ({ ...prev, [field]: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const statusColor = kycStatus === 'approved' ? '#10b981' : kycStatus === 'rejected' ? '#ef4444' : '#f59e0b';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VerifiedUser sx={{ color: statusColor, fontSize: 36 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                  KYC Verification Center
                </Typography>
                <Chip
                  label={kycStatus.toUpperCase()}
                  size="small"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: `${statusColor}20`,
                    color: statusColor,
                    border: `1px solid ${statusColor}40`
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                Complete identity verification to unlock full payout processing and compliance validation.
              </Typography>
            </Box>
          </Box>

          {existingKYC && (
            <Button
              variant={isEditing ? 'outlined' : 'contained'}
              startIcon={isEditing ? null : <Edit />}
              onClick={() => setIsEditing(!isEditing)}
              sx={{
                borderRadius: 0,
                bgcolor: isEditing ? 'transparent' : '#3b82f6',
                borderColor: borderCard,
                color: isEditing ? textPrimary : '#ffffff',
                fontWeight: 800,
                textTransform: 'none',
                px: 2.5,
                '&:hover': { bgcolor: isEditing ? bgSubtle : '#2563eb' }
              }}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Information'}
            </Button>
          )}
        </Box>
      </Card>

      {message && (
        <Alert severity="success" sx={{ borderRadius: 0, border: '1px solid #10b981', bgcolor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)' }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 0, border: '1px solid #ef4444', bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </Alert>
      )}

      {/* Main KYC Form */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {/* Profile Image Avatar Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}` }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={getImageUrl(kycData.profile_image)}
                    sx={{ width: 84, height: 84, borderRadius: 0, bgcolor: '#3b82f6', border: `2px solid ${borderCard}` }}
                  >
                    {!kycData.profile_image && <Person sx={{ fontSize: 44 }} />}
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-img-input"
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'profile_image')}
                    disabled={!isEditing && existingKYC}
                  />
                  <label htmlFor="profile-img-input">
                    <IconButton
                      component="span"
                      size="small"
                      disabled={!isEditing && existingKYC}
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: '#3b82f6',
                        color: '#fff',
                        borderRadius: 0,
                        p: 0.5,
                        '&:hover': { bgcolor: '#2563eb' }
                      }}
                    >
                      <PhotoCamera sx={{ fontSize: 16 }} />
                    </IconButton>
                  </label>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
                    Passport-Size Profile Photo
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>
                    Upload a recent frontal photograph against a clear background (JPG/PNG, max 5MB).
                  </Typography>
                </Box>
              </Box>

              {/* Personal Details */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Personal Details
                </Typography>
                <Divider sx={{ mb: 2.5, borderColor: borderCard }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Legal Name *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.fullname}
                      onChange={(e) => handleInputChange('fullname', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Father / Guardian Name *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.father_name}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address *"
                      type="email"
                      fullWidth
                      size="small"
                      required
                      value={kycData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Phone Number *"
                      type="tel"
                      fullWidth
                      size="small"
                      required
                      value={kycData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Date of Birth *"
                      type="date"
                      fullWidth
                      size="small"
                      required
                      value={kycData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ shrink: true, sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="City *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" required disabled={!isEditing && existingKYC}>
                      <InputLabel sx={{ color: textSecondary }}>Country *</InputLabel>
                      <Select
                        value={kycData.country}
                        label="Country *"
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        sx={{ borderRadius: 0, color: textPrimary }}
                      >
                        {countries.map((c) => (
                          <MenuItem key={c.code} value={c.name}>{c.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" required disabled={!isEditing && existingKYC}>
                      <InputLabel sx={{ color: textSecondary }}>Gender *</InputLabel>
                      <Select
                        value={kycData.gender}
                        label="Gender *"
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        sx={{ borderRadius: 0, color: textPrimary }}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="National ID / CNIC Number *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.cnic_number}
                      onChange={(e) => handleInputChange('cnic_number', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      placeholder="00000-0000000-0"
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="CNIC Expiry Date *"
                      type="date"
                      fullWidth
                      size="small"
                      required
                      value={kycData.cnic_expiry_date}
                      onChange={(e) => handleInputChange('cnic_expiry_date', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ shrink: true, sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Current Residential Address *"
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      required
                      value={kycData.current_address}
                      onChange={(e) => handleInputChange('current_address', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Permanent Address *"
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      required
                      value={kycData.permanent_address}
                      onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Beneficiary Details */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Next-of-Kin / Beneficiary Details
                </Typography>
                <Divider sx={{ mb: 2.5, borderColor: borderCard }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Beneficiary Full Name *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.beneficiary_name}
                      onChange={(e) => handleInputChange('beneficiary_name', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Beneficiary Phone / Mobile *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.beneficiary_phone_mobile}
                      onChange={(e) => handleInputChange('beneficiary_phone_mobile', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Relationship with Member *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.beneficiary_relation}
                      onChange={(e) => handleInputChange('beneficiary_relation', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      placeholder="e.g. Spouse, Son, Father, Sibling"
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Beneficiary Permanent Address *"
                      fullWidth
                      size="small"
                      required
                      value={kycData.beneficiary_address}
                      onChange={(e) => handleInputChange('beneficiary_address', e.target.value)}
                      disabled={!isEditing && existingKYC}
                      InputLabelProps={{ sx: { color: textSecondary } }}
                      InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ID Card Scans */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Identity Card Document Scans
                </Typography>
                <Divider sx={{ mb: 2.5, borderColor: borderCard }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, mb: 1.5 }}>
                        CNIC Front Image
                      </Typography>
                      {kycData.id_card_front ? (
                        <Box sx={{ mb: 2, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image
                            src={getImageUrl(kycData.id_card_front)}
                            alt="CNIC Front"
                            width={260}
                            height={160}
                            style={{ objectFit: 'contain', maxHeight: '160px' }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ py: 4, color: textSecondary }}>
                          <CreditCard sx={{ fontSize: 44, mb: 1 }} />
                          <Typography variant="caption" sx={{ display: 'block' }}>No image uploaded</Typography>
                        </Box>
                      )}
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="cnic-front-input"
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'id_card_front')}
                        disabled={!isEditing && existingKYC}
                      />
                      <label htmlFor="cnic-front-input">
                        <Button
                          component="span"
                          variant="outlined"
                          size="small"
                          disabled={!isEditing && existingKYC}
                          sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
                        >
                          {kycData.id_card_front ? 'Replace Front Scan' : 'Upload Front Scan'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, mb: 1.5 }}>
                        CNIC Back Image
                      </Typography>
                      {kycData.id_card_back ? (
                        <Box sx={{ mb: 2, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image
                            src={getImageUrl(kycData.id_card_back)}
                            alt="CNIC Back"
                            width={260}
                            height={160}
                            style={{ objectFit: 'contain', maxHeight: '160px' }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ py: 4, color: textSecondary }}>
                          <CreditCard sx={{ fontSize: 44, mb: 1 }} />
                          <Typography variant="caption" sx={{ display: 'block' }}>No image uploaded</Typography>
                        </Box>
                      )}
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="cnic-back-input"
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'id_card_back')}
                        disabled={!isEditing && existingKYC}
                      />
                      <label htmlFor="cnic-back-input">
                        <Button
                          component="span"
                          variant="outlined"
                          size="small"
                          disabled={!isEditing && existingKYC}
                          sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
                        >
                          {kycData.id_card_back ? 'Replace Back Scan' : 'Upload Back Scan'}
                        </Button>
                      </label>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Submit Button */}
              {(!existingKYC || isEditing) && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || uploadingImages}
                    startIcon={<Save />}
                    sx={{
                      borderRadius: 0,
                      bgcolor: '#3b82f6',
                      color: '#ffffff',
                      fontWeight: 800,
                      px: 4,
                      py: 1.2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#2563eb' }
                    }}
                  >
                    {uploadingImages ? 'Uploading Scans...' : loading ? 'Saving Profile...' : existingKYC ? 'Save KYC Changes' : 'Submit KYC Documentation'}
                  </Button>
                </Box>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

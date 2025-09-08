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
} from '@mui/material';
import { UserContext } from '../../../lib/userContext';
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
  Warning,
} from '@mui/icons-material';

export default function KYCPage() {
  const { user, isAuthenticated } = useContext(UserContext);
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
  
  // File upload states
  const [idCardFrontFile, setIdCardFrontFile] = useState(null);
  const [idCardBackFile, setIdCardBackFile] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      fetchKYCData();
      fetchCountries();
    }
  }, [mounted, isAuthenticated, user, fetchKYCData]);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      // Try the main API first
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      if (response.ok) {
        const data = await response.json();
        const sortedCountries = data
          .map(country => ({
            name: country.name.common,
            code: country.cca2
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        console.log('Countries fetched from API:', sortedCountries);
        setCountries(sortedCountries);
      } else {
        console.log('API response not ok, using fallback countries');
        // Fallback to a smaller list of common countries
        const fallbackCountries = [
          { name: "Pakistan", code: "PK" },
          { name: "United States", code: "US" },
          { name: "United Kingdom", code: "GB" },
          { name: "Canada", code: "CA" },
          { name: "Australia", code: "AU" },
          { name: "Germany", code: "DE" },
          { name: "France", code: "FR" },
          { name: "India", code: "IN" },
          { name: "China", code: "CN" },
          { name: "Japan", code: "JP" },
          { name: "Saudi Arabia", code: "SA" },
          { name: "UAE", code: "AE" },
          { name: "Turkey", code: "TR" },
          { name: "Malaysia", code: "MY" },
          { name: "Singapore", code: "SG" },
          { name: "Thailand", code: "TH" },
          { name: "Vietnam", code: "VN" },
          { name: "Indonesia", code: "ID" },
          { name: "Philippines", code: "PH" },
          { name: "South Korea", code: "KR" }
        ];
                setCountries(fallbackCountries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      console.log('Using fallback countries due to API error');
      // Use fallback countries if API fails
      const fallbackCountries = [
        { name: "Pakistan", code: "PK" },
        { name: "United States", code: "US" },
        { name: "United Kingdom", code: "GB" },
        { name: "Canada", code: "CA" },
        { name: "Australia", code: "AU" },
        { name: "Germany", code: "DE" },
        { name: "France", code: "FR" },
        { name: "India", code: "IN" },
        { name: "China", code: "CN" },
        { name: "Japan", code: "JP" },
        { name: "Saudi Arabia", code: "SA" },
        { name: "UAE", code: "AE" },
        { name: "Turkey", code: "TR" },
        { name: "Malaysia", code: "MY" },
        { name: "Singapore", code: "SG" },
        { name: "Thailand", code: "TH" },
        { name: "Vietnam", code: "VN" },
        { name: "Indonesia", code: "ID" },
        { name: "Philippines", code: "PH" },
        { name: "South Korea", code: "KR" }
      ];
      setCountries(fallbackCountries);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchKYCData = useCallback(async () => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) return;

      const response = await fetch('/api/user/kyc', {
        credentials: 'include' // Include cookies for authentication
      });

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
            date_of_birth: data.kyc.date_of_birth || "",
            city: data.kyc.city || "",
            country: data.kyc.country || "",
            current_address: data.kyc.current_address || "",
            permanent_address: data.kyc.permanent_address || "",
            gender: data.kyc.gender || "",
            cnic_number: data.kyc.cnic_number || "",
            cnic_expiry_date: data.kyc.cnic_expiry_date || "",
            profile_image: data.kyc.profile_image || "",
            beneficiary_name: data.kyc.beneficiary_name || "",
            beneficiary_phone_mobile: data.kyc.beneficiary_phone_mobile || "",
            beneficiary_relation: data.kyc.beneficiary_relation || "",
            beneficiary_address: data.kyc.beneficiary_address || "",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (field, value) => {
    setKycData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <PendingActions />;
      case 'rejected': return <Warning />;
      default: return <PendingActions />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadingImages(true);
    setMessage(null);
    setError(null);

    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Prepare KYC data for submission
      let submissionData = { ...kycData };

      // Upload ID card images if they exist
      if (kycData.id_card_front) {
        try {
          const frontImageUrl = await uploadImageToAPI(kycData.id_card_front);
          submissionData.id_card_front = frontImageUrl;
        } catch (error) {
          console.error('Error uploading ID card front:', error);
          setError('Failed to upload ID card front image. Please try again.');
          return;
        }
      }

      if (kycData.id_card_back) {
        try {
          const backImageUrl = await uploadImageToAPI(kycData.id_card_back);
          submissionData.id_card_back = backImageUrl;
        } catch (error) {
          console.error('Error uploading ID card back:', error);
          setError('Failed to upload ID card back image. Please try again.');
          return;
        }
      }

      setUploadingImages(false);

      const response = await fetch('/api/user/kyc', {
        method: existingKYC ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(existingKYC ? 'KYC updated successfully!' : 'KYC submitted successfully!');
        setExistingKYC(data.kyc);
        setKycStatus(data.kyc.kyc_status);
        setIsEditing(false);
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setKycData(prev => ({
          ...prev,
          profile_image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardFrontUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIdCardFrontFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setKycData(prev => ({
          ...prev,
          id_card_front: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardBackUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIdCardBackFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setKycData(prev => ({
          ...prev,
          id_card_back: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToAPI = async (base64Image) => {
    try {
      const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Handle different response formats
        let imageUrl = result.url || result.image_url || result.imageUrl;
        
        // If the response is just a filename, construct the full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://steelblue-cod-355377.hostingersite.com/uploads/${imageUrl}`;
        }
        
        return imageUrl;
      } else {
        throw new Error(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Loading KYC form...
        </Typography>
      </Box>
    );
  }

  return (
    <Box key={mounted ? 'mounted' : 'loading'} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          KYC Verification
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Complete your Know Your Customer verification
        </Typography>
        
        <Chip
          icon={getStatusIcon(kycStatus)}
          label={kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
          color={getStatusColor(kycStatus)}
          variant="filled"
          sx={{ fontSize: '1rem', px: 2, py: 1 }}
        />
      </Box>

      {/* KYC Form */}
      <Card sx={{ 
        borderRadius: 3, 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              Personal Information
            </Typography>
            {existingKYC && (
              <Button
                variant={isEditing ? "outlined" : "contained"}
                startIcon={isEditing ? <Save /> : <Edit />}
                onClick={() => setIsEditing(!isEditing)}
                sx={{
                  background: isEditing ? 'transparent' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: isEditing ? 'rgba(59, 130, 246, 0.1)' : 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                  }
                }}
              >
                {isEditing ? "Cancel Edit" : "Edit Information"}
              </Button>
            )}
          </Box>

          {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Profile Image */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={kycData.profile_image}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      border: '4px solid #e5e7eb',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                    type="file"
                    onChange={handleImageUpload}
                    disabled={!isEditing && existingKYC}
                  />
                  <label htmlFor="profile-image-upload">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                      disabled={!isEditing && existingKYC}
                    >
                      <PhotoCamera />
                    </IconButton>
                  </label>
                </Box>
              </Box>

              {/* Personal Details */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  Personal Details
                </Typography>
              </Box>

              {/* Full Name and Father's Name */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Full Name"
                  value={kycData.fullname}
                  onChange={(e) => handleInputChange('fullname', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
                  }}
                />
                <TextField
                  label="Father's Name"
                  value={kycData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
                  }}
                />
              </Box>

              {/* Email and Phone Number */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Email"
                  type="email"
                  value={kycData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
                  }}
                />
                <TextField
                  label="Phone Number"
                  value={kycData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
                  }}
                />
              </Box>

              {/* Date of Birth and City */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={kycData.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    flex: 1, 
                    minWidth: '250px',
                    '& .MuiInputBase-root': { 
                      height: '56px',
                      '& .MuiInputLabel-root': { 
                        transform: 'translate(14px, 16px) scale(1)' 
                      }
                    }
                  }}
                />
                <TextField
                  label="City"
                  value={kycData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                  }}
                />
              </Box>

              {/* Country and Gender */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl required disabled={!isEditing && existingKYC} sx={{ flex: 1, minWidth: '250px' }}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={kycData.country}
                  label="Country"
                  onChange={(e) => handleInputChange('country', e.target.value)}
                    sx={{ 
                      height: '56px',
                      '& .MuiSelect-select': { 
                        display: 'flex', 
                        alignItems: 'center',
                        height: '100%'
                      }
                    }}
                  >
                    {loadingCountries ? (
                      <MenuItem disabled>Loading countries...</MenuItem>
                    ) : countries.length > 0 ? (
                      countries.map((country) => (
                        <MenuItem key={country.code} value={country.name}>
                          {country.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No countries available</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl required disabled={!isEditing && existingKYC} sx={{ flex: 1, minWidth: '250px' }}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={kycData.gender}
                    label="Gender"
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    sx={{ 
                      height: '56px',
                      '& .MuiSelect-select': { 
                        display: 'flex', 
                        alignItems: 'center',
                        height: '100%'
                      }
                    }}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* CNIC Number and Expiry Date */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="CNIC Number"
                  value={kycData.cnic_number}
                  onChange={(e) => handleInputChange('cnic_number', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  placeholder="00000-0000000-0"
                  sx={{ flex: 1, minWidth: '250px' }}
                />
                <TextField
                  label="CNIC Expiry Date"
                  type="date"
                  value={kycData.cnic_expiry_date || ''}
                  onChange={(e) => handleInputChange('cnic_expiry_date', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    flex: 1, 
                    minWidth: '250px',
                    '& .MuiInputBase-root': { 
                      height: '56px',
                      '& .MuiInputLabel-root': { 
                        transform: 'translate(14px, 16px) scale(1)' 
                      }
                    }
                  }}
                />
              </Box>

              {/* Current and Permanent Address */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Current Address"
                  multiline
                  rows={3}
                  value={kycData.current_address}
                  onChange={(e) => handleInputChange('current_address', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                  }}
                />
                <TextField
                  label="Permanent Address"
                  multiline
                  rows={3}
                  value={kycData.permanent_address}
                  onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                  }}
                />
              </Box>

              <Divider sx={{ width: '100%', my: 3 }} />

              {/* Beneficiary Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  Beneficiary Information
                </Typography>
              </Box>

              {/* Beneficiary Name and Phone */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Beneficiary Name"
                  value={kycData.beneficiary_name}
                  onChange={(e) => handleInputChange('beneficiary_name', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
                  }}
                />
                <TextField
                  label="Beneficiary Phone/Mobile"
                  value={kycData.beneficiary_phone_mobile}
                  onChange={(e) => handleInputChange('beneficiary_phone_mobile', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
                  }}
                />
              </Box>

              {/* Beneficiary Relation */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Beneficiary Relation"
                  value={kycData.beneficiary_relation}
                  onChange={(e) => handleInputChange('beneficiary_relation', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  placeholder="e.g., Spouse, Child, Parent"
                  sx={{ flex: 1, minWidth: '250px' }}
                />
              </Box>

              {/* Beneficiary Address */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Beneficiary Address"
                  multiline
                  rows={3}
                  value={kycData.beneficiary_address}
                  onChange={(e) => handleInputChange('beneficiary_address', e.target.value)}
                  required
                  disabled={!isEditing && existingKYC}
                  sx={{ flex: 1, minWidth: '250px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                  }}
                />
              </Box>

              {/* ID Card Upload Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  ID Card Documents
                </Typography>
              </Box>

              {/* ID Card Upload Fields */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* ID Card Front */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '2px dashed #e5e7eb', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ID Card Front
                    </Typography>
                    {kycData.id_card_front ? (
                      <Box sx={{ mb: 2 }}>
                        <Image 
                          src={kycData.id_card_front} 
                          alt="ID Card Front" 
                          width={300}
                          height={200}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            objectFit: 'contain'
                          }} 
                        />
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2, color: 'text.secondary' }}>
                        <PhotoCamera sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body2">No image selected</Typography>
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="id-card-front-upload"
                      type="file"
                      onChange={handleIdCardFrontUpload}
                      disabled={!isEditing && existingKYC}
                    />
                    <label htmlFor="id-card-front-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        disabled={!isEditing && existingKYC}
                        sx={{ minWidth: 120 }}
                      >
                        {kycData.id_card_front ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </label>
                  </Box>
                </Box>

                {/* ID Card Back */}
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '2px dashed #e5e7eb', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ID Card Back
                    </Typography>
                    {kycData.id_card_back ? (
                      <Box sx={{ mb: 2 }}>
                        <Image 
                          src={kycData.id_card_back} 
                          alt="ID Card Back" 
                          width={300}
                          height={200}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            objectFit: 'contain'
                          }} 
                        />
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2, color: 'text.secondary' }}>
                        <PhotoCamera sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body2">No image selected</Typography>
                      </Box>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="id-card-back-upload"
                      type="file"
                      onChange={handleIdCardBackUpload}
                      disabled={!isEditing && existingKYC}
                    />
                    <label htmlFor="id-card-back-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        disabled={!isEditing && existingKYC}
                        sx={{ minWidth: 120 }}
                      >
                        {kycData.id_card_back ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </label>
                  </Box>
                </Box>
              </Box>

              {/* Submit Button */}
              {(!existingKYC || isEditing) && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || uploadingImages}
                    sx={{
                      px: 6,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                      }
                    }}
                  >
                    {uploadingImages ? "Uploading Images..." : loading ? "Saving..." : (existingKYC ? "Update KYC" : "Submit KYC")}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

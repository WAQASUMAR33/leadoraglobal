"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  Alert,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Person,
  LockReset,
  AccountCircle,
  TrendingUp,
  Group,
  WorkspacePremium,
  CheckCircle,
  Save,
  Edit
} from '@mui/icons-material';
import { auth } from "../../../lib/auth";
import { useAppTheme } from "../../../context/AdminThemeContext";

export default function UserProfile() {
  const { isLight } = useAppTheme();
  const [user, setUser] = useState({
    fullname: "Waqas Umar",
    username: "waqasumar33",
    email: "dilwaq22@gmail.com",
    phoneNumber: "03001234567",
    createdAt: "2025-09-05",
    currentPackage: { package_name: "Diamond Elite" },
    rank: { title: "Director Executive" }
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    fullname: 'Waqas Umar',
    username: 'waqasumar33',
    email: 'dilwaq22@gmail.com',
    phoneNumber: '03001234567'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        fullname: currentUser.fullname || currentUser.firstname || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || ''
      });
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: formData.fullname,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile information updated successfully!' });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Error updating profile' });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.message || 'Failed to change password' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: 'Error changing password' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 6, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: textPrimary, mb: 1, fontWeight: 700 }}>Session Expired</Typography>
        <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>Please log in to manage your profile.</Typography>
        <Button
          onClick={() => window.location.href = '/login'}
          variant="contained"
          sx={{ borderRadius: 0, bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700 }}
        >
          Go to Login
        </Button>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountCircle sx={{ color: '#3b82f6', fontSize: 36 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Account & Security Settings
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Manage your personal contact credentials and update your portal password.
              </Typography>
            </Box>
          </Box>
          <Button
            variant={editing ? 'outlined' : 'contained'}
            startIcon={editing ? null : <Edit />}
            onClick={() => setEditing(!editing)}
            sx={{
              borderRadius: 0,
              bgcolor: editing ? 'transparent' : '#3b82f6',
              borderColor: borderCard,
              color: editing ? textPrimary : '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: editing ? bgSubtle : '#2563eb' }
            }}
          >
            {editing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </Box>
      </Card>

      {message.text && (
        <Alert
          severity={message.type === 'success' ? 'success' : 'error'}
          sx={{
            borderRadius: 0,
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            bgcolor: message.type === 'success' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)') : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)')
          }}
        >
          {message.text}
        </Alert>
      )}

      {/* Account Overview Cards */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Username
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5, wordBreak: 'break-all' }}>
                @{user.username || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Referrals
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                {user.referralCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Earnings
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>
                PKR {parseFloat(user.totalEarnings || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Package Tier
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
                {user.packageId ? 'Active Tier' : 'Unsubscribed'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Personal Info Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person sx={{ color: '#3b82f6' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                  Personal Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, borderColor: borderCard }} />

              <form onSubmit={handleProfileUpdate}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Full Legal Name"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    disabled={!editing}
                    size="small"
                    fullWidth
                    required
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary, bgcolor: !editing ? bgSubtle : 'transparent' } }}
                  />

                  <TextField
                    label="Permanent Username"
                    name="username"
                    value={formData.username}
                    disabled
                    size="small"
                    fullWidth
                    helperText="Username cannot be modified after registration"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textSecondary, bgcolor: bgSubtle } }}
                  />

                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    size="small"
                    fullWidth
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary, bgcolor: !editing ? bgSubtle : 'transparent' } }}
                  />

                  <TextField
                    label="Contact Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!editing}
                    size="small"
                    fullWidth
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary, bgcolor: !editing ? bgSubtle : 'transparent' } }}
                  />

                  {editing && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                      <Button
                        type="button"
                        onClick={() => setEditing(false)}
                        sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        sx={{
                          borderRadius: 0,
                          bgcolor: '#10b981',
                          color: '#ffffff',
                          fontWeight: 800,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#059669' }
                        }}
                      >
                        Save Profile Changes
                      </Button>
                    </Box>
                  )}
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Form */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockReset sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                  Change Password
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, borderColor: borderCard }} />

              <form onSubmit={handlePasswordUpdate}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Current Password *"
                    name="currentPassword"
                    type="password"
                    required
                    size="small"
                    fullWidth
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />

                  <TextField
                    label="New Password *"
                    name="newPassword"
                    type="password"
                    required
                    size="small"
                    fullWidth
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    helperText="Minimum 6 characters"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />

                  <TextField
                    label="Confirm New Password *"
                    name="confirmPassword"
                    type="password"
                    required
                    size="small"
                    fullWidth
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      borderRadius: 0,
                      bgcolor: '#3b82f6',
                      color: '#ffffff',
                      fontWeight: 800,
                      py: 1.2,
                      textTransform: 'none',
                      mt: 1,
                      '&:hover': { bgcolor: '#2563eb' }
                    }}
                  >
                    Update Password
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

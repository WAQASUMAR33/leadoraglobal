"use client";

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import {
  Upgrade,
  CheckCircle,
  WorkspacePremium,
  TrendingUp,
  WarningAmber,
  InfoOutlined,
  Stars,
  ShieldOutlined
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from '../../../context/AdminThemeContext';

export default function UpgradePackagePage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [currentPackage, setCurrentPackage] = useState({
    id: 5,
    package_name: "Elite Package",
    package_amount: "30000",
    package_points: 500
  });
  const [availablePackages, setAvailablePackages] = useState([
    { id: 6, package_name: "Pro Max", package_amount: "50000", package_points: 1000 },
    { id: 7, package_name: "Master Package", package_amount: "100000", package_points: 2000 },
    { id: 8, package_name: "Combo Package", package_amount: "400000", package_points: 8000 }
  ]);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [mounted, setMounted] = useState(false);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPackageData = useCallback(async () => {
    if (!context?.user) return;
    try {
      setLoading(true);
      const [currentResponse, availableResponse] = await Promise.all([
        fetch(`/api/user/package?userId=${context.user.id}`, { credentials: 'include' }),
        fetch('/api/packages', { credentials: 'include' })
      ]);

      let currentPackageData = null;
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.success && currentData.packageDetails) {
          currentPackageData = {
            id: currentData.packageDetails.id,
            name: currentData.packageDetails.package_name,
            price: parseFloat(currentData.packageDetails.package_amount),
            description: `Direct Commission: PKR ${currentData.packageDetails.package_direct_commission}, Indirect Commission: PKR ${currentData.packageDetails.package_indirect_commission}`,
            status: currentData.userPackage?.status || 'active',
            isActive: currentData.userPackage?.status === 'active'
          };
        }
      }
      setCurrentPackage(currentPackageData);

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        let filteredPackages = [];
        if (currentPackageData && currentPackageData.isActive) {
          filteredPackages = (availableData.packages || []).filter(pkg => 
            parseFloat(pkg.package_amount) > currentPackageData.price
          );
        } else {
          filteredPackages = [];
        }
        setAvailablePackages(filteredPackages);
      }
    } catch (err) {
      console.error('Error fetching package data:', err);
      setError('Error loading package information');
    } finally {
      setLoading(false);
    }
  }, [context?.user]);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchPackageData();
    }
  }, [mounted, context?.isAuthenticated, context?.user, fetchPackageData]);

  if (!mounted || !context) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  const handleUpgrade = (pkg) => {
    setSelectedPackage(pkg);
    setConfirmDialogOpen(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPackage) return;
    setUpgrading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/user/upgrade-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ packageId: selectedPackage.id })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Package upgrade request submitted successfully!');
        setConfirmDialogOpen(false);
        setSelectedPackage(null);
        fetchPackageData();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to upgrade package');
      }
    } catch (err) {
      console.error('Error upgrading package:', err);
      setError('Network error. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const formatCurrency = (amount) => `PKR ${parseFloat(amount || 0).toLocaleString()}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Upgrade sx={{ color: '#3b82f6', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              Upgrade Package Tier
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Elevate your membership to unlock higher commission rates, elevated rank status, and expanded product points.
            </Typography>
          </Box>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: '#2563eb' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Current Package Card */}
          {currentPackage && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoOutlined sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary }}>
                      Current Active Membership
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5, borderColor: borderCard }} />

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      p: 2.5,
                      bgcolor: bgSubtle,
                      border: `1px solid ${borderCard}`,
                      gap: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <WorkspacePremium sx={{ fontSize: 36, color: '#f59e0b' }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                          {currentPackage.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: textSecondary }}>
                          {formatCurrency(currentPackage.price)} • {currentPackage.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={currentPackage.isActive ? "ACTIVE TIER" : (currentPackage.status || "INACTIVE").toUpperCase()}
                      sx={{
                        borderRadius: 0,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        bgcolor: currentPackage.isActive ? '#10b981' : '#f59e0b',
                        color: '#ffffff'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Available Upgrades */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUp sx={{ color: '#10b981' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary }}>
                    Eligible Tier Upgrades
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3, borderColor: borderCard }} />

                {availablePackages.length > 0 ? (
                  <Grid container spacing={3}>
                    {availablePackages.map((pkg) => (
                      <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                        <Card
                          sx={{
                            bgcolor: bgSubtle,
                            border: `1px solid ${borderCard}`,
                            borderRadius: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <CardContent sx={{ p: 3, flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Stars sx={{ color: '#3b82f6' }} />
                              <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                                {pkg.package_name}
                              </Typography>
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mb: 2 }}>
                              {formatCurrency(pkg.package_amount)}
                            </Typography>

                            <List sx={{ py: 0 }}>
                              <ListItem disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`Direct Commission: PKR ${pkg.package_direct_commission}`}
                                  primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                                />
                              </ListItem>
                              <ListItem disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`Indirect Commission: PKR ${pkg.package_indirect_commission}`}
                                  primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                                />
                              </ListItem>
                              <ListItem disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: '#06b6d4' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`Shopping Credit: PKR ${pkg.shopping_amount || 0}`}
                                  primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                                />
                              </ListItem>
                              <ListItem disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: '#8b5cf6' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`Package Points: ${pkg.package_points || 0}`}
                                  primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                                />
                              </ListItem>
                              {pkg.rank && (
                                <ListItem disableGutters sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <WorkspacePremium sx={{ fontSize: 16, color: '#f59e0b' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`Designated Rank: ${pkg.rank.title}`}
                                    primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </CardContent>

                          <Box sx={{ p: 3, pt: 0 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleUpgrade(pkg)}
                              disabled={upgrading}
                              sx={{
                                borderRadius: 0,
                                bgcolor: '#3b82f6',
                                color: '#ffffff',
                                fontWeight: 800,
                                py: 1.2,
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#2563eb' }
                              }}
                            >
                              Upgrade to {pkg.package_name}
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <ShieldOutlined sx={{ fontSize: 48, color: textSecondary, mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary, mb: 1 }}>
                      No Higher Upgrades Available
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, maxWidth: 500, mx: 'auto' }}>
                      {currentPackage && currentPackage.isActive
                        ? "You are already active on the top-tier package available in the system."
                        : "You need an active package before upgrading to higher tiers."}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmber sx={{ color: '#f59e0b' }} />
            Confirm Package Upgrade
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: borderCard }}>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            Are you sure you want to upgrade your tier to <strong>{selectedPackage?.package_name}</strong>?
          </Typography>

          {selectedPackage && (
            <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, mb: 2 }}>
              <Typography variant="body2" sx={{ color: textPrimary, mb: 0.5 }}>
                <strong>Tier:</strong> {selectedPackage.package_name}
              </Typography>
              <Typography variant="body2" sx={{ color: textPrimary, mb: 0.5 }}>
                <strong>Total Amount:</strong> {formatCurrency(selectedPackage.package_amount)}
              </Typography>
              <Typography variant="body2" sx={{ color: textPrimary, mb: 0.5 }}>
                <strong>Direct Commission:</strong> PKR {selectedPackage.package_direct_commission}
              </Typography>
              <Typography variant="body2" sx={{ color: textPrimary }}>
                <strong>Shopping Credit:</strong> PKR {selectedPackage.shopping_amount || 0}
              </Typography>
            </Paper>
          )}

          <Alert severity="info" sx={{ borderRadius: 0, border: '1px solid #3b82f6', bgcolor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)' }}>
            The upgrade will be submitted for processing. Tier perks and commission overrides will be updated upon confirmation.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ borderRadius: 0, color: textSecondary, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmUpgrade}
            variant="contained"
            disabled={upgrading}
            sx={{
              borderRadius: 0,
              bgcolor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            {upgrading ? 'Processing...' : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

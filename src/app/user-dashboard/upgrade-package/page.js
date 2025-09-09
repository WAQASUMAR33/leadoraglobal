"use client";

import { useState, useEffect, useContext } from 'react';
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
  ListItemSecondaryAction
} from '@mui/material';
import {
  Upgrade,
  CheckCircle,
  Star,
  TrendingUp,
  Warning,
  Info
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function UpgradePackagePage() {
  const context = useContext(UserContext);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchPackageData();
    }
  }, [mounted, context?.isAuthenticated, context?.user]);
  
  // Safety check for context
  if (!context) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  const { user, isAuthenticated } = context;

  const fetchPackageData = async () => {
    try {
      setLoading(true);
      const [currentResponse, availableResponse] = await Promise.all([
        fetch(`/api/user/package?userId=${user.id}`, { credentials: 'include' }),
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
        // Filter packages that are higher tier than current package (only if current package is active)
        let filteredPackages = [];
        
        if (currentPackageData && currentPackageData.isActive) {
          // Only show packages with higher amounts than current active package
          filteredPackages = availableData.packages.filter(pkg => 
            parseFloat(pkg.package_amount) > currentPackageData.price
          );
        } else {
          // If no active package, show no upgrade options
          filteredPackages = [];
        }
        
        setAvailablePackages(filteredPackages);
      }
    } catch (error) {
      console.error('Error fetching package data:', error);
      setError('Error loading package information');
    } finally {
      setLoading(false);
    }
  };

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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId: selectedPackage.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Package upgrade request submitted successfully!');
        setConfirmDialogOpen(false);
        setSelectedPackage(null);
        fetchPackageData(); // Refresh data
        setTimeout(() => setMessage(null), 5000);
      } else {
        setError(data.message || 'Failed to upgrade package');
      }
    } catch (error) {
      console.error('Error upgrading package:', error);
      setError('Network error. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount).toLocaleString()}`;
  };

  const getPackageIcon = (pkg) => {
    if (pkg.name.toLowerCase().includes('premium')) return <Star />;
    if (pkg.name.toLowerCase().includes('pro')) return <TrendingUp />;
    return <Upgrade />;
  };

  const getPackageColor = (pkg) => {
    if (pkg.name.toLowerCase().includes('premium')) return 'warning';
    if (pkg.name.toLowerCase().includes('pro')) return 'success';
    return 'primary';
  };

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Upgrade Package
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Current Package */}
          {currentPackage && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info />
                    Current Package
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
                    {getPackageIcon(currentPackage)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {currentPackage.name}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(currentPackage.price)} • {currentPackage.description}
                      </Typography>
                    </Box>
                    <Chip 
                      label={currentPackage.isActive ? "Active" : currentPackage.status} 
                      color={currentPackage.isActive ? "success" : "warning"} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Available Upgrades */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Upgrade />
                  Available Upgrades
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {availablePackages.length > 0 ? (
                  <Grid container spacing={2}>
                    {availablePackages.map((pkg) => (
                      <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              {getPackageIcon(pkg)}
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {pkg.package_name}
                              </Typography>
                            </Box>
                            
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${getPackageColor(pkg)}.main`, mb: 1 }}>
                              {formatCurrency(pkg.package_amount)}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Direct Commission: PKR {pkg.package_direct_commission} • Indirect Commission: PKR {pkg.package_indirect_commission}
                            </Typography>

                            {/* Package Features */}
                            <List dense>
                              <ListItem sx={{ px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`Direct Commission: PKR ${pkg.package_direct_commission}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                              <ListItem sx={{ px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`Indirect Commission: PKR ${pkg.package_indirect_commission}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                              <ListItem sx={{ px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`Shopping Amount: PKR ${pkg.shopping_amount}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                              <ListItem sx={{ px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`Package Points: ${pkg.package_points}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                              {pkg.rank && (
                                <ListItem sx={{ px: 0, py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={`Rank: ${pkg.rank.title}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              )}
                            </List>
                          </CardContent>
                          
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleUpgrade(pkg)}
                              disabled={upgrading}
                              sx={{
                                background: `linear-gradient(135deg, ${getPackageColor(pkg)}.main 0%, ${getPackageColor(pkg)}.dark 100%)`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${getPackageColor(pkg)}.dark 0%, ${getPackageColor(pkg)}.main 100%)`,
                                }
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
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Upgrade sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Upgrades Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentPackage && currentPackage.isActive
                        ? "You're already on the highest tier package available for upgrade!"
                        : currentPackage && !currentPackage.isActive
                        ? "Your current package is not active. Please activate your package first to see upgrade options."
                        : "Please subscribe to a package first to see upgrade options."
                      }
                    </Typography>
                    {currentPackage && !currentPackage.isActive && (
                      <Alert severity="warning" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
                        <Typography variant="body2">
                          <strong>Package Status:</strong> {currentPackage.status}
                          <br />
                          You need an active package to upgrade to higher tiers.
                        </Typography>
                      </Alert>
                    )}
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
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Package Upgrade
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to upgrade to the {selectedPackage?.package_name} package?
          </Typography>
          
          {selectedPackage && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Package:</strong> {selectedPackage.package_name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Price:</strong> {formatCurrency(selectedPackage.package_amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Direct Commission:</strong> PKR {selectedPackage.package_direct_commission}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Indirect Commission:</strong> PKR {selectedPackage.package_indirect_commission}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Shopping Amount:</strong> PKR {selectedPackage.shopping_amount}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Package Points:</strong> {selectedPackage.package_points}
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The upgrade will be processed after payment confirmation. 
              You will receive the benefits of the new package immediately upon successful payment.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmUpgrade}
            variant="contained"
            disabled={upgrading}
          >
            {upgrading ? 'Processing...' : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

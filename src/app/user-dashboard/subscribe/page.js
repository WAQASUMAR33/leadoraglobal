"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import Link from "next/link";
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
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  WorkspacePremium,
  AccountBalanceWallet,
  ShoppingBag,
  CheckCircle,
  Payment,
  ReceiptLong,
  TrendingUp,
  Group,
  Security,
  FlashOn
} from '@mui/icons-material';
import { UserContext } from "../../../lib/userContext";
import { useAppTheme } from "../../../context/AdminThemeContext";

export default function SubscribePackage() {
  const { user, isAuthenticated } = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [packages, setPackages] = useState([
    { id: 1, package_name: "Student Package", package_amount: "2000", package_points: 25 },
    { id: 2, package_name: "Distributer Package", package_amount: "6000", package_points: 75 },
    { id: 3, package_name: "Personal Package", package_amount: "10000", package_points: 150 },
    { id: 4, package_name: "Professional Package", package_amount: "15000", package_points: 250 },
    { id: 5, package_name: "Elite Package", package_amount: "30000", package_points: 500 },
    { id: 6, package_name: "Pro Max", package_amount: "50000", package_points: 1000 },
    { id: 7, package_name: "Master Package", package_amount: "100000", package_points: 2000 },
    { id: 8, package_name: "Combo Package", package_amount: "400000", package_points: 8000 }
  ]);
  const [userBalance, setUserBalance] = useState(0);
  const [shoppingAmount, setShoppingAmount] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  const fetchUserBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserBalance(parseFloat(data.user.balance || 0));
          setShoppingAmount(parseFloat(data.user.shoppingAmount || 0));
        }
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPackages();
    if (user && isAuthenticated) {
      fetchUserBalance();
      if (user.balance !== undefined) setUserBalance(parseFloat(user.balance || 0));
      if (user.shoppingAmount !== undefined) setShoppingAmount(parseFloat(user.shoppingAmount || 0));
    }
  }, [user, isAuthenticated, fetchUserBalance]);

  const handleBalancePayment = async (packageId) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/user/subscribe-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, packageId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Package subscribed successfully using your balance!');
        setUserBalance(data.data.newBalance);
        setSelectedPackage(null);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/user-dashboard/my-package';
          }
        }, 1800);
      } else {
        setError(data.error || 'Failed to subscribe to package');
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleShoppingAmountPayment = async (packageId) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/user/subscribe-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, packageId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Package request submitted successfully! Admin will review and approve your request.');
        setSelectedPackage(null);
        fetchUserBalance();
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/user-dashboard/package-request';
          }
        }, 1800);
      } else {
        setError(data.error || 'Failed to subscribe with shopping amount');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePackageRequest = (packageId) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/user-dashboard/package-request?packageId=${packageId}`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 2 }}>
        <CircularProgress size={36} sx={{ color: '#2563eb' }} />
        <Typography variant="body2" sx={{ color: textSecondary }}>Loading available subscription tiers...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <WorkspacePremium sx={{ color: '#3b82f6', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Subscribe to a Package
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Choose a tier that matches your investment goals to unlock direct and indirect commissions.
            </Typography>

            {user && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                <Chip
                  icon={<AccountBalanceWallet sx={{ fontSize: '18px !important', color: '#10b981 !important' }} />}
                  label={`E-Wallet Balance: PKR ${userBalance.toLocaleString()}`}
                  sx={{
                    borderRadius: 0,
                    bgcolor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
                    color: isLight ? '#065f46' : '#6ee7b7',
                    border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.3)'}`,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    height: 32
                  }}
                />
                <Chip
                  icon={<ShoppingBag sx={{ fontSize: '18px !important', color: '#06b6d4 !important' }} />}
                  label={`Shopping Wallet: PKR ${shoppingAmount.toLocaleString()}`}
                  sx={{
                    borderRadius: 0,
                    bgcolor: isLight ? '#ecfeff' : 'rgba(6, 182, 212, 0.12)',
                    color: isLight ? '#0e7490' : '#67e8f9',
                    border: `1px solid ${isLight ? '#a5f3fc' : 'rgba(6, 182, 212, 0.3)'}`,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    height: 32
                  }}
                />
              </Box>
            )}
          </Box>

          <Button
            component={Link}
            href="/user-dashboard/my-package"
            variant="outlined"
            sx={{
              borderRadius: 0,
              borderColor: '#3b82f6',
              color: '#3b82f6',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)', borderColor: '#2563eb' }
            }}
          >
            View Active Package
          </Button>
        </Box>
      </Card>

      {/* Notifications */}
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

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: textPrimary, mb: 1, fontWeight: 700 }}>No Packages Available</Typography>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            There are currently no active package tiers. Please contact support.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {packages.map((pkg) => {
            const isSelected = selectedPackage?.id === pkg.id;
            const price = parseFloat(pkg.package_amount || 0);
            const canPayBalance = userBalance >= price;
            const canPayShopping = shoppingAmount >= price;

            return (
              <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                <Card
                  sx={{
                    bgcolor: bgCard,
                    border: isSelected ? '2px solid #3b82f6' : `1px solid ${borderCard}`,
                    borderRadius: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.15s ease-in-out',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: '#3b82f6',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        px: 1.5,
                        py: 0.4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Selected
                    </Box>
                  )}

                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 800, letterSpacing: '0.1em' }}>
                        Tier Tier
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary }}>
                        {pkg.package_name}
                      </Typography>
                    </Box>

                    <Box sx={{ my: 2, p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}` }}>
                      <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                        One-Time Price
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5 }}>
                        ₨{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>

                    <List sx={{ py: 0, my: 1, flexGrow: 1 }}>
                      <ListItem disableGutters sx={{ py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Direct Commission: PKR ${pkg.package_direct_commission || 0}`}
                          primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Indirect Commission: PKR ${pkg.package_indirect_commission || 0}`}
                          primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                        />
                      </ListItem>
                      {pkg.shopping_amount && (
                        <ListItem disableGutters sx={{ py: 0.75 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ fontSize: 18, color: '#06b6d4' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Shopping Credit: PKR ${pkg.shopping_amount}`}
                            primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                          />
                        </ListItem>
                      )}
                      {pkg.rank && (
                        <ListItem disableGutters sx={{ py: 0.75 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <WorkspacePremium sx={{ fontSize: 18, color: '#f59e0b' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Rank: ${pkg.rank.title}`}
                            primaryTypographyProps={{ variant: 'body2', sx: { color: textPrimary, fontWeight: 600 } }}
                          />
                        </ListItem>
                      )}
                    </List>

                    <Divider sx={{ my: 2, borderColor: borderCard }} />

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {!isSelected ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => setSelectedPackage(pkg)}
                          sx={{
                            borderRadius: 0,
                            borderColor: borderCard,
                            color: textPrimary,
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 1.2,
                            '&:hover': { bgcolor: isLight ? '#f1f5f9' : '#1e293b', borderColor: '#3b82f6' }
                          }}
                        >
                          Select Package
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="contained"
                            fullWidth
                            disabled={!canPayBalance || processing}
                            onClick={() => handleBalancePayment(pkg.id)}
                            startIcon={<FlashOn />}
                            sx={{
                              borderRadius: 0,
                              bgcolor: '#10b981',
                              color: '#ffffff',
                              fontWeight: 800,
                              textTransform: 'none',
                              py: 1.2,
                              '&:hover': { bgcolor: '#059669' },
                              '&.Mui-disabled': { bgcolor: isLight ? '#e2e8f0' : '#1e293b', color: textSecondary }
                            }}
                          >
                            {processing ? 'Processing...' : canPayBalance ? 'Pay from E-Wallet Balance' : 'Insufficient E-Wallet'}
                          </Button>

                          <Button
                            variant="contained"
                            fullWidth
                            disabled={!canPayShopping || processing}
                            onClick={() => handleShoppingAmountPayment(pkg.id)}
                            startIcon={<ShoppingBag />}
                            sx={{
                              borderRadius: 0,
                              bgcolor: '#06b6d4',
                              color: '#ffffff',
                              fontWeight: 800,
                              textTransform: 'none',
                              py: 1.2,
                              '&:hover': { bgcolor: '#0891b2' },
                              '&.Mui-disabled': { bgcolor: isLight ? '#e2e8f0' : '#1e293b', color: textSecondary }
                            }}
                          >
                            {canPayShopping ? 'Pay via Shopping Wallet' : 'Insufficient Shopping Wallet'}
                          </Button>

                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => handlePackageRequest(pkg.id)}
                            startIcon={<ReceiptLong />}
                            sx={{
                              borderRadius: 0,
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                              fontWeight: 700,
                              textTransform: 'none',
                              py: 1,
                              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' }
                            }}
                          >
                            Submit Bank Deposit Proof
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Payment Options Overview */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 2 }}>
          Payment & Activation Channels
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <FlashOn sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textPrimary }}>
                  Instant Balance
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Activates your package immediately using earnings or deposited balance in your E-Wallet.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <ShoppingBag sx={{ color: '#06b6d4' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textPrimary }}>
                  Shopping Wallet
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Submit package request using accumulated shopping wallet reserves. Verified and approved by admin.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <ReceiptLong sx={{ color: '#3b82f6' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textPrimary }}>
                  Bank Transfer / Proof
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Direct bank transfer to official accounts with receipt screenshot upload for manual admin confirmation.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Package Perks */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 2 }}>
          Why Upgrade Your Tier?
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TrendingUp sx={{ color: '#3b82f6', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
                  Maximized Commissions
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                  Higher packages yield higher direct reward rates and deep indirect team commissions.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Group sx={{ color: '#10b981', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
                  Full Downline Unlocks
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                  Grow unlimited binary & unilevel downlines and receive team bonuses across multiple tiers.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Security sx={{ color: '#8b5cf6', fontSize: 32 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
                  Official Rank Badges
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                  Qualify for company leadership ranks, exclusive merchandise, and pool profit distributions.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}

"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../../lib/userContext";
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  Inventory2Outlined,
  AccountBalanceWalletOutlined,
  TrendingUp,
  CheckCircle,
  PendingActions,
  Cancel,
  ArrowForward,
  SwapHoriz
} from "@mui/icons-material";

export default function MyPackagePage() {
  const { user, isAuthenticated } = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [userPackage, setUserPackage] = useState({
    package_name: "Diamond Elite Package",
    package_amount: 500,
    package_points: 500,
    daily_earning: 15,
    validity_days: 365,
    status: "active"
  });
  const [loading, setLoading] = useState(false);
  const [packageDetails, setPackageDetails] = useState(null);
  const [packageRequests, setPackageRequests] = useState([]);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    const userId = user?.id || 1;
    fetchUserPackage(userId);
    fetchPackageRequests(userId);
    fetchUserBalance();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, isAuthenticated]);

  const fetchUserPackage = async (userId) => {
    try {
      const response = await fetch(`/api/user/package?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.userPackage) {
          setUserPackage(data.userPackage);
          if (data.packageDetails) {
            setPackageDetails(data.packageDetails);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user package:', error);
    } finally {
      setLoading(false);
    }

    // Default package fallback if offline or guest preview
    setUserPackage({
      package_name: "Diamond Elite Package",
      package_amount: 500,
      package_points: 500,
      daily_earning: 15,
      validity_days: 365,
      status: "active"
    });
    setPackageDetails({
      package_name: "Diamond Elite Package",
      package_amount: 500,
      package_points: 500,
      daily_earning: 15,
      validity_days: 365
    });
  };

  const fetchPackageRequests = async (userId) => {
    try {
      const response = await fetch(`/api/package-requests?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const reqs = data.packageRequests || data.data || (Array.isArray(data) ? data : []);
        setPackageRequests(reqs);
      }
    } catch (error) {
      console.error('Error fetching package requests:', error);
      setPackageRequests([]);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserBalance(parseFloat(data.user.balance || 0));
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const getStatusChip = (status) => {
    const s = (status || 'pending').toLowerCase();
    let color = '#f59e0b';
    let bg = 'rgba(245, 158, 11, 0.12)';
    let border = '1px solid rgba(245, 158, 11, 0.3)';

    if (s === 'approved' || s === 'active') {
      color = '#10b981';
      bg = 'rgba(16, 185, 129, 0.12)';
      border = '1px solid rgba(16, 185, 129, 0.3)';
    } else if (s === 'rejected' || s === 'expired') {
      color = '#ef4444';
      bg = 'rgba(239, 68, 68, 0.12)';
      border = '1px solid rgba(239, 68, 68, 0.3)';
    }

    return (
      <Chip
        label={s.toUpperCase()}
        size="small"
        sx={{
          borderRadius: 0,
          fontWeight: 800,
          fontSize: '0.68rem',
          letterSpacing: '0.04em',
          color: color,
          backgroundColor: bg,
          border: border
        }}
      />
    );
  };

  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const cardHeaderBg = isLight ? "#f8fafc" : "#0f172a";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.85rem' }}>
          LOADING PACKAGE DETAILS...
        </Typography>
      </Box>
    );
  }

  const pkg = packageDetails || userPackage;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Inventory2Outlined sx={{ color: "#6366f1", fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
              My Package Subscription
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Review your active package tier, commission qualifications, and deposit history.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            component={Link}
            href="/user-dashboard/upgrade-package"
            variant="outlined"
            size="small"
            startIcon={<SwapHoriz sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 0,
              borderColor: isLight ? "#cbd5e1" : "#1e293b",
              color: textPrimary,
              fontWeight: 700,
              fontSize: "0.78rem"
            }}
          >
            Upgrade Tier
          </Button>
          <Button
            component={Link}
            href="/user-dashboard/subscribe"
            variant="contained"
            size="small"
            sx={{
              borderRadius: 0,
              backgroundColor: "#6366f1",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.78rem",
              "&:hover": { backgroundColor: "#4f46e5" }
            }}
          >
            + New Package Request
          </Button>
        </Box>
      </Box>

      {/* Package Status Banner */}
      {pkg ? (
        <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, borderLeft: "4px solid #6366f1", p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
                  {pkg.package_name || pkg.name || 'Tier Subscription'}
                </Typography>
                {getStatusChip(userPackage?.status || 'active')}
              </Box>
              <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
                Package Investment Capital: <strong style={{ color: '#10b981' }}>PKR {parseFloat(pkg.package_amount || pkg.amount || 0).toLocaleString()}</strong>
              </Typography>
            </Grid>

            <Grid item xs={12} md={5}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.02)", border: cardBorder }}>
                    <Typography variant="caption" sx={{ color: textSecondary }}>Direct Bonus</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#6366f1" }}>
                      PKR {parseFloat(pkg.package_direct_commission || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.02)", border: cardBorder }}>
                    <Typography variant="caption" sx={{ color: textSecondary }}>Shopping Limit</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#10b981" }}>
                      PKR {parseFloat(pkg.package_shopping_amount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: 5, textAlign: "center" }}>
          <Inventory2Outlined sx={{ fontSize: 44, color: textSecondary, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 0.5 }}>
            No Active Investment Package
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2.5 }}>
            Activate a subscription package to start earning maximum referral tree commissions.
          </Typography>
          <Button
            component={Link}
            href="/user-dashboard/subscribe"
            variant="contained"
            sx={{ borderRadius: 0, backgroundColor: "#6366f1", color: "#fff", fontWeight: 700 }}
          >
            Browse Available Packages
          </Button>
        </Card>
      )}

      {/* Package Requests History */}
      <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
        <Box sx={{ p: 2, px: 2.5, backgroundColor: cardHeaderBg, borderBottom: cardBorder }}>
          <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem", letterSpacing: "0.04em" }}>
            PACKAGE REQUESTS ARCHIVE ({packageRequests.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: cardHeaderBg }}>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.74rem", textTransform: "uppercase" }}>Package Name</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.74rem", textTransform: "uppercase" }}>Investment Amount</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.74rem", textTransform: "uppercase" }}>Transaction Reference</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.74rem", textTransform: "uppercase" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.74rem", textTransform: "uppercase" }}>Submission Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packageRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: textSecondary }}>
                    No package deposit requests recorded.
                  </TableCell>
                </TableRow>
              ) : (
                packageRequests.map((req, i) => (
                  <TableRow key={req.id || i} hover>
                    <TableCell sx={{ fontWeight: 700, color: textPrimary }}>
                      {req.package?.package_name || req.packageName || 'Package Tier'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#10b981", fontFamily: "monospace" }}>
                      PKR {parseFloat(req.package?.package_amount || req.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: textSecondary, fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {req.transactionId || '—'}
                    </TableCell>
                    <TableCell>{getStatusChip(req.status)}</TableCell>
                    <TableCell sx={{ color: textSecondary, fontSize: "0.8rem" }}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

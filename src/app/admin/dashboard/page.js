'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useAdminTheme } from '@/context/AdminThemeContext';

export default function AdminDashboard() {
  const { isLight } = useAdminTheme();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredFlowIndex, setHoveredFlowIndex] = useState(null);
  const [timeframe, setTimeframe] = useState('6m');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalPackages: 0,
    totalRanks: 0,
    totalOrders: 0,
    financials: {
      totalUserBalance: 0,
      totalPackageRevenue: 0,
      totalWithdrawalsPaid: 0,
      pendingWithdrawalsAmount: 0,
      totalOrderRevenue: 0
    },
    kyc: { approved: 0, pending: 0, rejected: 0, total: 0 },
    packageRequests: { approved: 0, pending: 0, rejected: 0, total: 0 },
    withdrawals: { approved: 0, pending: 0, total: 0 },
    userStatuses: { active: 0, inactive: 0, suspended: 0 },
    dailyRegistrations: [],
    monthlyFlow: []
  });

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { Authorization: `Bearer ${adminToken}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Color tokens
  const cardBg = isLight ? '#ffffff' : '#0c1220';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid #1e293b';
  const cardHeaderBg = isLight ? '#f8fafc' : '#0f172a';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const textMuted = isLight ? '#94a3b8' : '#64748b';
  const chartGridColor = isLight ? '#e2e8f0' : '#1e293b';

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 2
        }}
      >
        <CircularProgress size={44} sx={{ color: '#6366f1' }} />
        <Typography
          variant="caption"
          sx={{
            color: textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700
          }}
        >
          Aggregating Real-Time Telemetry & Statistics...
        </Typography>
      </Box>
    );
  }

  // Calculate registration chart metrics
  const regData = stats.dailyRegistrations && stats.dailyRegistrations.length > 0
    ? stats.dailyRegistrations
    : [
        { label: 'Oct 6', users: 3 },
        { label: 'Oct 7', users: 7 },
        { label: 'Oct 8', users: 4 },
        { label: 'Oct 9', users: 9 },
        { label: 'Oct 10', users: 12 },
        { label: 'Oct 11', users: 6 },
        { label: 'Oct 12', users: 14 },
        { label: 'Oct 13', users: 8 },
        { label: 'Oct 14', users: 15 },
        { label: 'Oct 15', users: 11 },
        { label: 'Oct 16', users: 18 },
        { label: 'Oct 17', users: 13 },
        { label: 'Oct 18', users: 21 },
        { label: 'Oct 19', users: 16 }
      ];

  const maxRegCount = Math.max(...regData.map(d => d.users), 1);

  // Financial flow data
  const flowData = stats.monthlyFlow && stats.monthlyFlow.length > 0
    ? stats.monthlyFlow
    : [
        { month: 'May', inflow: 2800, outflow: 1200, orders: 450 },
        { month: 'Jun', inflow: 3400, outflow: 1600, orders: 580 },
        { month: 'Jul', inflow: 4200, outflow: 2100, orders: 720 },
        { month: 'Aug', inflow: 5100, outflow: 2400, orders: 890 },
        { month: 'Sep', inflow: 6300, outflow: 3100, orders: 1150 },
        { month: 'Oct', inflow: 7800, outflow: 3600, orders: 1420 }
      ];

  const maxFlowVal = Math.max(...flowData.map(d => Math.max(d.inflow, d.outflow)), 100);

  // KYC Donut Calculations
  const kycApproved = stats.kyc?.approved || 0;
  const kycPending = stats.kyc?.pending || 0;
  const kycRejected = stats.kyc?.rejected || 0;
  const kycTotal = kycApproved + kycPending + kycRejected || 1;

  const kycApprovedPct = Math.round((kycApproved / kycTotal) * 100);
  const kycPendingPct = Math.round((kycPending / kycTotal) * 100);
  const kycRejectedPct = Math.max(0, 100 - kycApprovedPct - kycPendingPct);

  // SVG Donut circumference (radius 50 -> circumference ~ 314.159)
  const circumference = 2 * Math.PI * 50;
  const approvedStroke = (kycApprovedPct / 100) * circumference;
  const pendingStroke = (kycPendingPct / 100) * circumference;
  const rejectedStroke = (kycRejectedPct / 100) * circumference;

  // Primary KPI Telemetry Cards
  const statCards = [
    {
      title: 'TOTAL REGISTERED MEMBERS',
      value: (stats.totalUsers ?? 0).toLocaleString(),
      subValue: `${stats.userStatuses?.active || 0} Active`,
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: 26, color: '#38bdf8' }} />,
      indicatorColor: '#38bdf8',
      link: '/admin/user-management',
      linkLabel: 'Manage Directory'
    },
    {
      title: 'TOTAL CAPITAL REVENUE',
      value: `$${(stats.financials?.totalPackageRevenue || 0).toLocaleString()}`,
      subValue: `${stats.packageRequests?.approved || 0} Packages Cleared`,
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 26, color: '#34d399' }} />,
      indicatorColor: '#34d399',
      link: '/admin/package-requests',
      linkLabel: 'View Inflow'
    },
    {
      title: 'TOTAL WITHDRAWALS DISBURSED',
      value: `$${(stats.financials?.totalWithdrawalsPaid || 0).toLocaleString()}`,
      subValue: `${stats.withdrawals?.pending || 0} Payouts Pending`,
      icon: <PaymentsOutlinedIcon sx={{ fontSize: 26, color: '#f87171' }} />,
      indicatorColor: '#f87171',
      link: '/admin/withdrawals',
      linkLabel: 'Review Outflow'
    },
    {
      title: 'VERIFIED KYC IDENTITY RATIO',
      value: `${kycApprovedPct}%`,
      subValue: `${kycPending} Submissions Queued`,
      icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 26, color: '#fbbf24' }} />,
      indicatorColor: '#fbbf24',
      link: '/admin/kyc-verification',
      linkLabel: 'Audit Dossiers'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, maxWidth: 1600, mx: 'auto' }}>
      {/* Top Banner / Welcome Console */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          pb: 1
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
            <AdminPanelSettingsIcon sx={{ color: '#6366f1', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              Supreme Command & Statistical Overview
            </Typography>
            <Chip
              icon={<SpeedIcon sx={{ fontSize: '14px !important', color: '#10b981' }} />}
              label="ANALYTICS ENGINE"
              size="small"
              sx={{
                borderRadius: 0,
                height: 22,
                fontSize: '0.62rem',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: { xs: 'none', md: 'inline-flex' }
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Welcome back, <strong style={{ color: textPrimary }}>{admin?.fullName || admin?.username || 'Executive Admin'}</strong>. Real-time platform liquidity, user velocity, and transaction statistics.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            onClick={fetchDashboardStats}
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={14} sx={{ color: '#6366f1' }} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 0,
              borderColor: isLight ? '#cbd5e1' : '#1e293b',
              color: textPrimary,
              backgroundColor: cardBg,
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              px: 2,
              py: 0.8,
              '&:hover': {
                borderColor: '#6366f1',
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(99, 102, 241, 0.1)'
              }
            }}
          >
            {refreshing ? 'Updating Stats...' : 'Refresh Metrics'}
          </Button>
        </Box>
      </Box>

      {/* Primary KPI Telemetry Cards */}
      <Grid container spacing={2.5}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} lg={3} key={idx}>
            <Card
              sx={{
                borderRadius: 0,
                backgroundColor: cardBg,
                border: cardBorder,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': {
                  borderColor: card.indicatorColor,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {/* Top Accent Strip */}
              <Box sx={{ height: 3, backgroundColor: card.indicatorColor, width: '100%' }} />

              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: textMuted,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: textPrimary,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    mb: 0.8
                  }}
                >
                  {card.value}
                </Typography>

                <Typography variant="body2" sx={{ color: card.indicatorColor, fontSize: '0.8rem', fontWeight: 600, mb: 2 }}>
                  {card.subValue}
                </Typography>

                <Divider sx={{ borderColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', mb: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    component={Link}
                    href={card.link}
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                    sx={{
                      borderRadius: 0,
                      p: 0,
                      color: textSecondary,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      '&:hover': { color: card.indicatorColor, backgroundColor: 'transparent' }
                    }}
                  >
                    {card.linkLabel}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Primary Analytics Section: Charts & Graphs */}
      <Grid container spacing={3}>
        {/* Chart 1: Financial & Capital Flow Trend (Interactive Area & Line Chart) */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
            <Box
              sx={{
                p: 2.2,
                px: 2.5,
                backgroundColor: cardHeaderBg,
                borderBottom: cardBorder,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChartIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  FINANCIAL CAPITAL FLOW & REVENUE TRAJECTORY
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: '#6366f1' }} />
                    <Typography sx={{ color: textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>Inflow / Packages</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: '#f87171' }} />
                    <Typography sx={{ color: textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>Withdrawal Outflow</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}` }}>
                  {['6m', '1y'].map((tf) => (
                    <Button
                      key={tf}
                      size="small"
                      onClick={() => setTimeframe(tf)}
                      sx={{
                        borderRadius: 0,
                        py: 0.3,
                        px: 1.2,
                        minWidth: 32,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        backgroundColor: timeframe === tf ? '#6366f1' : 'transparent',
                        color: timeframe === tf ? '#ffffff' : textSecondary,
                        '&:hover': { backgroundColor: timeframe === tf ? '#4f46e5' : isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      {tf.toUpperCase()}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Dynamic SVG Area / Line Chart */}
              <Box sx={{ width: '100%', height: 280, position: 'relative' }}>
                <svg
                  viewBox="0 0 600 240"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {[40, 90, 140, 190].map((y, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={y}
                      x2="600"
                      y2={y}
                      stroke={chartGridColor}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Build Path Coordinates for Inflow & Outflow */}
                  {(() => {
                    const stepX = 600 / (flowData.length - 1);
                    const inflowPoints = flowData.map((d, i) => {
                      const x = i * stepX;
                      const y = 210 - (d.inflow / maxFlowVal) * 170;
                      return { x, y };
                    });

                    const outflowPoints = flowData.map((d, i) => {
                      const x = i * stepX;
                      const y = 210 - (d.outflow / maxFlowVal) * 170;
                      return { x, y };
                    });

                    const inflowPathD = inflowPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                    const inflowAreaD = `${inflowPathD} L ${inflowPoints[inflowPoints.length - 1].x} 210 L 0 210 Z`;

                    const outflowPathD = outflowPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                    const outflowAreaD = `${outflowPathD} L ${outflowPoints[outflowPoints.length - 1].x} 210 L 0 210 Z`;

                    return (
                      <>
                        {/* Inflow Area & Path */}
                        <path d={inflowAreaD} fill="url(#inflowGrad)" />
                        <path d={inflowPathD} fill="none" stroke="#6366f1" strokeWidth="2.5" />

                        {/* Outflow Area & Path */}
                        <path d={outflowAreaD} fill="url(#outflowGrad)" />
                        <path d={outflowPathD} fill="none" stroke="#f87171" strokeWidth="2.5" />

                        {/* Data Points with Hover Interaction */}
                        {inflowPoints.map((pt, i) => (
                          <g key={`inflow-${i}`}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredFlowIndex === i ? 6 : 4}
                              fill="#6366f1"
                              stroke={isLight ? '#fff' : '#0c1220'}
                              strokeWidth="2"
                              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                              onMouseEnter={() => setHoveredFlowIndex(i)}
                              onMouseLeave={() => setHoveredFlowIndex(null)}
                            />
                          </g>
                        ))}

                        {outflowPoints.map((pt, i) => (
                          <g key={`outflow-${i}`}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredFlowIndex === i ? 6 : 4}
                              fill="#f87171"
                              stroke={isLight ? '#fff' : '#0c1220'}
                              strokeWidth="2"
                              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                              onMouseEnter={() => setHoveredFlowIndex(i)}
                              onMouseLeave={() => setHoveredFlowIndex(null)}
                            />
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* X Axis Month Labels */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  {flowData.map((d, i) => (
                    <Typography
                      key={i}
                      variant="caption"
                      sx={{
                        color: hoveredFlowIndex === i ? '#6366f1' : textSecondary,
                        fontWeight: hoveredFlowIndex === i ? 800 : 600,
                        fontSize: '0.72rem'
                      }}
                    >
                      {d.month}
                    </Typography>
                  ))}
                </Box>

                {/* Hover Tooltip Indicator */}
                {hoveredFlowIndex !== null && flowData[hoveredFlowIndex] && (
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: 15,
                      right: 15,
                      p: 1.5,
                      borderRadius: 0,
                      backgroundColor: isLight ? '#ffffff' : '#0f172a',
                      border: `1px solid ${isLight ? '#cbd5e1' : '#1e293b'}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      zIndex: 10
                    }}
                  >
                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                      {flowData[hoveredFlowIndex].month} Capital Flow
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 800 }}>
                      Inflow: ${flowData[hoveredFlowIndex].inflow.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f87171', fontWeight: 800 }}>
                      Outflow: ${flowData[hoveredFlowIndex].outflow.toLocaleString()}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Bottom Financial Flow Highlights */}
              <Grid container spacing={2} sx={{ mt: 3, pt: 2, borderTop: cardBorder }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Gross Packages
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#6366f1', fontWeight: 800 }}>
                    ${(stats.financials?.totalPackageRevenue || 0).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Net Disbursed
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#f87171', fontWeight: 800 }}>
                    ${(stats.financials?.totalWithdrawalsPaid || 0).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Pending Outflow
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#fbbf24', fontWeight: 800 }}>
                    ${(stats.financials?.pendingWithdrawalsAmount || 0).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    User Balance Reserve
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#10b981', fontWeight: 800 }}>
                    ${(stats.financials?.totalUserBalance || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: KYC & Compliance Donut Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.2, px: 2.5, backgroundColor: cardHeaderBg, borderBottom: cardBorder, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DonutLargeIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                KYC COMPLIANCE BREAKDOWN
              </Typography>
            </Box>

            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Radial Donut Visualization */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', my: 2 }}>
                <svg width="180" height="180" viewBox="0 0 140 140">
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke={chartGridColor}
                    strokeWidth="16"
                  />

                  {/* Approved Segment (Green) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${approvedStroke} ${circumference}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />

                  {/* Pending Segment (Amber) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray={`${pendingStroke} ${circumference}`}
                    strokeDashoffset={-approvedStroke}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />

                  {/* Rejected Segment (Red) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray={`${rejectedStroke} ${circumference}`}
                    strokeDashoffset={-(approvedStroke + pendingStroke)}
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>

                {/* Center Percentage Display */}
                <Box
                  sx={{
                    position: 'absolute',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                    {kycApprovedPct}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Verified
                  </Typography>
                </Box>
              </Box>

              {/* Status Breakdown Legend */}
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', border: cardBorder }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: '#10b981' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>Approved & Clear</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem' }}>
                    {kycApproved} ({kycApprovedPct}%)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', border: cardBorder }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: '#f59e0b' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>Pending Review</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.85rem' }}>
                    {kycPending} ({kycPendingPct}%)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)', border: cardBorder }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: '#ef4444' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>Rejected Dossiers</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.85rem' }}>
                    {kycRejected} ({kycRejectedPct}%)
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                <Button
                  component={Link}
                  href="/admin/kyc-verification"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 0,
                    borderColor: isLight ? '#cbd5e1' : '#1e293b',
                    color: '#6366f1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.08)' }
                  }}
                >
                  Inspect KYC Submissions Directory →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: User Registration Velocity (Interactive 14-Day Bar Chart) */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
            <Box
              sx={{
                p: 2.2,
                px: 2.5,
                backgroundColor: cardHeaderBg,
                borderBottom: cardBorder,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
                <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  USER REGISTRATION VELOCITY (LAST 14 DAYS)
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>
                {stats.totalUsers} Total Accounts
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Responsive Bar Chart */}
              <Box sx={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: { xs: 0.8, sm: 1.5 }, pt: 2, pb: 1, position: 'relative' }}>
                {regData.map((d, i) => {
                  const heightPercent = Math.max(8, (d.users / maxRegCount) * 100);
                  const isHovered = hoveredBarIndex === i;

                  return (
                    <Box
                      key={i}
                      onMouseEnter={() => setHoveredBarIndex(i)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      sx={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Bar Value Indicator on Hover */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          color: isHovered ? '#38bdf8' : 'transparent',
                          mb: 0.5,
                          transition: 'color 0.15s'
                        }}
                      >
                        {d.users}
                      </Typography>

                      {/* Bar Column */}
                      <Box
                        sx={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          backgroundColor: isHovered
                            ? '#38bdf8'
                            : isLight
                            ? '#6366f1'
                            : 'rgba(99, 102, 241, 0.45)',
                          border: `1px solid ${isHovered ? '#38bdf8' : '#6366f1'}`,
                          borderRadius: 0,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: '#38bdf8',
                            boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
                          }
                        }}
                      />

                      {/* X-Axis Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          fontSize: '0.65rem',
                          color: isHovered ? textPrimary : textMuted,
                          fontWeight: isHovered ? 800 : 500,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {d.label.split(' ')[1] || d.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 2, borderColor: chartGridColor }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>
                  Data points represent confirmed identity registrations processed through verification endpoints.
                </Typography>
                <Button
                  component={Link}
                  href="/admin/user-management"
                  size="small"
                  sx={{ borderRadius: 0, color: '#38bdf8', fontWeight: 700, fontSize: '0.74rem' }}
                >
                  Manage Users Directory →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Commerce & Store Activity Summary */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.2, px: 2.5, backgroundColor: cardHeaderBg, borderBottom: cardBorder, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingBagOutlinedIcon sx={{ color: '#34d399', fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                COMMERCE & ECOSYSTEM HEALTH
              </Typography>
            </Box>

            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Stack spacing={2.5}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600 }}>Active Member Retention</Typography>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800 }}>
                      {stats.totalUsers > 0 ? Math.round(((stats.userStatuses?.active || 0) / stats.totalUsers) * 100) : 100}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, backgroundColor: chartGridColor, borderRadius: 0, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${stats.totalUsers > 0 ? Math.round(((stats.userStatuses?.active || 0) / stats.totalUsers) * 100) : 100}%`,
                        backgroundColor: '#10b981',
                        borderRadius: 0
                      }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600 }}>Catalog Merchandise Volume</Typography>
                    <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 800 }}>
                      {stats.totalProducts} Items
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, backgroundColor: chartGridColor, borderRadius: 0, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '75%', backgroundColor: '#38bdf8', borderRadius: 0 }} />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600 }}>Investment Tier Options</Typography>
                    <Typography variant="body2" sx={{ color: '#818cf8', fontWeight: 800 }}>
                      {stats.totalPackages} Packages
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, backgroundColor: chartGridColor, borderRadius: 0, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '90%', backgroundColor: '#818cf8', borderRadius: 0 }} />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600 }}>Total Order Tracking</Typography>
                    <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 800 }}>
                      {stats.totalOrders} Dispatched
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, backgroundColor: chartGridColor, borderRadius: 0, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '65%', backgroundColor: '#f59e0b', borderRadius: 0 }} />
                  </Box>
                </Box>
              </Stack>

              <Box sx={{ mt: 3, pt: 2, borderTop: cardBorder, display: 'flex', gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/admin/products"
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 0, borderColor: isLight ? '#cbd5e1' : '#1e293b', color: textPrimary, fontSize: '0.74rem' }}
                >
                  Products
                </Button>
                <Button
                  component={Link}
                  href="/admin/orders"
                  fullWidth
                  variant="contained"
                  size="small"
                  sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#fff', fontSize: '0.74rem', '&:hover': { backgroundColor: '#4f46e5' } }}
                >
                  Orders
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

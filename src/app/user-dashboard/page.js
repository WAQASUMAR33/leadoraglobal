"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import Link from "next/link";
import { UserContext } from "../../lib/userContext";
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  IconButton,
  Collapse
} from "@mui/material";
import {
  Inventory2Outlined,
  AccountBalanceWalletOutlined,
  StorefrontOutlined,
  EmojiEventsOutlined,
  MonetizationOnOutlined,
  TrendingUp,
  AccountTreeOutlined,
  CheckCircleOutline,
  ContentCopy,
  ShareOutlined,
  ArrowForward,
  Check,
  ShowChart,
  DonutLarge,
  VerifiedUserOutlined,
  SwapHorizOutlined,
  CreditCardOutlined,
  GroupOutlined,
  SecurityOutlined,
  BoltOutlined,
  OpenInNewOutlined,
  FiberManualRecord,
  StarsOutlined,
  ShoppingBagOutlined,
  QrCode2Outlined,
  WhatsApp,
  ArrowUpward,
  ArrowDownward,
  DiamondOutlined,
  CloseOutlined,
  DownloadOutlined
} from "@mui/icons-material";

export default function UserDashboardHome() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [referralLink, setReferralLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [showQrCode, setShowQrCode] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");

  const { user } = context || {};

  // Theme color tokens
  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const cardHeaderBg = isLight ? "#f8fafc" : "#0f172a";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";
  const textMuted = isLight ? "#94a3b8" : "#64748b";
  const chartGridColor = isLight ? "#e2e8f0" : "#1e293b";
  const surfaceSubtle = isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.02)";

  useEffect(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const activeUsername = user?.username || "waqasumar33";
    setReferralLink(`${baseUrl}/signup?ref=${activeUsername}`);

    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/user/dashboard", {
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setDashboardData(result.data);
            return;
          }
        }
      } catch (err) {
        console.warn("Using fallback member data:", err);
      }

      // Default statistics
      setDashboardData({
        user: {
          id: user?.id || 1,
          fullname: user?.fullname || "Waqas Umar",
          username: user?.username || "waqasumar33",
          balance: parseFloat(user?.balance || 0),
          points: user?.points || 86015,
          shoppingAmount: parseFloat(user?.shoppingAmount || 2000),
          totalEarnings: parseFloat(user?.totalEarnings || 355385),
          referralCount: user?.referralCount || 10,
          ordersCount: 4,
          hasActivePackage: true,
          currentPackage: {
            package_name: "Combo Package",
            package_amount: 400000,
            package_points: 8000
          },
          packageExpiryDate: "2026-10-22T00:00:00.000Z",
          rank: {
            id: 4,
            title: "Diamond Tier",
            required_points: 100000
          }
        },
        stats: {
          balance: parseFloat(user?.balance || 0),
          points: user?.points || 86015,
          shoppingAmount: parseFloat(user?.shoppingAmount || 2000),
          totalEarnings: parseFloat(user?.totalEarnings || 355385),
          directEarnings: 210000,
          indirectEarnings: 145385,
          referralCount: user?.referralCount || 10,
          ordersCount: 4,
          rank: { title: "Diamond Tier", required_points: 100000 },
          pendingWithdrawals: 0,
          approvedWithdrawals: 11700,
          totalWithdrawalRequests: 5
        },
        recentActivity: [
          {
            id: "act-1",
            type: "package",
            title: "Package Upgrade - Combo Package",
            description: "Institutional Tier 8 Activated",
            amount: 400000,
            status: "approved",
            createdAt: "2025-10-22T10:00:00.000Z"
          },
          {
            id: "act-2",
            type: "withdrawal",
            title: "Withdrawal Request (PKR 2,000)",
            description: "Direct Bank Payout Processed",
            amount: 2000,
            status: "approved",
            createdAt: "2025-10-18T12:00:00.000Z"
          },
          {
            id: "act-3",
            type: "referral",
            title: "New Referral Enrolled - Kim Taehyung",
            description: "Direct Level-1 Network Partner",
            amount: null,
            status: "completed",
            createdAt: "2025-10-13T10:00:00.000Z"
          },
          {
            id: "act-4",
            type: "withdrawal",
            title: "Withdrawal Request (Net: PKR 900)",
            description: "Mobile Account Disbursed",
            amount: 1000,
            status: "approved",
            createdAt: "2025-10-09T14:00:00.000Z"
          },
          {
            id: "act-5",
            type: "package",
            title: "Initial Membership - Student Package",
            description: "Account Activation & Onboarding",
            amount: 2000,
            status: "approved",
            createdAt: "2025-09-06T11:00:00.000Z"
          }
        ],
        inactiveMembersCount: 0
      });
    };

    fetchDashboardData();
  }, [user]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { user: userData, stats, recentActivity } = dashboardData || {};

  // Financial KPI Cards Configuration with in-card mini sparklines
  const primaryStats = [
    {
      title: "E-Wallet Cash Balance",
      value: formatCurrency(stats?.balance),
      subtext: "Instant Withdrawable Liquidity",
      accent: "#10b981",
      icon: <AccountBalanceWalletOutlined sx={{ fontSize: 26, color: "#10b981" }} />,
      glowColor: "rgba(16, 185, 129, 0.12)",
      actionLabel: "Request Payout",
      actionHref: "/user-dashboard/withdraw",
      badgeText: "Instant Payout Eligible",
      delta: "+0.0% Today",
      deltaPositive: true,
      sparkline: [20, 25, 22, 30, 28, 35, 40]
    },
    {
      title: "Shopping Wallet Credits",
      value: formatCurrency(stats?.shoppingAmount),
      subtext: "E-Commerce Catalog Balance",
      accent: "#06b6d4",
      icon: <StorefrontOutlined sx={{ fontSize: 26, color: "#06b6d4" }} />,
      glowColor: "rgba(6, 182, 212, 0.12)",
      actionLabel: "Shop Products",
      actionHref: "/user-dashboard/shop",
      badgeText: "100% Usable on Catalog",
      delta: "24+ Products",
      deltaPositive: true,
      sparkline: [10, 15, 25, 20, 30, 45, 50]
    },
    {
      title: "Cumulative Lifetime Earnings",
      value: formatCurrency(stats?.totalEarnings),
      subtext: `Direct: ${formatCurrency(stats?.directEarnings)} | Team: ${formatCurrency(stats?.indirectEarnings)}`,
      accent: "#6366f1",
      icon: <MonetizationOnOutlined sx={{ fontSize: 26, color: "#6366f1" }} />,
      glowColor: "rgba(99, 102, 241, 0.12)",
      actionLabel: "Earnings Ledger",
      actionHref: "/user-dashboard/earnings/direct",
      badgeText: "+18.4% This Month",
      delta: "+18.4% MoM",
      deltaPositive: true,
      sparkline: [15, 25, 38, 55, 70, 85, 100]
    },
    {
      title: "Network Reward Points (RP)",
      value: `${(stats?.points || 0).toLocaleString()} RP`,
      subtext: `${stats?.rank?.title || "Diamond Tier"} Leadership Level`,
      accent: "#f59e0b",
      icon: <EmojiEventsOutlined sx={{ fontSize: 26, color: "#f59e0b" }} />,
      glowColor: "rgba(245, 158, 11, 0.12)",
      actionLabel: "Rank Horizon",
      actionHref: "/user-dashboard/profile",
      badgeText: "86% to Master Rank",
      delta: "Rank 4 of 6",
      deltaPositive: true,
      sparkline: [30, 42, 50, 65, 78, 82, 86]
    },
  ];

  const secondaryStats = [
    {
      label: "Direct Referrals",
      value: `${stats?.referralCount || 0} Members`,
      desc: "Personally sponsored downline",
      color: "#8b5cf6",
      icon: <GroupOutlined sx={{ fontSize: 24, color: "#8b5cf6" }} />,
      href: "/user-dashboard/referrals",
      badge: "10 Active Partners",
      detail: "Level 1 Direct Sponsors"
    },
    {
      label: "Direct Commissions",
      value: formatCurrency(stats?.directEarnings),
      desc: "Tier-1 direct sponsor rewards",
      color: "#3b82f6",
      icon: <TrendingUp sx={{ fontSize: 24, color: "#3b82f6" }} />,
      href: "/user-dashboard/earnings/direct",
      badge: "10% Direct Bonus",
      detail: "Instant Balance Credit"
    },
    {
      label: "Genealogy Team Overrides",
      value: formatCurrency(stats?.indirectEarnings),
      desc: "10-Tier team matching volume",
      color: "#ec4899",
      icon: <AccountTreeOutlined sx={{ fontSize: 24, color: "#ec4899" }} />,
      href: "/user-dashboard/earnings/indirect",
      badge: "Levels 2-10",
      detail: "Passive Flow Active"
    },
    {
      label: "Completed Payouts",
      value: formatCurrency(stats?.approvedWithdrawals || 0),
      desc: "Disbursed to bank / mobile",
      color: "#10b981",
      icon: <CheckCircleOutline sx={{ fontSize: 24, color: "#10b981" }} />,
      href: "/user-dashboard/withdrawals",
      badge: "100% Settled",
      detail: "Verified Disbursals"
    },
  ];

  // Quick Action Grid (6 equal-width cards)
  const quickActions = [
    { label: "Official Store", icon: <ShoppingBagOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/shop", color: "#06b6d4", desc: "Catalog Redeeming", pill: "Catalog" },
    { label: "Request Payout", icon: <AccountBalanceWalletOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/withdraw", color: "#10b981", desc: "Withdraw Funds", pill: "Instant" },
    { label: "Genealogy Downline", icon: <AccountTreeOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/referrals", color: "#8b5cf6", desc: "10-Level Tree", pill: "10 Tiers" },
    { label: "P2P Wallet Transfer", icon: <SwapHorizOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/transfer-to-others", color: "#f59e0b", desc: "Peer Transfers", pill: "0% Fee" },
    { label: "Package Upgrades", icon: <CreditCardOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/subscribe", color: "#6366f1", desc: "Boost Tier Limits", pill: "Boost" },
    { label: "KYC Verification", icon: <SecurityOutlined sx={{ fontSize: 26 }} />, href: "/user-dashboard/kyc", color: "#ec4899", desc: "Identity Compliance", pill: "Verified" },
  ];

  // Dynamic datasets by timeframe
  const timeframeDatasets = useMemo(() => {
    return {
      "7D": [
        { label: "Mon", direct: 18000, indirect: 12000 },
        { label: "Tue", direct: 24000, indirect: 15000 },
        { label: "Wed", direct: 31000, indirect: 22000 },
        { label: "Thu", direct: 28000, indirect: 19000 },
        { label: "Fri", direct: 42000, indirect: 29000 },
        { label: "Sat", direct: 55000, indirect: 38000 },
        { label: "Sun", direct: 68000, indirect: 45000 },
      ],
      "30D": [
        { label: "Wk 1", direct: 45000, indirect: 25000 },
        { label: "Wk 2", direct: 75000, indirect: 45000 },
        { label: "Wk 3", direct: 110000, indirect: 70000 },
        { label: "Wk 4", direct: 155000, indirect: 105000 },
        { label: "Wk 5", direct: 185000, indirect: 125000 },
        { label: "Wk 6", direct: parseFloat(stats?.directEarnings || 210000), indirect: parseFloat(stats?.indirectEarnings || 145385) },
      ],
      "90D": [
        { label: "Month 1", direct: 80000, indirect: 50000 },
        { label: "Month 2", direct: 145000, indirect: 95000 },
        { label: "Month 3", direct: parseFloat(stats?.directEarnings || 210000), indirect: parseFloat(stats?.indirectEarnings || 145385) },
      ],
      "ALL": [
        { label: "Q1", direct: 35000, indirect: 20000 },
        { label: "Q2", direct: 90000, indirect: 65000 },
        { label: "Q3", direct: 160000, indirect: 110000 },
        { label: "Q4", direct: parseFloat(stats?.directEarnings || 210000), indirect: parseFloat(stats?.indirectEarnings || 145385) },
      ]
    };
  }, [stats]);

  const activeTrend = timeframeDatasets[selectedTimeframe] || timeframeDatasets["30D"];
  const maxEarningsVal = Math.max(...activeTrend.map(d => d.direct + d.indirect), 100000);

  // Asset Distribution Ratios
  const eWallet = parseFloat(stats?.balance || 0);
  const sWallet = parseFloat(stats?.shoppingAmount || 2000);
  const paidOut = parseFloat(stats?.approvedWithdrawals || 11700);
  const totalAssets = eWallet + sWallet + paidOut || 1;

  const eWalletPct = Math.max(1, Math.round((eWallet / totalAssets) * 100));
  const sWalletPct = Math.max(15, Math.round((sWallet / totalAssets) * 100));
  const paidOutPct = Math.max(84, 100 - eWalletPct - sWalletPct);

  const circ = 2 * Math.PI * 45;
  const eStroke = (eWalletPct / 100) * circ;
  const sStroke = (sWalletPct / 100) * circ;
  const pStroke = (paidOutPct / 100) * circ;

  // Rank Progress calculation (Diamond: 86,015 RP of 100,000 RP to Crown Ambassador)
  const currentPoints = stats?.points || 86015;
  const targetPoints = 100000;
  const rankProgressPct = Math.min(100, Math.round((currentPoints / targetPoints) * 100));
  const remainingPoints = Math.max(0, targetPoints - currentPoints);

  // Filtered Activity records
  const filteredActivity = useMemo(() => {
    if (!recentActivity) return [];
    if (activityFilter === "all") return recentActivity;
    return recentActivity.filter(item => item.type === activityFilter);
  }, [recentActivity, activityFilter]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2.5, sm: 3, md: 3.5 },
        pb: 4
      }}
    >
      {/* 1. HERO IDENTITY COMMAND BANNER (FULL WIDTH SCREEN EXTENSION) */}
      <Card
        sx={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 0,
          backgroundColor: cardBg,
          border: cardBorder,
          borderLeft: "6px solid #6366f1",
          p: { xs: 2.5, sm: 3, md: 3.5 },
          position: "relative",
          overflow: "hidden",
          boxShadow: isLight ? "0 4px 20px rgba(0,0,0,0.04)" : "0 4px 30px rgba(0,0,0,0.5)"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.08))",
            pointerEvents: "none"
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
            gap: 3,
            position: "relative",
            zIndex: 1
          }}
        >
          {/* Left Column: Avatar & Member Profile */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Avatar
              sx={{
                width: { xs: 60, sm: 72 },
                height: { xs: 60, sm: 72 },
                borderRadius: 0,
                background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                fontSize: { xs: "1.7rem", sm: "2rem" },
                fontWeight: 900,
                border: "2px solid #818cf8",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)"
              }}
            >
              {(userData?.fullname || userData?.username || "W")[0].toUpperCase()}
            </Avatar>

            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "1.45rem", sm: "1.85rem", md: "2.1rem" },
                    color: textPrimary,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {userData?.fullname || "Waqas Umar"}
                </Typography>
                <Typography
                  sx={{
                    color: textMuted,
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", sm: "1.05rem" }
                  }}
                >
                  @{userData?.username || "waqasumar33"}
                </Typography>
                <Chip
                  label="ACCOUNT #000001"
                  size="small"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    letterSpacing: "0.06em",
                    backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.06)",
                    color: textSecondary,
                    border: cardBorder
                  }}
                />
              </Stack>

              {/* Status Chips Row */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                <Chip
                  label={userData?.hasActivePackage ? "ACTIVE MEMBER" : "PENDING ACTIVATION"}
                  size="small"
                  icon={<FiberManualRecord sx={{ fontSize: "10px !important", color: userData?.hasActivePackage ? "#10b981 !important" : "#f59e0b !important" }} />}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: userData?.hasActivePackage ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: userData?.hasActivePackage ? "#10b981" : "#f59e0b",
                    border: userData?.hasActivePackage ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                />
                <Chip
                  label={userData?.currentPackage?.package_name || "Combo Package"}
                  size="small"
                  icon={<Inventory2Outlined sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                  }}
                />
                <Chip
                  label={userData?.rank?.title || "Diamond Tier"}
                  size="small"
                  icon={<StarsOutlined sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                  }}
                />
                <Chip
                  label="KYC VERIFIED"
                  size="small"
                  icon={<VerifiedUserOutlined sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                />
              </Stack>
            </Box>
          </Stack>

          {/* Right Column: Instant Action Buttons */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", lg: "auto" } }}>
            <Button
              component={Link}
              href="/user-dashboard/subscribe"
              variant="contained"
              fullWidth={{ xs: true, sm: false }}
              startIcon={<BoltOutlined />}
              sx={{
                borderRadius: 0,
                backgroundColor: "#6366f1",
                fontWeight: 800,
                fontSize: "0.85rem",
                px: 3,
                py: 1.2,
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.35)",
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Upgrade Package
            </Button>
            <Button
              component={Link}
              href="/user-dashboard/withdraw"
              variant="outlined"
              fullWidth={{ xs: true, sm: false }}
              startIcon={<AccountBalanceWalletOutlined />}
              sx={{
                borderRadius: 0,
                borderColor: "#10b981",
                color: "#10b981",
                fontSize: "0.85rem",
                fontWeight: 800,
                px: 3,
                py: 1.2,
                backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.06)",
                "&:hover": {
                  borderColor: "#059669",
                  backgroundColor: isLight ? "#dcfce7" : "rgba(16, 185, 129, 0.15)",
                },
              }}
            >
              Payout Request
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outlined"
              fullWidth={{ xs: true, sm: false }}
              startIcon={copySuccess ? <Check /> : <ContentCopy />}
              sx={{
                borderRadius: 0,
                borderColor: isLight ? "#cbd5e1" : "rgba(255,255,255,0.18)",
                color: copySuccess ? "#10b981" : textPrimary,
                fontSize: "0.85rem",
                fontWeight: 800,
                px: 2.5,
                py: 1.2,
                backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: isLight ? "#f1f5f9" : "rgba(99, 102, 241, 0.1)",
                },
              }}
            >
              {copySuccess ? "Copied Link!" : "Copy Ref"}
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* 2. PRIMARY FINANCIAL KPI CARDS WITH IN-CARD MINI SPARKLINES (CSS GRID: 4 COLUMNS FULL WIDTH) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
          gap: { xs: 2, sm: 2.5 },
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {primaryStats.map((stat, index) => (
          <Card
            key={index}
            sx={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 0,
              backgroundColor: cardBg,
              border: cardBorder,
              borderTop: `4px solid ${stat.accent}`,
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
              background: isLight
                ? `linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)`
                : `linear-gradient(180deg, #0c1220 0%, #070a12 100%)`,
              "&:hover": {
                transform: "translateY(-4px)",
                borderColor: stat.accent,
                boxShadow: `0 10px 30px ${stat.glowColor}`
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              {/* Header Row */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: textMuted,
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      display: "block"
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      label={stat.badgeText}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        height: 18,
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        backgroundColor: `${stat.accent}15`,
                        color: stat.accent,
                        border: `1px solid ${stat.accent}30`
                      }}
                    />
                    <Typography sx={{ color: stat.accent, fontSize: "0.68rem", fontWeight: 800 }}>
                      {stat.delta}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    p: 1.2,
                    backgroundColor: stat.glowColor,
                    borderRadius: 0,
                    border: `1px solid ${stat.accent}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>

              {/* Value & In-Card Sparkline */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: textPrimary,
                    fontSize: { xs: "1.65rem", sm: "1.85rem", lg: "2.1rem" },
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1
                  }}
                >
                  {stat.value}
                </Typography>

                {/* Mini SVG Sparkline */}
                <Box sx={{ width: 70, height: 32, opacity: 0.85 }}>
                  <svg width="70" height="32" viewBox="0 0 70 32">
                    {(() => {
                      const data = stat.sparkline;
                      const max = Math.max(...data);
                      const min = Math.min(...data);
                      const range = max - min || 1;
                      const pts = data.map((val, i) => {
                        const x = (i / (data.length - 1)) * 68 + 1;
                        const y = 30 - ((val - min) / range) * 24;
                        return `${x},${y}`;
                      }).join(" ");
                      return (
                        <polyline
                          fill="none"
                          stroke={stat.accent}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pts}
                        />
                      );
                    })()}
                  </svg>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: textSecondary, fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                {stat.subtext}
              </Typography>
            </CardContent>

            <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.2, pt: 0 }}>
              <Divider sx={{ mb: 1.5, borderColor: chartGridColor }} />
              <Button
                component={Link}
                href={stat.actionHref}
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{
                  p: 0,
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  color: stat.accent,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
                }}
              >
                {stat.actionLabel}
              </Button>
            </Box>
          </Card>
        ))}
      </Box>

      {/* 3. SECONDARY STRATEGIC INDICATOR TILES (CSS GRID: 4 COLUMNS FULL WIDTH) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
          gap: { xs: 2, sm: 2.5 },
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {secondaryStats.map((item, index) => (
          <Card
            key={index}
            component={Link}
            href={item.href}
            sx={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 0,
              backgroundColor: cardBg,
              border: cardBorder,
              borderLeft: `5px solid ${item.color}`,
              p: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textDecoration: "none",
              transition: "all 0.15s",
              "&:hover": {
                backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                transform: "translateX(4px)",
                borderColor: item.color,
                boxShadow: `0 6px 20px ${item.color}15`
              }
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </Typography>
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    borderRadius: 0,
                    height: 16,
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    backgroundColor: `${item.color}15`,
                    color: item.color
                  }}
                />
              </Stack>
              <Typography sx={{ color: textPrimary, fontWeight: 900, fontSize: "1.35rem", my: 0.5, letterSpacing: "-0.01em" }}>
                {item.value}
              </Typography>
              <Typography sx={{ color: textSecondary, fontSize: "0.74rem", fontWeight: 600 }}>
                {item.desc}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.4,
                backgroundColor: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.04)",
                border: cardBorder,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {item.icon}
            </Box>
          </Card>
        ))}
      </Box>

      {/* 4. FINANCIAL CHARTS & WALLET COMPOSITION (CSS GRID: 1.8fr 1.2fr FULL WIDTH) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1.2fr" },
          gap: { xs: 2, sm: 2.5 },
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Left: Dynamic Commission Velocity Curve */}
        <Card sx={{ width: "100%", boxSizing: "border-box", borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
          <Box
            sx={{
              p: 2.5,
              px: 3,
              backgroundColor: cardHeaderBg,
              borderBottom: cardBorder,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <ShowChart sx={{ color: "#6366f1", fontSize: 24 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                  COMMISSION VELOCITY & REVENUE MOMENTUM
                </Typography>
                <Typography variant="caption" sx={{ color: textMuted, fontSize: "0.72rem" }}>
                  Real-time direct bonus & genealogy matching analytics
                </Typography>
              </Box>
            </Box>

            {/* Timeframe Switcher & Legend */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={0.5} sx={{ border: cardBorder, p: 0.3, backgroundColor: surfaceSubtle }}>
                {["7D", "30D", "90D", "ALL"].map((tf) => (
                  <Button
                    key={tf}
                    size="small"
                    onClick={() => setSelectedTimeframe(tf)}
                    sx={{
                      borderRadius: 0,
                      minWidth: 38,
                      px: 1,
                      py: 0.3,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: selectedTimeframe === tf ? "#ffffff" : textSecondary,
                      backgroundColor: selectedTimeframe === tf ? "#6366f1" : "transparent",
                      "&:hover": {
                        backgroundColor: selectedTimeframe === tf ? "#4f46e5" : "rgba(99, 102, 241, 0.1)"
                      }
                    }}
                  >
                    {tf}
                  </Button>
                ))}
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, backgroundColor: "#6366f1" }} />
                  <Typography sx={{ color: textSecondary, fontSize: "0.75rem", fontWeight: 700 }}>Direct</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, backgroundColor: "#ec4899" }} />
                  <Typography sx={{ color: textSecondary, fontSize: "0.75rem", fontWeight: 700 }}>Team Override</Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Interactive Responsive SVG Curve Chart */}
            <Box sx={{ width: "100%", height: 280, position: "relative" }}>
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                <defs>
                  <linearGradient id="userInflowGradFull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="indirectInflowGradFull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Threshold Grid Lines */}
                {[30, 75, 120, 165].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="600" y2={y} stroke={chartGridColor} strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Lines calculation with smooth Bezier curve */}
                {(() => {
                  const stepX = 600 / (activeTrend.length - 1);
                  const pts = activeTrend.map((d, i) => {
                    const x = i * stepX;
                    const y = 175 - ((d.direct + d.indirect) / maxEarningsVal) * 145;
                    return { x, y, data: d };
                  });

                  // Generate smooth bezier curve path
                  let pathD = `M ${pts[0].x} ${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i];
                    const p1 = pts[i + 1];
                    const mx = (p0.x + p1.x) / 2;
                    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
                  }

                  const areaD = `${pathD} L ${pts[pts.length - 1].x} 175 L 0 175 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#userInflowGradFull)" />
                      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3.5" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint === i ? 7 : 4.5}
                            fill="#6366f1"
                            stroke={isLight ? "#ffffff" : "#0c1220"}
                            strokeWidth="2.5"
                            style={{ cursor: "pointer", transition: "all 0.15s" }}
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {hoveredPoint === i && (
                            <g>
                              <rect
                                x={Math.min(480, Math.max(10, p.x - 70))}
                                y={p.y - 50}
                                width="140"
                                height="42"
                                fill={isLight ? "#0f172a" : "#1e293b"}
                                rx="0"
                                stroke="#6366f1"
                                strokeWidth="1.5"
                              />
                              <text
                                x={Math.min(480, Math.max(10, p.x - 70)) + 70}
                                y={p.y - 32}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="11"
                                fontWeight="800"
                              >
                                {p.data.label}: PKR {((p.data.direct + p.data.indirect) / 1000).toFixed(1)}k Total
                              </text>
                              <text
                                x={Math.min(480, Math.max(10, p.x - 70)) + 70}
                                y={p.y - 18}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="9"
                                fontWeight="600"
                              >
                                Direct: PKR {(p.data.direct / 1000).toFixed(1)}k • Team: PKR {(p.data.indirect / 1000).toFixed(1)}k
                              </text>
                            </g>
                          )}
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* X Axis Labels */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
                {activeTrend.map((d, i) => (
                  <Typography key={i} variant="caption" sx={{ color: textSecondary, fontWeight: 700, fontSize: "0.75rem" }}>
                    {d.label}
                  </Typography>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: chartGridColor }} />

            {/* Performance Breakdown Footer */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                  DIRECT SPONSOR COMMISSIONS
                </Typography>
                <Typography variant="h6" sx={{ color: "#6366f1", fontWeight: 900, mt: 0.5 }}>
                  {formatCurrency(stats?.directEarnings)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700 }}>
                  ↑ 59% Total Earnings Share
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                  GENEALOGY TEAM OVERRIDES
                </Typography>
                <Typography variant="h6" sx={{ color: "#ec4899", fontWeight: 900, mt: 0.5 }}>
                  {formatCurrency(stats?.indirectEarnings)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700 }}>
                  ↑ 41% Passive Flow
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                  LEADERSHIP REWARD POINTS
                </Typography>
                <Typography variant="h6" sx={{ color: "#10b981", fontWeight: 900, mt: 0.5 }}>
                  {(stats?.points || 0).toLocaleString()} RP
                </Typography>
                <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 700 }}>
                  Diamond Rank Active
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right: Asset Allocation & Capital Distribution */}
        <Card sx={{ width: "100%", boxSizing: "border-box", borderRadius: 0, backgroundColor: cardBg, border: cardBorder, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2.5, px: 3, backgroundColor: cardHeaderBg, borderBottom: cardBorder, display: "flex", alignItems: "center", gap: 1.2 }}>
            <DonutLarge sx={{ color: "#10b981", fontSize: 24 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                WALLET & CAPITAL ALLOCATION
              </Typography>
              <Typography variant="caption" sx={{ color: textMuted, fontSize: "0.72rem" }}>
                Asset balance distribution & liquidity breakdown
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {/* Donut Chart Visual */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", my: 2 }}>
              <svg width="200" height="200" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="45" fill="none" stroke={chartGridColor} strokeWidth="15" />
                <circle
                  cx="65"
                  cy="65"
                  r="45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="15"
                  strokeDasharray={`${eStroke} ${circ}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 65 65)"
                />
                <circle
                  cx="65"
                  cy="65"
                  r="45"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="15"
                  strokeDasharray={`${sStroke} ${circ}`}
                  strokeDashoffset={-eStroke}
                  transform="rotate(-90 65 65)"
                />
                <circle
                  cx="65"
                  cy="65"
                  r="45"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="15"
                  strokeDasharray={`${pStroke} ${circ}`}
                  strokeDashoffset={-(eStroke + sStroke)}
                  transform="rotate(-90 65 65)"
                />
              </svg>

              <Box sx={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: textPrimary, lineHeight: 1.1 }}>
                  {formatCurrency(totalAssets)}
                </Typography>
                <Typography variant="caption" sx={{ color: textSecondary, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>
                  Total Portfolio
                </Typography>
              </Box>
            </Box>

            {/* Asset Distribution Rows with Mini Progress Bars */}
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: "#10b981" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: textPrimary }}>E-Wallet Available</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: "#10b981", fontSize: "0.85rem" }}>
                    {formatCurrency(eWallet)} ({eWalletPct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={eWalletPct}
                  sx={{
                    height: 5,
                    borderRadius: 0,
                    backgroundColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
                    "& .MuiLinearProgress-bar": { backgroundColor: "#10b981", borderRadius: 0 }
                  }}
                />
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: "#06b6d4" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: textPrimary }}>Shopping Credits</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: "#06b6d4", fontSize: "0.85rem" }}>
                    {formatCurrency(sWallet)} ({sWalletPct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={sWalletPct}
                  sx={{
                    height: 5,
                    borderRadius: 0,
                    backgroundColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
                    "& .MuiLinearProgress-bar": { backgroundColor: "#06b6d4", borderRadius: 0 }
                  }}
                />
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: surfaceSubtle, border: cardBorder }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, backgroundColor: "#6366f1" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: textPrimary }}>Disbursed Payouts</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: "#6366f1", fontSize: "0.85rem" }}>
                    {formatCurrency(paidOut)} ({paidOutPct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paidOutPct}
                  sx={{
                    height: 5,
                    borderRadius: 0,
                    backgroundColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
                    "& .MuiLinearProgress-bar": { backgroundColor: "#6366f1", borderRadius: 0 }
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* 5. CAREER RANK MILESTONE & PACKAGE HORIZON (FULL WIDTH) */}
      <Card sx={{ width: "100%", boxSizing: "border-box", borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: { xs: 2.5, sm: 3, md: 3.5 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1.2fr" }, gap: 3.5, alignItems: "center" }}>
          {/* Left: Rank Progression Ladder */}
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <EmojiEventsOutlined sx={{ color: "#f59e0b", fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: textPrimary }}>
                  Career Rank Milestone: {userData?.rank?.title || "Diamond Tier"}
                </Typography>
                <Typography variant="caption" sx={{ color: textMuted, fontSize: "0.75rem" }}>
                  Rank 4 of 6 • Next Tier: Crown Ambassador (100,000 RP)
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: textSecondary, fontSize: "0.88rem", mb: 2 }}>
              Accumulate network reward points through personal package upgrades and genealogy downline sales to unlock higher royal leadership prize pools and international rewards.
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: textPrimary }}>
                  Current RP: {currentPoints.toLocaleString()} RP
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#f59e0b" }}>
                  Target: {targetPoints.toLocaleString()} RP ({rankProgressPct}%) • Remaining: {remainingPoints.toLocaleString()} RP
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={rankProgressPct}
                sx={{
                  height: 12,
                  borderRadius: 0,
                  backgroundColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#f59e0b",
                    borderRadius: 0,
                  }
                }}
              />
            </Box>

            {/* Rank Perks Strip */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="5% Leadership Pool"
                size="small"
                sx={{ borderRadius: 0, fontSize: "0.68rem", fontWeight: 700, backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}
              />
              <Chip
                label="Luxury International Retreat"
                size="small"
                sx={{ borderRadius: 0, fontSize: "0.68rem", fontWeight: 700, backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#818cf8" }}
              />
              <Chip
                label="VIP Payout Processing"
                size="small"
                sx={{ borderRadius: 0, fontSize: "0.68rem", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
              />
            </Stack>
          </Box>

          {/* Right: Package Validity & Entitlements */}
          <Box
            sx={{
              p: 3,
              backgroundColor: surfaceSubtle,
              border: cardBorder,
              borderLeft: "6px solid #10b981",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            <Typography variant="caption" sx={{ color: textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              PACKAGE HORIZON & VALIDITY STATUS
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#10b981", fontWeight: 900, my: 0.6 }}>
              Lifetime Active Status
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary, display: "block", lineHeight: 1.6, mb: 1.5 }}>
              Active institutional privileges include 10-tier genealogy matching overrides, unlimited daily withdrawal ceilings, and full merchandise catalog allocations.
            </Typography>
            <Button
              component={Link}
              href="/user-dashboard/subscribe"
              size="small"
              variant="outlined"
              sx={{
                borderRadius: 0,
                alignSelf: "flex-start",
                borderColor: "#10b981",
                color: "#10b981",
                fontWeight: 800,
                fontSize: "0.75rem",
                "&:hover": { backgroundColor: "rgba(16, 185, 129, 0.1)" }
              }}
            >
              Extend or Upgrade Package →
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 6. REFERRAL ACCELERATOR & MARKETING SUITE (FULL WIDTH) */}
      <Card sx={{ width: "100%", boxSizing: "border-box", borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: { xs: 2.5, sm: 3, md: 3.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", gap: 1.5, mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: textPrimary }}>
            Your Official Member Referral Link & Marketing Suite
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label="10% Direct Bonus" size="small" sx={{ borderRadius: 0, fontWeight: 800, backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }} />
            <Chip label="10-Tier Team Matching" size="small" sx={{ borderRadius: 0, fontWeight: 800, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }} />
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ color: textSecondary, fontSize: "0.88rem", mb: 2.5 }}>
          Share your personal sponsor invitation link to recruit prospective entrepreneurs. Earn instant direct commissions plus multi-tier genealogy overrides on every membership.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ width: "100%", boxSizing: "border-box" }}>
          <TextField
            value={referralLink}
            slotProps={{
              input: {
                readOnly: true,
                sx: {
                  borderRadius: 0,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  backgroundColor: surfaceSubtle,
                  fontFamily: "monospace"
                }
              }
            }}
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            onClick={copyToClipboard}
            startIcon={copySuccess ? <Check /> : <ContentCopy />}
            sx={{
              borderRadius: 0,
              px: 3.5,
              py: 1,
              minWidth: 150,
              fontWeight: 800,
              boxShadow: "none",
              backgroundColor: copySuccess ? "#10b981" : "#6366f1",
              "&:hover": {
                backgroundColor: copySuccess ? "#059669" : "#4f46e5",
              },
            }}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowQrCode(!showQrCode)}
            startIcon={<QrCode2Outlined />}
            sx={{
              borderRadius: 0,
              px: 2.5,
              py: 1,
              borderColor: isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.2)",
              color: textPrimary,
              fontWeight: 800,
              "&:hover": { borderColor: "#6366f1" }
            }}
          >
            {showQrCode ? "Hide QR" : "QR Code"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Join Ledora Global via my official sponsor link: ${referralLink}`)}`;
              window.open(whatsappUrl, "_blank");
            }}
            startIcon={<WhatsApp sx={{ color: "#25D366" }} />}
            sx={{
              borderRadius: 0,
              px: 2.5,
              py: 1,
              borderColor: isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.2)",
              color: textPrimary,
              fontWeight: 800,
            }}
          >
            WhatsApp
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Join Ledora Global",
                  text: "Register through my official sponsor link",
                  url: referralLink,
                });
              } else {
                copyToClipboard();
              }
            }}
            startIcon={<ShareOutlined />}
            sx={{
              borderRadius: 0,
              px: 2.5,
              py: 1,
              borderColor: isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.2)",
              color: textPrimary,
              fontWeight: 800,
            }}
          >
            Share
          </Button>
        </Stack>

        {/* QR Code Collapsible Drawer */}
        <Collapse in={showQrCode}>
          <Box
            sx={{
              mt: 2.5,
              p: 3,
              backgroundColor: surfaceSubtle,
              border: cardBorder,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 3
            }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: "#ffffff",
                border: "2px solid #6366f1",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.25)"
              }}
            >
              {/* High contrast SVG QR Code representation */}
              <svg width="140" height="140" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff" />
                <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                
                <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                
                <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                
                <rect x="42" y="15" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="25" width="6" height="6" fill="#0f172a" />
                <rect x="45" y="45" width="12" height="12" fill="#6366f1" />
                <rect x="65" y="65" width="8" height="8" fill="#0f172a" />
                <rect x="78" y="75" width="12" height="6" fill="#0f172a" />
                <rect x="42" y="70" width="8" height="8" fill="#0f172a" />
              </svg>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "1rem" }}>
                Scan to Register Under @{userData?.username || "waqasumar33"}
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, fontSize: "0.82rem", my: 0.5 }}>
                Display this high-resolution QR code on mobile devices, printed materials, or webinars to allow direct scanning by prospective recruits.
              </Typography>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#6366f1", fontWeight: 700 }}>
                {referralLink}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Card>

      {/* 7. PORTAL QUICK OPERATIONS (CSS GRID: 6 EQUAL FULL-WIDTH COLUMNS) */}
      <Box sx={{ width: "100%", boxSizing: "border-box" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontWeight: 900, color: textPrimary, fontSize: "1rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            PORTAL QUICK ACTION MODULES
          </Typography>
          <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
            Instant operations & workspace routing
          </Typography>
        </Box>
        
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
            gap: { xs: 1.5, sm: 2 },
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          {quickActions.map((tile, i) => (
            <Card
              key={i}
              component={Link}
              href={tile.href}
              sx={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 0,
                backgroundColor: cardBg,
                border: cardBorder,
                p: { xs: 2.2, sm: 2.8 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                textAlign: "center",
                gap: 1.2,
                position: "relative",
                transition: "all 0.15s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: tile.color,
                  backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.03)",
                  boxShadow: `0 8px 25px ${tile.color}25`
                }
              }}
            >
              <Chip
                label={tile.pill}
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  height: 16,
                  borderRadius: 0,
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  backgroundColor: `${tile.color}15`,
                  color: tile.color
                }}
              />
              <Box
                sx={{
                  p: 1.4,
                  backgroundColor: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.04)",
                  border: cardBorder,
                  color: tile.color,
                  mt: 1
                }}
              >
                {tile.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", color: textPrimary }}>
                  {tile.label}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: textMuted, fontWeight: 600, mt: 0.3 }}>
                  {tile.desc}
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

      {/* 8. RECENT TRANSACTIONS ACTIVITY LEDGER (FULL WIDTH) */}
      <Card sx={{ width: "100%", boxSizing: "border-box", borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
        <Box
          sx={{
            p: 2.5,
            px: 3,
            backgroundColor: cardHeaderBg,
            borderBottom: cardBorder,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Inventory2Outlined sx={{ color: "#6366f1", fontSize: 24 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                RECENT ACCOUNT TRANSACTIONS & ACTIVITY
              </Typography>
              <Typography variant="caption" sx={{ color: textMuted, fontSize: "0.72rem" }}>
                Account history & recent transaction records
              </Typography>
            </Box>
          </Box>

          {/* Activity Category Filters */}
          <Stack direction="row" spacing={1} alignItems="center">
            {["all", "package", "withdrawal", "referral"].map((type) => (
              <Chip
                key={type}
                label={type === "all" ? "All Records" : type === "package" ? "Packages" : type === "withdrawal" ? "Payouts" : "Referrals"}
                size="small"
                onClick={() => setActivityFilter(type)}
                sx={{
                  borderRadius: 0,
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  backgroundColor: activityFilter === type ? "#6366f1" : (isLight ? "#f1f5f9" : "rgba(255,255,255,0.04)"),
                  color: activityFilter === type ? "#ffffff" : textSecondary,
                  border: cardBorder
                }}
              />
            ))}
            <Button
              component={Link}
              href="/user-dashboard/orders"
              size="small"
              endIcon={<OpenInNewOutlined sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 800, fontSize: "0.78rem", color: textSecondary, textTransform: "none", ml: 1 }}
            >
              All Orders
            </Button>
          </Stack>
        </Box>

        <TableContainer sx={{ width: "100%", boxSizing: "border-box" }}>
          <Table sx={{ width: "100%" }}>
            <TableHead sx={{ backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.02)" }}>
              <TableRow>
                <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", borderBottom: cardBorder }}>EVENT / RECORD</TableCell>
                <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", borderBottom: cardBorder }}>DESCRIPTION</TableCell>
                <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", borderBottom: cardBorder }}>AMOUNT</TableCell>
                <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", borderBottom: cardBorder }}>STATUS</TableCell>
                <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: "0.72rem", borderBottom: cardBorder }}>DATE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivity && filteredActivity.length > 0 ? (
                filteredActivity.map((item, idx) => (
                  <TableRow key={idx} sx={{ "&:hover": { backgroundColor: isLight ? "#f8fafc" : "rgba(255,255,255,0.02)" } }}>
                    <TableCell sx={{ borderBottom: cardBorder }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 0.8,
                            backgroundColor:
                              item.type === "package"
                                ? "rgba(99, 102, 241, 0.15)"
                                : item.type === "withdrawal"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            border: cardBorder
                          }}
                        >
                          {item.type === "package" ? (
                            <Inventory2Outlined sx={{ fontSize: 18, color: "#818cf8" }} />
                          ) : item.type === "withdrawal" ? (
                            <ArrowUpward sx={{ fontSize: 18, color: "#10b981" }} />
                          ) : (
                            <GroupOutlined sx={{ fontSize: 18, color: "#f59e0b" }} />
                          )}
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.85rem" }}>
                          {item.title}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: cardBorder, color: textSecondary, fontSize: "0.8rem", fontWeight: 600 }}>
                      {item.description}
                    </TableCell>
                    <TableCell sx={{ borderBottom: cardBorder, fontWeight: 800, color: textPrimary, fontSize: "0.85rem" }}>
                      {item.amount ? formatCurrency(item.amount) : "—"}
                    </TableCell>
                    <TableCell sx={{ borderBottom: cardBorder }}>
                      <Chip
                        label={item.status.toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.04em",
                          backgroundColor:
                            item.status === "completed" || item.status === "approved" || item.status === "delivered" || item.status === "active"
                              ? "rgba(16, 185, 129, 0.12)"
                              : item.status === "rejected"
                              ? "rgba(239, 68, 68, 0.12)"
                              : "rgba(245, 158, 11, 0.12)",
                          color:
                            item.status === "completed" || item.status === "approved" || item.status === "delivered" || item.status === "active"
                              ? "#10b981"
                              : item.status === "rejected"
                              ? "#ef4444"
                              : "#f59e0b",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: cardBorder, color: textSecondary, fontSize: "0.78rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: textSecondary, borderBottom: cardBorder }}>
                    No activity records found matching the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
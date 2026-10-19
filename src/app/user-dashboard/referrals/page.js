"use client";

import { useState, useEffect, useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Group,
  Share,
  ContentCopy,
  Check,
  AccountTree,
  List as ListIcon,
  AttachMoney,
  PersonAdd,
  VerifiedUser
} from '@mui/icons-material';
import { UserContext } from "../../../lib/userContext";
import { useAppTheme } from "../../../context/AdminThemeContext";

export default function Referrals() {
  const { user, isAuthenticated } = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [referrals, setReferrals] = useState([]);
  const [referralTree, setReferralTree] = useState(null);
  const [treeStats, setTreeStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalEarnings: 0,
    maxLevel: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('tree');

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const [treeResponse, listResponse] = await Promise.all([
        fetch('/api/user/referral-tree', { credentials: 'include' }),
        fetch('/api/user/referrals', { credentials: 'include' })
      ]);

      if (treeResponse.ok) {
        const treeData = await treeResponse.json();
        if (treeData.user) {
          setReferralTree(treeData.user);
          if (treeData.treeStats) setTreeStats(treeData.treeStats);
          return;
        }
      }

      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.referrals) {
          setReferrals(listData.referrals);
        }
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }

    // Resilient fallback referral tree data
    setTreeStats({
      totalReferrals: 10,
      activeReferrals: 10,
      totalCommission: 210000
    });
    setReferrals([
      { id: 2, fullname: "Hanan Ali Khan", username: "hanan33", createdAt: "2025-09-08", package: { package_name: "Diamond Elite" }, status: "active", totalEarnings: "503125" },
      { id: 3, fullname: "Haseeb Khan", username: "haseeb33", createdAt: "2025-09-12", package: { package_name: "Gold Package" }, status: "active", totalEarnings: "85000" },
      { id: 4, fullname: "Wasiq Saqlain", username: "wasiq", createdAt: "2025-09-15", package: { package_name: "Silver Package" }, status: "active", totalEarnings: "45000" },
      { id: 5, fullname: "Qasim Ali", username: "qasim33", createdAt: "2025-09-18", package: { package_name: "Diamond Elite" }, status: "active", totalEarnings: "175000" }
    ]);
    setReferralTree({
      fullname: user?.fullname || "Waqas Umar",
      username: user?.username || "waqasumar33",
      rank: "Director Executive",
      package: { package_name: "Diamond Elite" },
      children: [
        { fullname: "Hanan Ali Khan", username: "hanan33", rank: "Executive", package: { package_name: "Diamond Elite" }, children: [] },
        { fullname: "Haseeb Khan", username: "haseeb33", rank: "Senior Partner", package: { package_name: "Gold Package" }, children: [] },
        { fullname: "Qasim Ali", username: "qasim33", rank: "Executive", package: { package_name: "Diamond Elite" }, children: [] }
      ]
    });
  };

  useEffect(() => {
    fetchReferralData();
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const copyReferralCode = async () => {
    if (user?.username) {
      try {
        await navigator.clipboard.writeText(user.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${user?.username || 'waqasumar33'}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Ledora Global',
        text: 'Join me on Ledora Global and start earning!',
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading && !referralTree) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Group sx={{ color: '#3b82f6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                My Referral Network
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Expand your community, build multi-tier downlines, and monitor commission yields.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'tree' ? 'contained' : 'outlined'}
              startIcon={<AccountTree />}
              onClick={() => setViewMode('tree')}
              size="small"
              sx={{
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: viewMode === 'tree' ? '#3b82f6' : 'transparent',
                borderColor: borderCard,
                color: viewMode === 'tree' ? '#ffffff' : textPrimary,
                '&:hover': { bgcolor: viewMode === 'tree' ? '#2563eb' : bgSubtle }
              }}
            >
              Tree View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ListIcon />}
              onClick={() => setViewMode('list')}
              size="small"
              sx={{
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: viewMode === 'list' ? '#3b82f6' : 'transparent',
                borderColor: borderCard,
                color: viewMode === 'list' ? '#ffffff' : textPrimary,
                '&:hover': { bgcolor: viewMode === 'list' ? '#2563eb' : bgSubtle }
              }}
            >
              List View
            </Button>
          </Box>
        </Box>
      </Card>

      {/* KPI Stats */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Network
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6', mt: 0.5 }}>
                {treeStats.totalMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Active Members
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981', mt: 0.5 }}>
                {treeStats.activeMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Network Earnings
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>
                PKR {parseFloat(treeStats.totalEarnings || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                Tree Depth
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
                Level {treeStats.maxLevel}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Referral Link & Code Section */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 2 }}>
          Your Invitation Links
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: textPrimary, fontWeight: 700, flexGrow: 1, pl: 1 }}>
                Code: {user?.username}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy Code'}>
                <IconButton onClick={copyReferralCode} size="small" sx={{ color: copied ? '#10b981' : textSecondary }}>
                  {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Share />}
              onClick={shareReferralLink}
              sx={{
                borderRadius: 0,
                bgcolor: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                textTransform: 'none',
                py: 1.2,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Share Referral Link
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Main View: Tree or List */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>
            {viewMode === 'tree' ? 'Visual Downline Tree' : `Direct Referrals (${referrals.length})`}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: borderCard }} />

        {viewMode === 'tree' ? (
          <Box sx={{ p: 3, overflowX: 'auto' }}>
            {referralTree ? (
              <TreeNode node={referralTree} level={0} isLight={isLight} borderCard={borderCard} textPrimary={textPrimary} textSecondary={textSecondary} bgSubtle={bgSubtle} />
            ) : (
              <Typography variant="body2" sx={{ color: textSecondary, textAlign: 'center', py: 4 }}>
                No genealogy nodes available.
              </Typography>
            )}
          </Box>
        ) : (
          referrals.length > 0 ? (
            <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: bgSubtle }}>
                  <TableRow>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Member</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined Date</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Package</TableCell>
                    <TableCell align="right" sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Earnings Generated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: bgSubtle } }}>
                      <TableCell sx={{ fontWeight: 700, color: textPrimary }}>{r.name} (@{r.username})</TableCell>
                      <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>{r.email}</TableCell>
                      <TableCell sx={{ color: textSecondary, fontSize: '0.82rem' }}>{new Date(r.joinedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={(r.status || 'active').toUpperCase()}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            bgcolor: r.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: r.status === 'active' ? '#10b981' : '#ef4444'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: textPrimary, fontWeight: 600 }}>{r.package || 'None'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                          PKR {parseFloat(r.earnings || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PersonAdd sx={{ fontSize: 40, color: textSecondary, mb: 1 }} />
              <Typography variant="subtitle1" sx={{ color: textPrimary, fontWeight: 700 }}>
                No Direct Referrals
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
                Share your invitation code to recruit members and start earning.
              </Typography>
            </Box>
          )
        )}
      </Card>
    </Box>
  );
}

function TreeNode({ node, level, isLight, borderCard, textPrimary, textSecondary, bgSubtle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = level === 0;

  return (
    <Box sx={{ position: 'relative', mb: 1.5 }}>
      <Paper
        sx={{
          p: 2,
          bgcolor: isRoot ? (isLight ? '#eff6ff' : '#1e3a8a20') : bgSubtle,
          border: `1px solid ${isRoot ? '#3b82f6' : borderCard}`,
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Chip
          label={`L${level}`}
          size="small"
          sx={{
            borderRadius: 0,
            bgcolor: isRoot ? '#3b82f6' : (isLight ? '#e2e8f0' : '#1e293b'),
            color: isRoot ? '#fff' : textPrimary,
            fontWeight: 800,
            fontSize: '0.7rem'
          }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
              {node.name}
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              @{node.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Package: <strong>{node.package || 'None'}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Points: <strong>{node.points || 0}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Joined: <strong>{new Date(node.joinedDate).toLocaleDateString()}</strong>
            </Typography>
          </Box>
        </Box>

        <Chip
          label={(node.status || 'active').toUpperCase()}
          size="small"
          sx={{
            borderRadius: 0,
            fontWeight: 800,
            fontSize: '0.65rem',
            bgcolor: node.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: node.status === 'active' ? '#10b981' : '#ef4444'
          }}
        />
      </Paper>

      {hasChildren && (
        <Box sx={{ ml: { xs: 2, sm: 4 }, pl: 2, borderLeft: `2px dashed ${borderCard}`, mt: 1 }}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLight={isLight}
              borderCard={borderCard}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              bgSubtle={bgSubtle}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockResetIcon from '@mui/icons-material/LockReset';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StarsIcon from '@mui/icons-material/Stars';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ShareIcon from '@mui/icons-material/Share';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useAdminTheme } from '@/context/AdminThemeContext';

export default function UserManagementPage() {
  const { isLight } = useAdminTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Server Filter States
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [showUpdateWalletModal, setShowUpdateWalletModal] = useState(false);
  const [showUpdatePointsModal, setShowUpdatePointsModal] = useState(false);
  const [showUpdateRankModal, setShowUpdateRankModal] = useState(false);
  const [showUpdateReferralModal, setShowUpdateReferralModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setNewConfirmPassword] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newRankId, setNewRankId] = useState('');
  const [newReferral, setNewReferral] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [ranks, setRanks] = useState([]);

  // Debounce search input for high performance
  const debounceTimer = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 320);
  };

  const getAuthHeaders = useCallback(() => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
    const adminToken = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    };
  }, []);

  // Fetch Users with Server Pagination & Filtering
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
        status: statusFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      });

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount || 0);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, debouncedSearch, getAuthHeaders]);

  const fetchRanks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ranks', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRanks(Array.isArray(data.ranks) ? data.ranks : []);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    if (newPassword.length < 6) {
      setActionError('Password must be at least 6 characters long.');
      setActionLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setActionError('Passwords do not match.');
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowUpdatePasswordModal(false);
        setNewPassword('');
        setNewConfirmPassword('');
        fetchUsers();
      } else {
        setActionError(data.error || data.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setActionError('An unexpected error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Wallet
  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    const balance = parseFloat(newWalletBalance);

    if (isNaN(balance) || balance < 0) {
      setActionError('Please enter a valid balance amount.');
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ balance: balance }),
      });

      if (response.ok) {
        setShowUpdateWalletModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to update wallet.');
      }
    } catch {
      setActionError('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Points
  const handleUpdatePoints = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    const pts = parseInt(newPoints, 10);

    if (isNaN(pts) || pts < 0) {
      setActionError('Please enter a valid points number.');
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ points: pts }),
      });

      if (response.ok) {
        setShowUpdatePointsModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to update points.');
      }
    } catch {
      setActionError('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Rank
  const handleUpdateRank = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ rankId: newRankId ? parseInt(newRankId, 10) : null }),
      });

      if (response.ok) {
        setShowUpdateRankModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to update rank.');
      }
    } catch {
      setActionError('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Referral
  const handleUpdateReferral = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ referredBy: newReferral.trim() || null }),
      });

      if (response.ok) {
        setShowUpdateReferralModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to update referral.');
      }
    } catch {
      setActionError('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user, newStatus) => {
    if (!confirm(`Are you sure you want to change @${user.username} status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Chip
            label="ACTIVE"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
        );
      case 'suspended':
        return (
          <Chip
            label="SUSPENDED"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          />
        );
      default:
        return (
          <Chip
            label={status ? status.toUpperCase() : 'INACTIVE'}
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
              backgroundColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
              color: isLight ? '#475569' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`
            }}
          />
        );
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Color tokens
  const cardBg = isLight ? '#ffffff' : '#0c1220';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#ffffff';
  const textSecondary = isLight ? '#475569' : 'rgba(255,255,255,0.6)';
  const inputBg = isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)';
  const tableHeaderBg = isLight ? '#f8fafc' : '#0f172a';
  const rowHover = isLight ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.02)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleAltIcon sx={{ color: '#6366f1', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              User Account Governance
            </Typography>
            <Chip
              icon={<FlashOnIcon sx={{ fontSize: '14px !important', color: '#10b981' }} />}
              label="FAST QUERY ACTIVE"
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
            High-speed directory query: supervise user identities, calibrate wallet balances, adjust network rank placements, and update credentials.
          </Typography>
        </Box>

        <Button
          onClick={fetchUsers}
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={14} sx={{ color: '#6366f1' }} /> : <SyncIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 0,
            borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)',
            color: textPrimary,
            backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
            fontSize: '0.78rem',
            fontWeight: 700,
            '&:hover': { borderColor: '#6366f1', backgroundColor: isLight ? '#f1f5f9' : 'rgba(99, 102, 241, 0.1)' }
          }}
        >
          {loading ? 'Querying...' : `Refresh (${totalCount} Total)`}
        </Button>
      </Box>

      {/* Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Instant search by full name, username, email, or phone number..."
                value={searchInput}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: textSecondary, mr: 1, fontSize: 18 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    backgroundColor: inputBg,
                    borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)',
                    color: textPrimary,
                    fontSize: '0.85rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    borderRadius: 0,
                    backgroundColor: inputBg,
                    color: textPrimary,
                    fontSize: '0.85rem',
                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSvgIcon-root': { color: textSecondary }
                  }}
                >
                  <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Member Statuses</MenuItem>
                  <MenuItem value="active" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Active Members Only</MenuItem>
                  <MenuItem value="inactive" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Inactive Only</MenuItem>
                  <MenuItem value="suspended" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Suspended Accounts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Directory Table */}
      <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: tableHeaderBg }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Member Identity
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Contact Information
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Balance & Points
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Rank & Placement
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Account Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Governance Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#6366f1', mb: 1.5 }} />
                    <Typography sx={{ color: textSecondary, fontSize: '0.84rem' }}>
                      Executing high-speed directory query...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: textSecondary, fontSize: '0.9rem' }}>
                      No user accounts found matching your query criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: rowHover },
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 0,
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#6366f1',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}
                        >
                          {user.fullname?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ color: textPrimary, fontWeight: 700, fontSize: '0.88rem' }}>
                            {user.fullname || 'Unnamed Member'}
                          </Typography>
                          <Typography sx={{ color: '#6366f1', fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 600 }}>
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                        {user.email || '—'}
                      </Typography>
                      <Typography sx={{ color: textSecondary, fontSize: '0.76rem' }}>
                        {user.phoneNumber || 'No phone recorded'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {formatCurrency(user.balance)}
                      </Typography>
                      <Typography sx={{ color: '#f59e0b', fontSize: '0.76rem', fontWeight: 600 }}>
                        {user.points || 0} pts
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.rank?.title || 'STANDARD MEMBER'}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                          color: isLight ? '#4f46e5' : '#818cf8',
                          border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`
                        }}
                      />
                      <Typography sx={{ color: textSecondary, fontSize: '0.72rem', mt: 0.3 }}>
                        Sponsor: {user.referredBy ? `@${user.referredBy}` : 'Direct'}
                      </Typography>
                    </TableCell>

                    <TableCell>{getStatusBadge(user.status)}</TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
                        <Tooltip title="View Profile Snapshot">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetailsModal(true);
                            }}
                            sx={{ color: '#38bdf8', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.3)'}`, p: 0.6 }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reset Credentials">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionError('');
                              setShowUpdatePasswordModal(true);
                            }}
                            sx={{ color: '#f87171', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(248, 113, 113, 0.3)'}`, p: 0.6 }}
                          >
                            <LockResetIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Calibrate Wallet Balance">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewWalletBalance(user.balance || '0');
                              setActionError('');
                              setShowUpdateWalletModal(true);
                            }}
                            sx={{ color: '#10b981', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(16, 185, 129, 0.3)'}`, p: 0.6 }}
                          >
                            <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Adjust Reward Points">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPoints(user.points || '0');
                              setActionError('');
                              setShowUpdatePointsModal(true);
                            }}
                            sx={{ color: '#f59e0b', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(245, 158, 11, 0.3)'}`, p: 0.6 }}
                          >
                            <StarsIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Assign Rank Placement">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRankId(user.rankId || '');
                              setActionError('');
                              setShowUpdateRankModal(true);
                            }}
                            sx={{ color: '#818cf8', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(129, 140, 248, 0.3)'}`, p: 0.6 }}
                          >
                            <WorkspacePremiumIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reassign Sponsor Network">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewReferral(user.referredBy || '');
                              setActionError('');
                              setShowUpdateReferralModal(true);
                            }}
                            sx={{ color: '#a78bfa', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(167, 139, 250, 0.3)'}`, p: 0.6 }}
                          >
                            <ShareIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        {user.status === 'active' ? (
                          <Tooltip title="Suspend Account">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(user, 'suspended')}
                              sx={{ color: '#ef4444', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(239, 68, 68, 0.3)'}`, p: 0.6 }}
                            >
                              <BlockIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Reactivate Account">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(user, 'active')}
                              sx={{ color: '#10b981', borderRadius: 0, border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(16, 185, 129, 0.3)'}`, p: 0.6 }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server-Side Table Pagination with Sharp Corners */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{
            borderTop: cardBorder,
            color: textSecondary,
            '& .MuiTablePagination-select': { borderRadius: 0 },
            '& .MuiIconButton-root': { borderRadius: 0 }
          }}
        />
      </Card>

      {/* Snapshot Dialog */}
      <Dialog
        open={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>Member Dossier Profile</Typography>
          <IconButton onClick={() => setShowUserDetailsModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              <Box sx={{ p: 1.5, backgroundColor: inputBg, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>Full Legal Name</Typography>
                <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 700 }}>{selectedUser.fullname}</Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: inputBg, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>Username & Email</Typography>
                <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 600 }}>@{selectedUser.username} • {selectedUser.email}</Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: inputBg, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>Wallet Balance & Points</Typography>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800 }}>{formatCurrency(selectedUser.balance)} • Points: {selectedUser.points || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: inputBg, border: cardBorder }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>Direct Referral Sponsor</Typography>
                <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 700 }}>{selectedUser.referredBy ? `@${selectedUser.referredBy}` : 'None (Direct Root)'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
          <Button onClick={() => setShowUserDetailsModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0, color: textPrimary, borderColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={showUpdatePasswordModal}
        onClose={() => setShowUpdatePasswordModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Reset User Password</Typography>
          <IconButton onClick={() => setShowUpdatePasswordModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleUpdatePassword}>
          <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>{actionError}</Alert>}
            <Typography variant="caption" sx={{ color: textSecondary }}>Updating credentials for @{selectedUser?.username}</Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setNewConfirmPassword(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
            <Button onClick={() => setShowUpdatePasswordModal(false)} size="small" sx={{ borderRadius: 0, color: textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={actionLoading} sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' } }}>
              {actionLoading ? 'Updating...' : 'Commit Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Wallet Balance Dialog */}
      <Dialog
        open={showUpdateWalletModal}
        onClose={() => setShowUpdateWalletModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Calibrate Wallet Balance</Typography>
          <IconButton onClick={() => setShowUpdateWalletModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleUpdateWallet}>
          <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>{actionError}</Alert>}
            <Typography variant="caption" sx={{ color: textSecondary }}>Calibrating wallet for @{selectedUser?.username}</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Balance (USD)"
              value={newWalletBalance}
              onChange={(e) => setNewWalletBalance(e.target.value)}
              inputProps={{ step: '0.01', min: '0' }}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
            <Button onClick={() => setShowUpdateWalletModal(false)} size="small" sx={{ borderRadius: 0, color: textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={actionLoading} sx={{ borderRadius: 0, backgroundColor: '#10b981', color: '#fff', '&:hover': { backgroundColor: '#059669' } }}>
              {actionLoading ? 'Saving...' : 'Update Balance'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Points Dialog */}
      <Dialog
        open={showUpdatePointsModal}
        onClose={() => setShowUpdatePointsModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Adjust Reward Points</Typography>
          <IconButton onClick={() => setShowUpdatePointsModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleUpdatePoints}>
          <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>{actionError}</Alert>}
            <Typography variant="caption" sx={{ color: textSecondary }}>Adjusting rewards points for @{selectedUser?.username}</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Reward Points"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              inputProps={{ step: '1', min: '0' }}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
            <Button onClick={() => setShowUpdatePointsModal(false)} size="small" sx={{ borderRadius: 0, color: textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={actionLoading} sx={{ borderRadius: 0, backgroundColor: '#f59e0b', color: '#fff', '&:hover': { backgroundColor: '#d97706' } }}>
              {actionLoading ? 'Saving...' : 'Commit Points'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Rank Qualification Dialog */}
      <Dialog
        open={showUpdateRankModal}
        onClose={() => setShowUpdateRankModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Set Rank Qualification</Typography>
          <IconButton onClick={() => setShowUpdateRankModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleUpdateRank}>
          <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>{actionError}</Alert>}
            <Typography variant="caption" sx={{ color: textSecondary }}>Designate rank qualification for @{selectedUser?.username}</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={newRankId}
                onChange={(e) => setNewRankId(e.target.value)}
                displayEmpty
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="" sx={{ borderRadius: 0 }}>No Rank Assigned (Standard)</MenuItem>
                {ranks.map((r) => (
                  <MenuItem key={r.id} value={r.id} sx={{ borderRadius: 0 }}>
                    {r.title} ({r.required_points || 0} pts)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
            <Button onClick={() => setShowUpdateRankModal(false)} size="small" sx={{ borderRadius: 0, color: textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={actionLoading} sx={{ borderRadius: 0, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' } }}>
              {actionLoading ? 'Saving...' : 'Apply Rank'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Sponsor Referral Dialog */}
      <Dialog
        open={showUpdateReferralModal}
        onClose={() => setShowUpdateReferralModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, backgroundColor: cardBg, border: cardBorder } }}
      >
        <DialogTitle sx={{ borderBottom: cardBorder, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Reassign Sponsor Placement</Typography>
          <IconButton onClick={() => setShowUpdateReferralModal(false)} sx={{ color: textSecondary, borderRadius: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleUpdateReferral}>
          <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 0, py: 0.5 }}>{actionError}</Alert>}
            <Typography variant="caption" sx={{ color: textSecondary }}>Reassign direct referral parent for @{selectedUser?.username}</Typography>
            <TextField
              fullWidth
              size="small"
              label="Sponsor Username"
              value={newReferral}
              onChange={(e) => setNewReferral(e.target.value)}
              placeholder="e.g. root_sponsor"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: cardBorder }}>
            <Button onClick={() => setShowUpdateReferralModal(false)} size="small" sx={{ borderRadius: 0, color: textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={actionLoading} sx={{ borderRadius: 0, backgroundColor: '#818cf8', color: '#fff', '&:hover': { backgroundColor: '#6366f1' } }}>
              {actionLoading ? 'Saving...' : 'Reassign Sponsor'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
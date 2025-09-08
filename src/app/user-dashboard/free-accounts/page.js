"use client";

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import {
  AccountBalance,
  Search,
  Download,
  Visibility,
  CheckCircle,
  Pending,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function FreeAccountsPage() {
  const context = useContext(UserContext);
  const [inactiveData, setInactiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchInactivePackageTree();
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

  const fetchInactivePackageTree = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/free-accounts', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInactiveData(data);
        // Initialize expanded levels for tree view
        setExpandedLevels({ 1: true }); // Expand level 1 by default
      } else {
        setError('Failed to fetch inactive package tree');
      }
    } catch (error) {
      console.error('Error fetching inactive package tree:', error);
      setError('Error loading inactive package tree');
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return 'primary';
      case 2:
        return 'secondary';
      case 3:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPackageStatusColor = (status) => {
    switch (status) {
      case 'No Package':
        return 'error';
      case 'Expired':
        return 'warning';
      case 'Active':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter members based on search
  const filteredMembers = inactiveData?.allMembers?.filter(member => 
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group members by level for tree view
  const membersByLevel = {};
  filteredMembers.forEach(member => {
    if (!membersByLevel[member.level]) {
      membersByLevel[member.level] = [];
    }
    membersByLevel[member.level].push(member);
  });

  // Calculate totals
  const totalMembers = filteredMembers.length;
  const inactivePackageMembers = filteredMembers.filter(m => m.isPackageInactive).length;
  const totalPotentialRevenue = filteredMembers.reduce((sum, member) => sum + member.packageAmount, 0);

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
        MLM Tree - Inactive Package Members
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Members
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {totalMembers}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Inactive Packages
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {inactivePackageMembers}
                  </Typography>
                </Box>
                <Pending sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Potential Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    PKR {totalPotentialRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Max Level
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {inactiveData?.treeStats?.maxLevel || 0}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Card sx={{ mb: 3, borderRadius: 0 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                startIcon={<AccountBalance />}
                onClick={() => setViewMode('tree')}
              >
                Tree View
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                startIcon={<Download />}
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* MLM Tree Display */}
      <Card sx={{ borderRadius: 0 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance />
            MLM Tree - Inactive Package Members ({filteredMembers.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredMembers.length > 0 ? (
            viewMode === 'tree' ? (
              // Tree View
              <Box>
                {/* Root User */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {inactiveData?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {inactiveData?.user?.name || 'Unknown'} (You)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{inactiveData?.user?.username} • {inactiveData?.user?.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={inactiveData?.user?.package || 'No Package'} color="primary" size="small" />
                        <Chip label={inactiveData?.user?.rank || 'No Rank'} color="secondary" size="small" />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        PKR {(inactiveData?.user?.totalEarnings || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Earnings
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Downline Levels */}
                {Object.keys(membersByLevel).sort((a, b) => parseInt(a) - parseInt(b)).map(level => (
                  <Box key={level} sx={{ ml: parseInt(level) * 2 }}>
                    <Button
                      onClick={() => toggleLevel(parseInt(level))}
                      startIcon={expandedLevels[parseInt(level)] ? <ExpandLess /> : <ExpandMore />}
                      sx={{ mb: 1, textTransform: 'none' }}
                    >
                      <Typography variant="h6">
                        Level {level} ({membersByLevel[level].length} members)
                      </Typography>
                    </Button>
                    
                    <Collapse in={expandedLevels[parseInt(level)]}>
                      <List>
                        {membersByLevel[level].map((member) => (
                          <ListItem key={member.id} sx={{ pl: 4 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: getLevelColor(parseInt(level)) + '.main' }}>
                                {member.name?.charAt(0).toUpperCase() || 'U'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {member.name || 'Unknown'}
                                  </Typography>
                                  <Chip 
                                    label={member.packageStatus} 
                                    color={getPackageStatusColor(member.packageStatus)}
                                    size="small"
                                  />
                                  <Chip 
                                    label={member.status || 'Active'} 
                                    color={getStatusColor(member.status || 'active')}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    @{member.username} • {member.email}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Joined: {formatDate(member.createdAt)} • Package: {member.package}
                                    {member.packageExpiryDate && (
                                      <span> • Expired: {formatDate(member.packageExpiryDate)}</span>
                                    )}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ textAlign: 'right', mr: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                  PKR {(member.totalEarnings || 0).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Potential: PKR {member.packageAmount.toLocaleString()}
                                </Typography>
                              </Box>
                              <Tooltip title="Contact Member">
                                <IconButton size="small" color="primary">
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                ))}
              </Box>
            ) : (
              // List View
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Member</strong></TableCell>
                      <TableCell><strong>Level</strong></TableCell>
                      <TableCell><strong>Package Status</strong></TableCell>
                      <TableCell><strong>Join Date</strong></TableCell>
                      <TableCell><strong>Total Earnings</strong></TableCell>
                      <TableCell><strong>Potential Revenue</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: getLevelColor(member.level) + '.main' }}>
                              {member.name?.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {member.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                @{member.username} • {member.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`Level ${member.level}`} 
                            color={getLevelColor(member.level)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.packageStatus} 
                            color={getPackageStatusColor(member.packageStatus)}
                            size="small"
                          />
                          {member.packageExpiryDate && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Expired: {formatDate(member.packageExpiryDate)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(member.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            PKR {(member.totalEarnings || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                            PKR {member.packageAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Contact Member">
                            <IconButton size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Inactive Package Members
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm 
                  ? 'No members match your search criteria.'
                  : "Great! All your downline members have active packages."
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

    </Box>
  );
}

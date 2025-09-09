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
  People,
  Search,
  Download,
  Visibility,
  TrendingUp,
  PersonAdd,
  ExpandMore,
  ExpandLess,
  AccountTree,
  Group
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function DownlistPage() {
  const context = useContext(UserContext);
  const [downlineData, setDownlineData] = useState(null);
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
      fetchDownlineMembers();
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

  const fetchDownlineMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/downline', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDownlineData(data);
        // Initialize expanded levels for tree view
        setExpandedLevels({ 1: true }); // Expand level 1 by default
      } else {
        setError('Failed to fetch downline members');
      }
    } catch (error) {
      console.error('Error fetching downline members:', error);
      setError('Error loading downline members');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Toggle level expansion
  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  // Filter members based on search
  const filteredMembers = downlineData?.members?.filter(member => 
    member.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  const activeMembers = filteredMembers.filter(m => m.status === 'active').length;
  const totalEarnings = filteredMembers.reduce((sum, member) => sum + (member.totalEarnings || 0), 0);

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
        Downline List
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
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
                <People sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Active Members
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {activeMembers}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    PKR {totalEarnings.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
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
                startIcon={<AccountTree />}
                onClick={() => setViewMode('tree')}
              >
                Tree View
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                startIcon={<Group />}
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Members Display */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People />
            Downline Members ({filteredMembers.length})
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
                <Card sx={{ mb: 2, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {downlineData?.user?.fullname?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {downlineData?.user?.fullname || 'You'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{downlineData?.user?.username} • {downlineData?.user?.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label="Root" color="primary" size="small" />
                          <Chip 
                            label={downlineData?.user?.status || 'Active'} 
                            color={getStatusColor(downlineData?.user?.status || 'active')}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          PKR {(downlineData?.user?.totalEarnings || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {downlineData?.user?.referralCount || 0} referrals
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

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
                            {member.fullname?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {member.fullname || 'Unknown'}
                                  </Typography>
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
                                  {member.points || 0} points
                            </Typography>
                          </Box>
                              <Tooltip title="View Details">
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
              <List>
                {filteredMembers.map((member) => (
                  <ListItem key={member.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getLevelColor(member.level) + '.main' }}>
                        {member.fullname?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {member.fullname || 'Unknown'}
                          </Typography>
                        <Chip 
                            label={`Level ${member.level}`} 
                            color={getLevelColor(member.level)}
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
                          {member.points || 0} points
                        </Typography>
                      </Box>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  ))}
              </List>
            )
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Downline Members
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm 
                  ? 'No members match your search criteria.'
                  : "You don't have any downline members yet. Start inviting people to build your network!"
                }
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    // TODO: Implement invite functionality
                    console.log('Invite functionality to be implemented');
                  }}
                >
                  Invite New Members
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

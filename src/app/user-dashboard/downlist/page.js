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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  People,
  Search,
  TrendingUp,
  PersonAdd,
  Star
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function DownlistPage() {
  const context = useContext(UserContext);
  const [downlineData, setDownlineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'

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
      case 4:
        return 'error';
      case 5:
        return 'info';
      case 6:
        return 'success';
      case 7:
        return 'primary';
      case 8:
        return 'secondary';
      case 9:
        return 'warning';
      case 10:
        return 'error';
      default:
        return 'default';
    }
  };


  // Filter members based on search and level
  const filteredMembers = downlineData?.members?.filter(member => {
    const matchesSearch = member.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || member.level === parseInt(selectedLevel);
    
    return matchesSearch && matchesLevel;
  }) || [];

  // Calculate totals
  const totalMembers = filteredMembers.length;
  const activeMembers = filteredMembers.filter(m => m.status === 'active').length;

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, maxWidth: '100%', mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Downline List
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ padding: '12px 16px' }}>
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
            <CardContent sx={{ padding: '12px 16px' }}>
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
            <CardContent sx={{ padding: '12px 16px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Max Level
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {downlineData?.stats?.maxLevel || 0}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ padding: '12px 16px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Points
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {filteredMembers.reduce((total, member) => total + (member.points || 0), 0)}
                  </Typography>
                </Box>
                <Star sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Level Breakdown */}
      {downlineData?.stats && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ padding: '12px 16px' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              Level Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                const count = downlineData.stats[`level${level}Members`] || 0;
                if (count === 0 && level > (downlineData.stats.maxLevel || 0)) return null;
                return (
                  <Grid item xs={6} sm={4} md={2.4} key={level}>
                    <Box sx={{ 
                      p: 1, 
                      textAlign: 'center', 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: count > 0 ? 'action.hover' : 'transparent'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Level {level}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {count}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Search and Actions */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ padding: '12px 16px' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search members by name, username, or phone..."
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="all">All Levels</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                  const count = downlineData?.stats?.[`level${level}Members`] || 0;
                  if (count === 0 && level > (downlineData?.stats?.maxLevel || 0)) return null;
                  return (
                    <option key={level} value={level}>
                      Level {level} ({count} members)
                    </option>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('list')}
                size="small"
                fullWidth
              >
                List View
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('tree')}
                size="small"
                fullWidth
              >
                Tree View
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Members Display */}
      <Card sx={{ padding: 0 }}>
        <CardContent sx={{ padding: '16px 16px 0 16px', '&:last-child': { paddingBottom: 0 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People />
            Downline Members ({filteredMembers.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredMembers.length > 0 ? (
            viewMode === 'list' ? (
              // Simple Table View
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: 600,
                  overflowX: 'auto',
                  padding: 0,
                  '& .MuiTableHead-root': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiTableCell-root': {
                    whiteSpace: 'nowrap',
                    minWidth: { xs: '120px', sm: 'auto' },
                    padding: '12px 16px'
                  }
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Package</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Points</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {member.fullname || 'Unknown'}
                                  </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            @{member.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`Level ${member.level}`}
                            color={getLevelColor(member.level)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                                  <Chip 
                                    label={member.status || 'Active'} 
                                    color={getStatusColor(member.status || 'active')}
                                    size="small"
                                  />
                        </TableCell>
                        <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                            {member.package || 'No Package'}
                                  </Typography>
                        </TableCell>
                        <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {member.points || 0}
                                  </Typography>
                        </TableCell>
                        <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                            {formatDate(member.createdAt)}
                                  </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Tree View
              <Box sx={{ maxHeight: 600, overflowY: 'auto', p: 2 }}>
                {filteredMembers
                  .sort((a, b) => a.level - b.level)
                  .map((member) => (
                    <Box
                      key={member.id}
                      sx={{
                        ml: (member.level - 1) * 3,
                        mb: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                        position: 'relative',
                        '&::before': member.level > 1 ? {
                          content: '""',
                          position: 'absolute',
                          left: -12,
                          top: '50%',
                          width: 8,
                          height: 1,
                          backgroundColor: 'divider',
                          transform: 'translateY(-50%)'
                        } : {}
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                              {member.fullname?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {member.fullname || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{member.username}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`Level ${member.level}`}
                              color={getLevelColor(member.level)}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={member.status || 'Active'} 
                              color={getStatusColor(member.status || 'active')}
                              size="small"
                            />
                            <Chip 
                              label={`${member.points || 0} Points`}
                              color="primary"
                              size="small"
                              variant="filled"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
              </Box>
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

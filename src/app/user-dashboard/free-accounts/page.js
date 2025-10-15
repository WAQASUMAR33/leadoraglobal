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
  Button
} from '@mui/material';
import {
  AccountBalance,
  Search,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function FreeAccountsPage() {
  const context = useContext(UserContext);
  const [inactiveData, setInactiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

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
    member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate totals
  const totalMembers = filteredMembers.length;
  const inactivePackageMembers = filteredMembers.filter(m => m.isPackageInactive).length;

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
        Free Accounts (No Active Package)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing only downline members without active packages
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
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    No Package
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ padding: '12px 16px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Max Level
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {inactiveData?.treeStats?.maxLevel || 0}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ padding: '12px 16px' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredMembers.length} members without active packages
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Free Accounts Display */}
      <Card sx={{ padding: 0 }}>
        <CardContent sx={{ padding: '16px 16px 0 16px', '&:last-child': { paddingBottom: 0 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance />
            Free Accounts ({filteredMembers.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredMembers.length > 0 ? (
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Package Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {member.name || 'Unknown'}
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
                            label={member.packageStatus} 
                            color={getPackageStatusColor(member.packageStatus)}
                          size="small"
                        />
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
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Free Accounts
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

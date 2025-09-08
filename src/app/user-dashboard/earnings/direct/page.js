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
  TrendingUp,
  Search,
  Download,
  AttachMoney
} from '@mui/icons-material';
import { UserContext } from '../../../lib/userContext';

export default function DirectEarningsPage() {
  const context = useContext(UserContext);
  const [directEarnings, setDirectEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && context?.isAuthenticated && context?.user) {
      fetchDirectEarnings();
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

  const fetchDirectEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/earnings/direct', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDirectEarnings(data.earnings || []);
      } else {
        setError('Failed to fetch direct earnings');
      }
    } catch (error) {
      console.error('Error fetching direct earnings:', error);
      setError('Error loading direct earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter earnings based on search
  const filteredEarnings = directEarnings.filter(earning => 
    earning.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    earning.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalEarnings = filteredEarnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
  const totalCount = filteredEarnings.length;

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
        Direct Earnings
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
                    Total Direct Earnings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(totalEarnings)}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {totalCount}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Average per Transaction
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {totalCount > 0 ? formatCurrency(totalEarnings / totalCount) : formatCurrency(0)}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search earnings by description or type..."
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
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export functionality to be implemented');
                }}
              >
                Export Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp />
            Direct Earnings History ({filteredEarnings.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredEarnings.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEarnings.map((earning) => (
                    <TableRow key={earning.id} hover>
                      <TableCell>
                        {formatDate(earning.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={earning.type || 'Direct'} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {earning.description || 'Direct earning'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          +{formatCurrency(earning.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={earning.status || 'Completed'} 
                          color="success" 
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Direct Earnings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? 'No earnings match your search criteria.'
                  : "You haven't earned any direct earnings yet."
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

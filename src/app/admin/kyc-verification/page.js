'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function KYCVerificationPage() {
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchKYCSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/admin/kyc?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setKycSubmissions(data.kycSubmissions || []);
        setStats(data.stats || {});
        setPagination(data.pagination || {});
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, currentPage]);

  useEffect(() => {
    fetchKYCSubmissions();
  }, [selectedStatus, currentPage, fetchKYCSubmissions]);

  const handleStatusUpdate = async (kycId, newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus} this KYC submission?`)) {
      return;
    }

    try {
      setProcessingId(kycId);
      const response = await fetch(`/api/admin/kyc/${kycId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: ''
        }),
      });

      if (response.ok) {
        fetchKYCSubmissions();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('An error occurred while updating KYC status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Chip
            label="PENDING"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: '0.68rem',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          />
        );
      case 'approved':
        return (
          <Chip
            label="VERIFIED"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: '0.68rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
        );
      case 'rejected':
        return (
          <Chip
            label="REJECTED"
            size="small"
            sx={{
              borderRadius: 0,
              fontWeight: 700,
              fontSize: '0.68rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          />
        );
      default:
        return (
          <Chip
            label={status ? status.toUpperCase() : 'UNKNOWN'}
            size="small"
            sx={{
              borderRadius: 0,
              fontSize: '0.68rem',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)'
            }}
          />
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && kycSubmissions.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading KYC Submissions...
        </Typography>
      </Box>
    );
  }

  const statItems = [
    {
      title: 'PENDING VERIFICATION',
      val: stats.pending || 0,
      icon: <HourglassEmptyOutlinedIcon sx={{ color: '#fbbf24', fontSize: 24 }} />,
      borderColor: 'rgba(245, 158, 11, 0.25)',
      color: '#fbbf24'
    },
    {
      title: 'APPROVED MEMBERS',
      val: stats.approved || 0,
      icon: <CheckCircleOutlinedIcon sx={{ color: '#34d399', fontSize: 24 }} />,
      borderColor: 'rgba(16, 185, 129, 0.25)',
      color: '#34d399'
    },
    {
      title: 'REJECTED CASES',
      val: stats.rejected || 0,
      icon: <CancelOutlinedIcon sx={{ color: '#f87171', fontSize: 24 }} />,
      borderColor: 'rgba(239, 68, 68, 0.25)',
      color: '#f87171'
    },
    {
      title: 'TOTAL SUBMISSIONS',
      val: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0),
      icon: <VerifiedUserOutlinedIcon sx={{ color: '#818cf8', fontSize: 24 }} />,
      borderColor: 'rgba(99, 102, 241, 0.25)',
      color: '#818cf8'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <VerifiedUserOutlinedIcon sx={{ color: '#818cf8', fontSize: 24 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              KYC Identity Verification
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Inspect official government CNIC documents, verify member identities, and update compliance state.
          </Typography>
        </Box>

        {/* Status Filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FilterListIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              sx={{
                borderRadius: 0,
                backgroundColor: '#0c1220',
                color: '#ffffff',
                fontSize: '0.82rem',
                border: '1px solid rgba(255,255,255,0.1)',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' }
              }}
            >
              <MenuItem value="all" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>All Statuses</MenuItem>
              <MenuItem value="pending" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Pending Review</MenuItem>
              <MenuItem value="approved" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Approved</MenuItem>
              <MenuItem value="rejected" sx={{ borderRadius: 0, fontSize: '0.82rem' }}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5}>
        {statItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card
              sx={{
                borderRadius: 0,
                backgroundColor: '#0c1220',
                border: `1px solid ${item.borderColor}`,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                    {item.title}
                  </Typography>
                  <Box sx={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${item.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: item.color, fontSize: '1.8rem' }}>
                  {item.val}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Card */}
      <Card
        sx={{
          borderRadius: 0,
          backgroundColor: '#0c1220',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            KYC Submissions Directory
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Page {currentPage} of {pagination.pages || 1} ({pagination.total || 0} Records)
          </Typography>
        </Box>

        {kycSubmissions.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <VerifiedUserOutlinedIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
              No KYC Submissions Found
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5, display: 'block' }}>
              No identity documents currently match the specified filter parameters.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    MEMBER DETAILS
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    CNIC & CONTACT
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    SUBMITTED AT
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)', py: 1.5 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kycSubmissions.map((kyc) => (
                  <TableRow
                    key={kyc.id}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' },
                      borderColor: 'rgba(255,255,255,0.04)'
                    }}
                  >
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>
                        {kyc.user?.fullname || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', fontWeight: 600 }}>
                        @{kyc.user?.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                        {kyc.user?.email}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          CNIC: <span style={{ color: '#38bdf8' }}>{kyc.cnic_number || 'N/A'}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Phone: {kyc.phoneNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                          {kyc.city}, {kyc.country}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      {getStatusBadge(kyc.kyc_status)}
                    </TableCell>

                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2, color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                      {formatDate(kyc.createdAt)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          component={Link}
                          href={`/admin/kyc-verification/${kyc.id}`}
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            borderRadius: 0,
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                            color: '#818cf8',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            py: 0.5,
                            px: 1.2,
                            '&:hover': {
                              borderColor: '#818cf8',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)'
                            }
                          }}
                        >
                          View Docs
                        </Button>

                        {kyc.kyc_status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleStatusUpdate(kyc.id, 'approved')}
                              disabled={processingId === kyc.id}
                              variant="contained"
                              size="small"
                              sx={{
                                borderRadius: 0,
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                py: 0.5,
                                px: 1.2,
                                '&:hover': { backgroundColor: '#059669' }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(kyc.id, 'rejected')}
                              disabled={processingId === kyc.id}
                              variant="outlined"
                              size="small"
                              sx={{
                                borderRadius: 0,
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: '#f87171',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                py: 0.5,
                                px: 1.2,
                                '&:hover': {
                                  borderColor: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255,255,255,0.01)'
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Showing records {((currentPage - 1) * (pagination.limit || 20)) + 1} -{' '}
              {Math.min(currentPage * (pagination.limit || 20), pagination.total || 0)} of {pagination.total || 0}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                size="small"
                variant="outlined"
                startIcon={<NavigateBeforeIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 0,
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                }}
              >
                Prev
              </Button>

              <Button
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
                size="small"
                variant="outlined"
                endIcon={<NavigateNextIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 0,
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}

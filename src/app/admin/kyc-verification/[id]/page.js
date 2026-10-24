'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Breadcrumbs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function KYCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [kycSubmission, setKycSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchKYCDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || localStorage.getItem('token')) : '';
      const response = await fetch(`/api/admin/kyc/${params.id}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKycSubmission(data.kycSubmission);
        if (data.kycSubmission?.admin_notes) {
          setAdminNotes(data.kycSubmission.admin_notes);
        }
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      } else {
        alert('KYC submission not found');
        router.push('/admin/kyc-verification');
      }
    } catch (error) {
      console.error('Error fetching KYC detail:', error);
      alert('Error loading KYC details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      fetchKYCDetail();
    }
  }, [params.id, fetchKYCDetail]);

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this KYC application as ${newStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      setProcessing(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || localStorage.getItem('token')) : '';
      const response = await fetch(`/api/admin/kyc/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setKycSubmission(data.kycSubmission);
        alert(`KYC status successfully updated to ${newStatus.toUpperCase()}!`);
        router.push('/admin/kyc-verification');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update KYC status'}`);
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('An error occurred while updating KYC status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (status) => {
    const s = (status || 'pending').toLowerCase();
    let color = '#fbbf24';
    let bg = 'rgba(251, 191, 36, 0.12)';
    let border = '1px solid rgba(251, 191, 36, 0.3)';
    let label = 'PENDING REVIEW';

    if (s === 'approved') {
      color = '#34d399';
      bg = 'rgba(52, 211, 153, 0.12)';
      border = '1px solid rgba(52, 211, 153, 0.3)';
      label = 'APPROVED & VERIFIED';
    } else if (s === 'rejected') {
      color = '#f87171';
      bg = 'rgba(248, 113, 113, 0.12)';
      border = '1px solid rgba(248, 113, 113, 0.3)';
      label = 'REJECTED';
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          borderRadius: 0,
          fontWeight: 800,
          letterSpacing: '0.08em',
          fontSize: '0.72rem',
          color: color,
          backgroundColor: bg,
          border: border
        }}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#818cf8', mb: 2 }} />
        <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          LOADING KYC DOSSIER...
        </Typography>
      </Box>
    );
  }

  if (!kycSubmission) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b', p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#f87171', fontWeight: 700, mb: 1 }}>
            KYC Submission Not Found
          </Typography>
          <Typography sx={{ color: '#94a3b8', mb: 3 }}>
            The requested KYC verification application record could not be loaded.
          </Typography>
          <Button
            component={Link}
            href="/admin/kyc-verification"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 0, borderColor: '#6366f1', color: '#818cf8' }}
          >
            Return to KYC Directory
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 2, color: '#64748b' }}>
        <Link href="/admin/dashboard" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.85rem' }}>
          ADMIN
        </Link>
        <Link href="/admin/kyc-verification" style={{ textDecoration: 'none', color: '#818cf8', fontSize: '0.85rem' }}>
          KYC DIRECTORY
        </Link>
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>
          DOSSIER #{params.id}
        </Typography>
      </Breadcrumbs>

      {/* Header Bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/admin/kyc-verification"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 0,
              borderColor: '#1e293b',
              color: '#94a3b8',
              bgcolor: '#0c1220',
              '&:hover': { borderColor: '#818cf8', color: '#fff', bgcolor: '#111827' }
            }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedUserIcon sx={{ color: '#818cf8', fontSize: 28 }} />
              KYC Dossier Review
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Submission Reference: #{params.id} • Submitted {formatDate(kycSubmission.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getStatusChip(kycSubmission.kyc_status)}
        </Box>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column (Details) */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Identity & Personal Info Card */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  LEGAL IDENTITY SPECIFICATIONS
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Full Legal Name
                    </Typography>
                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.98rem', mt: 0.5 }}>
                      {kycSubmission.fullname || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Father / Guardian Name
                    </Typography>
                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.98rem', mt: 0.5 }}>
                      {kycSubmission.father_name || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Gender
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.92rem', mt: 0.5, textTransform: 'capitalize' }}>
                      {kycSubmission.gender || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      CNIC / National ID
                    </Typography>
                    <Typography sx={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', mt: 0.5 }}>
                      {kycSubmission.cnic_number || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      CNIC Expiry Date
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.cnic_expiry_date ? new Date(kycSubmission.cnic_expiry_date).toLocaleDateString() : '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Verified Email
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.email || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Verified Contact Phone
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.phoneNumber || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Address Records Card */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon sx={{ color: '#34d399', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  RESIDENTIAL ADDRESS ARCHIVE
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      City
                    </Typography>
                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.city || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Country
                    </Typography>
                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.country || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Current Residence Address
                    </Typography>
                    <Paper sx={{ borderRadius: 0, bgcolor: '#080d19', p: 1.5, border: '1px solid #1e293b', mt: 0.5 }}>
                      <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {kycSubmission.current_address || 'No current address provided'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Permanent CNIC Address
                    </Typography>
                    <Paper sx={{ borderRadius: 0, bgcolor: '#080d19', p: 1.5, border: '1px solid #1e293b', mt: 0.5 }}>
                      <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {kycSubmission.permanent_address || 'No permanent address provided'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Beneficiary Information */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactPhoneIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  BENEFICIARY / NOMINEE NOMINATION
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Beneficiary Legal Name
                    </Typography>
                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.beneficiary_name || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Relationship to Member
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.beneficiary_relation || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Beneficiary Mobile
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.92rem', mt: 0.5 }}>
                      {kycSubmission.beneficiary_phone_mobile || '—'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Beneficiary Residential Address
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', mt: 0.5 }}>
                      {kycSubmission.beneficiary_address || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Document Inspection Gallery */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  IDENTITY DOCUMENT EVIDENCE
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Click any image to enlarge in full resolution
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  {/* Profile Portrait */}
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                      Profile Photo
                    </Typography>
                    <Paper
                      onClick={() => {
                        if (kycSubmission.profile_image) {
                          setPreviewImage(kycSubmission.profile_image);
                          setPreviewTitle('Profile Photo');
                        }
                      }}
                      sx={{
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        border: '1px solid #1e293b',
                        height: 200,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: kycSubmission.profile_image ? 'pointer' : 'default',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                          borderColor: kycSubmission.profile_image ? '#818cf8' : '#1e293b'
                        }
                      }}
                    >
                      {kycSubmission.profile_image ? (
                        <>
                          <img
                            src={kycSubmission.profile_image}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': { opacity: 1 }
                          }}>
                            <ZoomInIcon sx={{ color: '#fff', fontSize: 32 }} />
                          </Box>
                        </>
                      ) : (
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>No photo uploaded</Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* CNIC Front */}
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                      CNIC Front Side
                    </Typography>
                    <Paper
                      onClick={() => {
                        if (kycSubmission.id_card_front) {
                          setPreviewImage(kycSubmission.id_card_front);
                          setPreviewTitle('CNIC Front Side');
                        }
                      }}
                      sx={{
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        border: '1px solid #1e293b',
                        height: 200,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: kycSubmission.id_card_front ? 'pointer' : 'default',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                          borderColor: kycSubmission.id_card_front ? '#818cf8' : '#1e293b'
                        }
                      }}
                    >
                      {kycSubmission.id_card_front ? (
                        <>
                          <img
                            src={kycSubmission.id_card_front}
                            alt="CNIC Front"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': { opacity: 1 }
                          }}>
                            <ZoomInIcon sx={{ color: '#fff', fontSize: 32 }} />
                          </Box>
                        </>
                      ) : (
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>No front ID uploaded</Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* CNIC Back */}
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                      CNIC Back Side
                    </Typography>
                    <Paper
                      onClick={() => {
                        if (kycSubmission.id_card_back) {
                          setPreviewImage(kycSubmission.id_card_back);
                          setPreviewTitle('CNIC Back Side');
                        }
                      }}
                      sx={{
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        border: '1px solid #1e293b',
                        height: 200,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: kycSubmission.id_card_back ? 'pointer' : 'default',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                          borderColor: kycSubmission.id_card_back ? '#818cf8' : '#1e293b'
                        }
                      }}
                    >
                      {kycSubmission.id_card_back ? (
                        <>
                          <img
                            src={kycSubmission.id_card_back}
                            alt="CNIC Back"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': { opacity: 1 }
                          }}>
                            <ZoomInIcon sx={{ color: '#fff', fontSize: 32 }} />
                          </Box>
                        </>
                      ) : (
                        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>No back ID uploaded</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Sidebar (Account Summary & Action Desk) */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Account Profile Summary Card */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  LINKED MEMBER PROFILE
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                {kycSubmission.user ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 0,
                          bgcolor: '#1e1b4b',
                          color: '#818cf8',
                          border: '1px solid #4338ca',
                          fontWeight: 800,
                          fontSize: '1.2rem'
                        }}
                      >
                        {kycSubmission.user.fullname?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                          {kycSubmission.user.fullname}
                        </Typography>
                        <Typography sx={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          @{kycSubmission.user.username}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: '#1e293b' }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Account Status</Typography>
                      <Chip
                        label={(kycSubmission.user.status || 'ACTIVE').toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: kycSubmission.user.status === 'active' ? '#34d399' : '#f87171',
                          bgcolor: kycSubmission.user.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${kycSubmission.user.status === 'active' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 16 }} /> Wallet Balance
                      </Typography>
                      <Typography sx={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>
                        ${parseFloat(kycSubmission.user.balance || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmojiEventsIcon sx={{ fontSize: 16, color: '#fbbf24' }} /> Reward Points
                      </Typography>
                      <Typography sx={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>
                        {kycSubmission.user.points || 0} pts
                      </Typography>
                    </Box>

                    {kycSubmission.user.rank && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Rank Qualification</Typography>
                        <Chip
                          label={kycSubmission.user.rank.title || 'MEMBER'}
                          size="small"
                          sx={{ borderRadius: 0, fontSize: '0.7rem', fontWeight: 700, color: '#cbd5e1', bgcolor: '#1e293b' }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Member Joined</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {formatDate(kycSubmission.user.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>No linked member record found</Typography>
                )}
              </CardContent>
            </Card>

            {/* Audit & Compliance Action Card */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  ADMIN COMPLIANCE DECISION
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 1.5 }}>
                  Review notes are permanently recorded in the user KYC audit log:
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter audit remarks or rejection reasoning (mandatory if rejecting)..."
                  sx={{
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      bgcolor: '#080d19',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      '& fieldset': { borderColor: '#1e293b' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                    }
                  }}
                />

                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={processing || kycSubmission.kyc_status === 'approved'}
                    startIcon={processing ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <CheckCircleIcon />}
                    sx={{
                      borderRadius: 0,
                      bgcolor: '#059669',
                      color: '#fff',
                      fontWeight: 700,
                      py: 1.3,
                      letterSpacing: '0.04em',
                      '&:hover': { bgcolor: '#047857' },
                      '&.Mui-disabled': { bgcolor: '#1e293b', color: '#475569' }
                    }}
                  >
                    {kycSubmission.kyc_status === 'approved' ? 'ALREADY APPROVED' : 'APPROVE & VERIFY KYC'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={processing || kycSubmission.kyc_status === 'rejected'}
                    startIcon={processing ? <CircularProgress size={18} sx={{ color: '#f87171' }} /> : <CancelIcon />}
                    sx={{
                      borderRadius: 0,
                      borderColor: '#dc2626',
                      color: '#f87171',
                      fontWeight: 700,
                      py: 1.3,
                      letterSpacing: '0.04em',
                      '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.1)', borderColor: '#ef4444' },
                      '&.Mui-disabled': { borderColor: '#1e293b', color: '#475569' }
                    }}
                  >
                    {kycSubmission.kyc_status === 'rejected' ? 'ALREADY REJECTED' : 'REJECT KYC APPLICATION'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Timeline Audit History */}
            <Card sx={{ borderRadius: 0, bgcolor: '#0c1220', border: '1px solid #1e293b' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.92rem', letterSpacing: '0.04em' }}>
                  AUDIT TIMELINE
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: '#818cf8', mt: 0.8 }} />
                    <Box>
                      <Typography sx={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: 600 }}>
                        Application Created
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {formatDate(kycSubmission.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {kycSubmission.updatedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: '#34d399', mt: 0.8 }} />
                      <Box>
                        <Typography sx={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: 600 }}>
                          Last Status Review
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {formatDate(kycSubmission.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Image Inspection Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: '#070a12',
            border: '1px solid #1e293b'
          }
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', bgcolor: '#0f172a' }}>
          <span>{previewTitle}</span>
          <Button onClick={() => setPreviewImage(null)} sx={{ color: '#94a3b8', borderRadius: 0 }}>
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center', bgcolor: '#050810' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt={previewTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                border: '1px solid #1e293b'
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1e293b', bgcolor: '#0f172a' }}>
          <Button
            href={previewImage || '#'}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, borderColor: '#6366f1', color: '#818cf8' }}
          >
            Open Original File
          </Button>
          <Button
            onClick={() => setPreviewImage(null)}
            variant="contained"
            size="small"
            sx={{ borderRadius: 0, bgcolor: '#4338ca', color: '#fff' }}
          >
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

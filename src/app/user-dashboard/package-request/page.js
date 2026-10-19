"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import {
  ReceiptLong,
  AccountBalance,
  CloudUpload,
  ArrowBack,
  CheckCircle,
  DeleteOutline,
  HelpOutline,
  CreditCard
} from '@mui/icons-material';
import { useUser } from "../../../lib/userContext";
import { useAppTheme } from "../../../context/AdminThemeContext";

function PackageRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useUser();
  const { isLight } = useAppTheme();
  
  const [packageData, setPackageData] = useState({
    id: 5,
    package_name: "Elite Package",
    package_amount: "30000",
    package_points: 500
  });
  const [bankAccounts, setBankAccounts] = useState([
    { id: 1, bank_name: "Meezan Bank Limited", account_title: "Ledora Global Enterprise", account_number: "0102030405060708", branch_code: "0102", iban: "PK36MEZN0001020304050607" }
  ]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: "",
    transactionReceipt: "",
    notes: ""
  });
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const packageId = searchParams.get('packageId');

  const bgCard = isLight ? '#ffffff' : '#0c1220';
  const borderCard = isLight ? '#e2e8f0' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';
  const bgSubtle = isLight ? '#f8fafc' : '#070a12';

  const fetchPackageDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        const selectedPackage = (data.packages || []).find(pkg => pkg.id === parseInt(packageId));
        if (selectedPackage) {
          setPackageData(selectedPackage);
        } else {
          router.push('/user-dashboard/subscribe');
        }
      }
    } catch (err) {
      console.error('Error fetching package:', err);
    } finally {
      setLoading(false);
    }
  }, [packageId, router]);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
    }
  }, []);

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
      fetchBankAccounts();
    }
  }, [packageId, fetchPackageDetails, fetchBankAccounts]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const base64Data = await convertImageToBase64(file);
    setImagePreview(base64Data);
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToAPI = async (base64Data) => {
    const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data })
    });

    if (!response.ok) throw new Error('Image upload failed');
    const result = await response.json();
    return result.url || result.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transactionId || !selectedFile) {
      alert('Please enter Transaction ID and attach the payment receipt.');
      return;
    }

    if (!isAuthenticated || !user) {
      alert('Please log in to submit a package request');
      return;
    }

    setSubmitting(true);

    try {
      const base64Data = await convertImageToBase64(selectedFile);
      let imageUrl;
      try {
        imageUrl = await uploadImageToAPI(base64Data);
      } catch (err) {
        imageUrl = `data:image/jpeg;base64,${base64Data.split(',')[1]}`;
      }

      const requestData = {
        userId: user.id,
        packageId: parseInt(packageId),
        transactionId: formData.transactionId,
        transactionReceipt: imageUrl,
        notes: formData.notes,
        status: 'pending'
      };

      const response = await fetch('/api/package-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        alert('Package request submitted successfully! Pending admin verification.');
        router.push('/user-dashboard/my-package');
      } else {
        const errorData = await response.json();
        alert('Failed to submit request: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress size={32} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  if (!packageData) {
    return (
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 6, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: textPrimary, mb: 1, fontWeight: 700 }}>Package Not Found</Typography>
        <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
          The requested package could not be identified.
        </Typography>
        <Button
          component={Link}
          href="/user-dashboard/subscribe"
          variant="contained"
          sx={{ borderRadius: 0, bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700 }}
        >
          Back to Packages
        </Button>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ReceiptLong sx={{ color: '#3b82f6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
                Bank Deposit & Package Request
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                Transfer package funds to one of our corporate bank accounts and submit your receipt for manual verification.
              </Typography>
            </Box>
          </Box>
          <Button
            component={Link}
            href="/user-dashboard/subscribe"
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: 0,
              borderColor: borderCard,
              color: textPrimary,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Back
          </Button>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Selected Package Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 2 }}>
                Selected Tier
              </Typography>
              <Divider sx={{ mb: 2, borderColor: borderCard }} />

              <Paper sx={{ p: 2.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                  Package
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, mb: 1 }}>
                  {packageData.package_name}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#3b82f6' }}>
                  PKR {parseFloat(packageData.package_amount || 0).toLocaleString()}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Direct Commission</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                    PKR {packageData.package_direct_commission || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Indirect Commission</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                    PKR {packageData.package_indirect_commission || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Shopping Wallet Reward</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#06b6d4' }}>
                    PKR {packageData.shopping_amount || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bank Accounts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalance sx={{ color: '#10b981' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                  Deposit Bank Accounts
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, borderColor: borderCard }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 420, overflowY: 'auto' }}>
                {bankAccounts.length > 0 ? (
                  bankAccounts.map((account, index) => (
                    <Paper
                      key={account.id || index}
                      sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                          {account.bank_title}
                        </Typography>
                        <Chip
                          label={`Account #${index + 1}`}
                          size="small"
                          sx={{ borderRadius: 0, bgcolor: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: textSecondary }}>Title:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary }}>{account.account_title}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: textSecondary }}>A/C No:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary, fontFamily: 'monospace' }}>{account.bank_accountno}</Typography>
                        </Box>
                        {account.iban_no && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: textSecondary }}>IBAN:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: textPrimary, fontFamily: 'monospace' }}>{account.iban_no}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: textSecondary, textAlign: 'center', py: 4 }}>
                    No bank accounts listed at the moment. Please contact support.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Submission Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudUpload sx={{ color: '#8b5cf6' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
                  Submit Payment Slip
                </Typography>
              </Box>
              <Divider sx={{ mb: 2.5, borderColor: borderCard }} />

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Transaction ID / Reference *"
                    required
                    fullWidth
                    size="small"
                    value={formData.transactionId}
                    onChange={(e) => handleInputChange('transactionId', e.target.value)}
                    placeholder="e.g. TRX982736412"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />

                  <Box>
                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Payment Slip / Receipt *
                    </Typography>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${borderCard}`,
                        background: bgSubtle,
                        color: textPrimary,
                        fontSize: '0.82rem'
                      }}
                    />
                  </Box>

                  {imagePreview && (
                    <Paper sx={{ p: 1.5, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Image
                        src={imagePreview}
                        alt="Receipt preview"
                        width={64}
                        height={64}
                        style={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>
                          ✓ Image Selected
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => { setImagePreview(''); setSelectedFile(null); }}
                          startIcon={<DeleteOutline sx={{ fontSize: 16 }} />}
                          sx={{ textTransform: 'none', p: 0, fontSize: '0.75rem' }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  <TextField
                    label="Additional Notes (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Sender name, bank branch, or remarks"
                    InputLabelProps={{ sx: { color: textSecondary } }}
                    InputProps={{ sx: { borderRadius: 0, color: textPrimary } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting || !selectedFile}
                    sx={{
                      borderRadius: 0,
                      bgcolor: '#10b981',
                      color: '#ffffff',
                      fontWeight: 800,
                      py: 1.2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    {submitting ? 'Submitting Request...' : 'Submit Package Request'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Card sx={{ bgcolor: bgCard, border: `1px solid ${borderCard}`, borderRadius: 0, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HelpOutline sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary }}>
            Payment Steps & Guidelines
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {[
            { step: '01', title: 'Choose Bank', text: 'Select one of our authorized banking partners above.' },
            { step: '02', title: 'Transfer Funds', text: 'Send the exact amount from your mobile banking app or ATM.' },
            { step: '03', title: 'Save Receipt', text: 'Take a clear screenshot of the digital payment confirmation or receipt slip.' },
            { step: '04', title: 'Admin Verification', text: 'Our finance department inspects and validates the deposit within 2-4 hours.' }
          ].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.step}>
              <Paper sx={{ p: 2, bgcolor: bgSubtle, border: `1px solid ${borderCard}`, borderRadius: 0 }}>
                <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 900 }}>
                  STEP {item.step}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, mt: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5, fontSize: '0.8rem' }}>
                  {item.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
}

export default function PackageRequest() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    }>
      <PackageRequestForm />
    </Suspense>
  );
}

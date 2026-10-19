"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../../../lib/userContext";
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import {
  ShoppingCartCheckout as ShoppingCartCheckoutIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Storefront as StorefrontIcon
} from "@mui/icons-material";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useUser();
  const { isLight } = useAppTheme();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shoppingEligibility, setShoppingEligibility] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);

  const [paymentData, setPaymentData] = useState({
    transactionId: "",
    paymentMethod: "Bank Transfer",
    image: null
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Pakistan",
    zipCode: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
      fetchShoppingEligibility();
      setLoading(false);
    }
  }, [mounted]);

  const fetchShoppingEligibility = async () => {
    try {
      const response = await fetch('/api/user/shopping-eligibility', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setShoppingEligibility(data);
      }
    } catch (error) {
      console.error('Error fetching shopping eligibility:', error);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.sale_price || item.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG).');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });

        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadJson = await uploadRes.json();
        const imageUrl = uploadJson.url;

        setPaymentProof(imageUrl);
        setPaymentData(prev => ({ ...prev, image: imageUrl }));
      } catch (err) {
        console.error('Payment proof upload error:', err);
        alert('Failed to upload payment proof. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.address || !formData.city || 
        !formData.country || !formData.zipCode) {
      alert('Please fill in all shipping fields');
      return;
    }

    if (shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required') {
      if (!paymentProof) {
        alert('Payment proof image is required.');
        return;
      }
      if (!paymentData.transactionId) {
        alert('Transaction ID is required.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const orderData = {
        userId: user?.id,
        items: cart,
        shippingInfo: formData,
        totalAmount: getSubtotal(),
        paymentProof: paymentProof,
        paymentData: paymentData,
        shoppingType: shoppingEligibility?.shopping?.shoppingType || 'standard'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Order placed successfully! Thank you for your purchase.');
          localStorage.removeItem('cart');
          setCart([]);
          router.push('/user-dashboard/orders');
        } else {
          alert('Failed to place order: ' + (result.message || 'Unknown error'));
        }
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your order.');
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";

  if (!mounted || authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (cart.length === 0) {
    return (
      <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: 6, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 1 }}>
          Your Cart is Empty
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
          Add items to your cart before proceeding to checkout.
        </Typography>
        <Button component={Link} href="/user-dashboard/shop" variant="contained" sx={{ borderRadius: 0, backgroundColor: "#6366f1" }}>
          Browse Catalog
        </Button>
      </Card>
    );
  }

  const subtotal = getSubtotal();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <ShoppingCartCheckoutIcon sx={{ color: "#6366f1", fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
            Checkout & Shipping Details
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Enter your delivery address and confirm your order.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column: Shipping Address & Payment Verification */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Delivery Address Card */}
              <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
                <Box sx={{ p: 2, px: 2.5, backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderBottom: cardBorder, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocalShippingIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem", letterSpacing: "0.04em" }}>
                    DELIVERY ADDRESS
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        required
                        label="Contact Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="Street Delivery Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="Country"
                        value={formData.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        label="Postal / Zip Code"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Deposit Proof if required */}
              {shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required' && (
                <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
                  <Box sx={{ p: 2, px: 2.5, backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderBottom: cardBorder, display: "flex", alignItems: "center", gap: 1 }}>
                    <PaymentIcon sx={{ color: "#fbbf24", fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem", letterSpacing: "0.04em" }}>
                      PAYMENT PROOF VERIFICATION
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          required
                          label="Transaction / Reference ID"
                          value={paymentData.transactionId}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ borderRadius: 0 }}>Payment Gateway</InputLabel>
                          <Select
                            value={paymentData.paymentMethod}
                            label="Payment Gateway"
                            onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            sx={{ borderRadius: 0 }}
                          >
                            <MenuItem value="Bank Transfer" sx={{ borderRadius: 0 }}>Bank Transfer</MenuItem>
                            <MenuItem value="JazzCash" sx={{ borderRadius: 0 }}>JazzCash</MenuItem>
                            <MenuItem value="EasyPaisa" sx={{ borderRadius: 0 }}>EasyPaisa</MenuItem>
                            <MenuItem value="Crypto (USDT)" sx={{ borderRadius: 0 }}>Crypto (USDT)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          sx={{ borderRadius: 0, borderColor: isLight ? '#cbd5e1' : '#1e293b', color: textPrimary }}
                        >
                          {uploadingImage ? 'Uploading Image...' : paymentProof ? 'Replace Payment Receipt' : 'Upload Payment Receipt'}
                          <input type="file" hidden accept="image/*" onChange={handlePaymentProofUpload} />
                        </Button>
                        {paymentProof && (
                          <Typography variant="caption" sx={{ color: "#10b981", display: "block", mt: 1, fontWeight: 700 }}>
                            Receipt attached successfully
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Right Column: Order Manifest */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
              <Box sx={{ p: 2, px: 2.5, backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderBottom: cardBorder }}>
                <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem", letterSpacing: "0.04em" }}>
                  CART SUMMARY
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  {cart.map((item) => (
                    <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, noWrap: true }}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary }}>
                          Qty: {item.quantity} × PKR {parseFloat(item.sale_price || item.price).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>
                        PKR {(parseFloat(item.sale_price || item.price) * item.quantity).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 1, borderColor: isLight ? "#e2e8f0" : "#1e293b" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Total Payable</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#10b981" }}>PKR {subtotal.toLocaleString()}</Typography>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      borderRadius: 0,
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      fontWeight: 700,
                      py: 1.3,
                      mt: 1.5,
                      "&:hover": { backgroundColor: "#4f46e5" },
                      "&.Mui-disabled": { backgroundColor: isLight ? "#e2e8f0" : "#1e293b" }
                    }}
                  >
                    {submitting ? 'Processing Dispatch...' : 'Confirm Order & Dispatch'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

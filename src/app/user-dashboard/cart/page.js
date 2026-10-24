"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Divider,
  Paper,
  Stack,
  CircularProgress
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  DeleteOutline as DeleteOutlineIcon,
  ArrowForward as ArrowForwardIcon,
  Storefront as StorefrontIcon,
  ReceiptLong as ReceiptLongIcon
} from "@mui/icons-material";

export default function CartPage() {
  const { isLight } = useAppTheme();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shoppingEligibility, setShoppingEligibility] = useState(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error reading cart:', e);
    }
    fetchShoppingEligibility();
    setLoading(false);
  }, []);

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

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (shoppingEligibility && 
        shoppingEligibility.shopping && 
        shoppingEligibility.shopping.shoppingType === 'package_benefits' &&
        shoppingEligibility.shopping.remainingAmount !== null) {
      
      const newCart = cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      
      const newCartTotal = newCart.reduce((total, item) => {
        const price = parseFloat(item.sale_price || item.price);
        return total + (price * item.quantity);
      }, 0);
      
      const remainingAmount = shoppingEligibility.shopping.remainingAmount;
      if (newCartTotal > remainingAmount) {
        alert(
          `Shopping amount limit reached!\n\n` +
          `Available shopping balance: $${remainingAmount.toFixed(2)}\n` +
          `New cart total: $${newCartTotal.toFixed(2)}`
        );
        return;
      }
    }

    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.sale_price || item.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const subtotal = getSubtotal();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <ShoppingCartIcon sx={{ color: "#6366f1", fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
              Shopping Cart
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Review selected items and proceed to order placement.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            component={Link}
            href="/user-dashboard/orders"
            variant="outlined"
            size="small"
            startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 0,
              borderColor: isLight ? "#cbd5e1" : "#1e293b",
              color: textPrimary,
              fontWeight: 700,
              fontSize: "0.78rem"
            }}
          >
            My Orders
          </Button>
          <Button
            component={Link}
            href="/user-dashboard/shop"
            variant="contained"
            size="small"
            startIcon={<StorefrontIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 0,
              backgroundColor: "#6366f1",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.78rem",
              "&:hover": { backgroundColor: "#4f46e5" }
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>

      {cart.length === 0 ? (
        <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: 6, textAlign: "center" }}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: textSecondary, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 0.5 }}>
            Your Cart is Empty
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            You haven&apos;t added any merchandise items to your cart yet.
          </Typography>
          <Button
            component={Link}
            href="/user-dashboard/shop"
            variant="contained"
            sx={{
              borderRadius: 0,
              backgroundColor: "#6366f1",
              color: "#fff",
              fontWeight: 700,
              px: 3,
              "&:hover": { backgroundColor: "#4f46e5" }
            }}
          >
            Browse Products Catalog
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Cart Items List */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={2}>
              {cart.map((item) => {
                const itemPrice = parseFloat(item.sale_price || item.price);
                const itemTotal = itemPrice * item.quantity;

                return (
                  <Card key={item.id} sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Box sx={{ width: 80, height: 80, backgroundColor: isLight ? "#f1f5f9" : "#080d19", border: cardBorder, flexShrink: 0 }}>
                          <img
                            src={item.image || '/placeholder-product.jpg'}
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary, noWrap: true }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textSecondary, display: "block", mb: 0.8 }}>
                            Unit Price: ${itemPrice.toFixed(2)}
                          </Typography>

                          {/* Stepper Controls */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", border: cardBorder }}>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                sx={{ borderRadius: 0, p: 0.5, color: textPrimary }}
                              >
                                <RemoveIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              <Typography sx={{ px: 1.5, fontSize: "0.82rem", fontWeight: 700, color: textPrimary }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                sx={{ borderRadius: 0, p: 0.5, color: textPrimary }}
                              >
                                <AddIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>

                            <IconButton
                              size="small"
                              onClick={() => removeFromCart(item.id)}
                              sx={{ borderRadius: 0, color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", p: 0.5 }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#10b981" }}>
                            ${itemTotal.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          {/* Cart Summary Card */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
              <Box sx={{ p: 2, px: 2.5, backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderBottom: cardBorder }}>
                <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem", letterSpacing: "0.04em" }}>
                  ORDER SUMMARY
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: textSecondary }}>Subtotal ({cart.length} items)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>${subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: textSecondary }}>Shipping & Handling</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>Complimentary</Typography>
                  </Box>

                  <Divider sx={{ my: 1, borderColor: isLight ? "#e2e8f0" : "#1e293b" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary }}>Total Payable</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#10b981" }}>${subtotal.toFixed(2)}</Typography>
                  </Box>

                  <Button
                    component={Link}
                    href="/user-dashboard/checkout"
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: 0,
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      fontWeight: 700,
                      py: 1.2,
                      mt: 1.5,
                      "&:hover": { backgroundColor: "#4f46e5" }
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

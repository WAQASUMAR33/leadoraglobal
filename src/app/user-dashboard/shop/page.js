"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { UserContext } from '../../../lib/userContext';
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  Badge
} from "@mui/material";
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Storefront as StorefrontIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  LocalOffer as LocalOfferIcon,
  ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";

export default function ShopPage() {
  const context = useContext(UserContext);
  const { isLight } = useAppTheme();
  const [products, setProducts] = useState([
    {
      id: 1,
      title: "Hair Regrow Shampoo",
      image: "https://steelblue-cod-355377.hostingersite.com/uploads/68ccd1509a0f2.jpeg",
      price: "3000",
      description: "100% Organic Hair Re-Grow Shampoo",
      status: "active"
    },
    {
      id: 7,
      title: "Leadora Elixir Perfume For Women's",
      image: "https://steelblue-cod-355377.hostingersite.com/uploads/6ab77cf8a5042.jpeg",
      price: "9500",
      description: "Timeless Fragrance of Elegance",
      status: "active"
    },
    {
      id: 9,
      title: "Leadora Creed Perfume for Men's",
      image: "https://steelblue-cod-355377.hostingersite.com/uploads/6ab77cc79c029.jpeg",
      price: "9500",
      description: "Signature Premium Masculine Fragrance",
      status: "active"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [shoppingEligibility, setShoppingEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchShoppingEligibility();
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }

    // Default products fallback
    setProducts([
      {
        id: 1,
        title: "Hair Regrow Shampoo",
        image: "https://steelblue-cod-355377.hostingersite.com/uploads/68ccd1509a0f2.jpeg",
        price: "3000",
        description: "100% Organic Hair Re-Grow Shampoo",
        status: "active"
      },
      {
        id: 7,
        title: "Leadora Elixir Perfume For Women's",
        image: "https://steelblue-cod-355377.hostingersite.com/uploads/6ab77cf8a5042.jpeg",
        price: "9500",
        description: "Timeless Fragrance of Elegance",
        status: "active"
      },
      {
        id: 9,
        title: "Leadora Creed Perfume for Men's",
        image: "https://steelblue-cod-355377.hostingersite.com/uploads/6ab77cc79c029.jpeg",
        price: "9500",
        description: "Signature Premium Masculine Fragrance",
        status: "active"
      }
    ]);
  };

  const fetchShoppingEligibility = async () => {
    try {
      setEligibilityLoading(true);
      const response = await fetch('/api/user/shopping-eligibility', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShoppingEligibility(data);
      } else {
        setShoppingEligibility({
          success: false,
          eligible: false,
          reason: 'error',
          message: 'Unable to check shopping eligibility'
        });
      }
    } catch (error) {
      console.error('Error fetching shopping eligibility:', error);
      setShoppingEligibility({
        success: false,
        eligible: false,
        reason: 'error',
        message: 'Unable to check shopping eligibility'
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.sale_price || item.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const addToCart = (product) => {
    try {
      if (shoppingEligibility && !shoppingEligibility.eligible) {
        alert(
          `Shopping Not Available!\n\n` +
          `Your package (${shoppingEligibility.package?.name}) does not include shopping benefits.\n\n` +
          `Please upgrade your package to shop.`
        );
        return;
      }

      if (shoppingEligibility && 
          shoppingEligibility.shopping && 
          shoppingEligibility.shopping.shoppingType === 'package_benefits' &&
          shoppingEligibility.shopping.remainingAmount !== null) {
        
        const currentCartTotal = getCartTotal();
        const productPrice = parseFloat(product.sale_price || product.price);
        const newCartTotal = currentCartTotal + productPrice;
        const remainingAmount = shoppingEligibility.shopping.remainingAmount;
        
        if (newCartTotal > remainingAmount) {
          const maxCanAdd = Math.max(0, remainingAmount - currentCartTotal);
          alert(
            `Shopping amount limit reached!\n\n` +
            `Available shopping amount: PKR ${remainingAmount.toFixed(2)}\n` +
            `Current cart total: PKR ${currentCartTotal.toFixed(2)}\n` +
            `You can add products worth: PKR ${maxCanAdd.toFixed(2)}\n\n` +
            `This product costs: PKR ${productPrice.toFixed(2)}`
          );
          return;
        }
      }

      const existingItem = cart.find(item => item.id === product.id);
      let updatedCart;
      if (existingItem) {
        updatedCart = cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...cart, { ...product, quantity: 1 }];
      }
      setCart(updatedCart);
      if (mounted) {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const filteredProducts = products.filter(p =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Color tokens
  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={44} sx={{ color: '#6366f1' }} />
        <Typography sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.85rem' }}>
          LOADING PRODUCT CATALOG...
        </Typography>
      </Box>
    );
  }

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Catalog Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <StorefrontIcon sx={{ color: "#6366f1", fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
              Member Merchandise Catalog
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Redeem products using your Shopping Wallet balance or direct package allocations.
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/user-dashboard/cart"
          variant="contained"
          startIcon={
            <Badge badgeContent={totalCartCount} color="error" sx={{ '& .MuiBadge-badge': { borderRadius: 0 } }}>
              <ShoppingCartIcon sx={{ fontSize: 18 }} />
            </Badge>
          }
          sx={{
            borderRadius: 0,
            backgroundColor: "#6366f1",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.82rem",
            px: 2.5,
            py: 1,
            "&:hover": { backgroundColor: "#4f46e5" },
          }}
        >
          View Cart (${getCartTotal().toFixed(2)})
        </Button>
      </Box>

      {/* Shopping Benefit Allocation Status Card */}
      {!eligibilityLoading && shoppingEligibility && shoppingEligibility.shopping && (
        <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, borderLeft: "4px solid #10b981", p: 2.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                Active Shopping Allowance: {shoppingEligibility.package?.name || 'Standard Tier'}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                Available shopping credits allocated from your package subscription.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: textSecondary, display: "block" }}>Package Total</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                  ${parseFloat(shoppingEligibility.package?.shoppingAmount || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textSecondary, display: "block" }}>Consumed</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#f87171" }}>
                  ${parseFloat(shoppingEligibility.shopping.totalSpent || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textSecondary, display: "block" }}>Available</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10b981" }}>
                  ${parseFloat(shoppingEligibility.shopping.remainingAmount || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Search Filter Card */}
      <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search merchandise catalog by product title, specs, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: textSecondary, fontSize: 20 }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.02)",
                color: textPrimary,
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => {
          const price = parseFloat(product.price || 0);
          const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
          const discount = product.discount;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card
                sx={{
                  borderRadius: 0,
                  backgroundColor: cardBg,
                  border: cardBorder,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s, border-color 0.15s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: "#6366f1",
                  }
                }}
              >
                {/* Product Image Box */}
                <Box sx={{ position: "relative", height: 180, width: "100%", backgroundColor: isLight ? "#f1f5f9" : "#080d19", borderBottom: cardBorder }}>
                  <img
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  {discount && (
                    <Chip
                      icon={<LocalOfferIcon sx={{ fontSize: '12px !important', color: '#fff' }} />}
                      label={discount}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        borderRadius: 0,
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "0.68rem"
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.95rem", lineHeight: 1.3, mb: 0.5 }}>
                      {product.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: "0.8rem", height: 38, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {product.description || "Premium Ledora corporate catalog product."}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>
                        PKR {(salePrice || price).toLocaleString()}
                      </Typography>
                      {salePrice && (
                        <Typography variant="caption" sx={{ color: textSecondary, textDecoration: "line-through" }}>
                          PKR {price.toLocaleString()}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => addToCart(product)}
                      startIcon={<AddShoppingCartIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 0,
                        backgroundColor: "#6366f1",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 0.9,
                        "&:hover": { backgroundColor: "#4f46e5" },
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

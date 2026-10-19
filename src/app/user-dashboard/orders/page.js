"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "../../../lib/userContext";
import { useAppTheme } from "@/context/AdminThemeContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Paper
} from "@mui/material";
import {
  ReceiptLong as ReceiptLongIcon,
  Storefront as StorefrontIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";

export default function OrdersPage() {
  const { user, loading: authLoading, error: authError, isAuthenticated } = useUser();
  const { isLight } = useAppTheme();
  const [orders, setOrders] = useState([
    {
      id: 1042,
      totalAmount: 9500,
      status: "delivered",
      createdAt: "2026-10-14T10:00:00.000Z",
      orderItems: [
        {
          quantity: 1,
          price: 9500,
          product: {
            title: "Leadora Creed Perfume for Men's",
            image: "https://steelblue-cod-355377.hostingersite.com/uploads/6ab77cc79c029.jpeg"
          }
        }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/orders?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (mounted) {
      fetchOrders();
    }
  }, [mounted, fetchOrders]);

  const getStatusChip = (status) => {
    const s = (status || 'pending').toLowerCase();
    let color = '#f59e0b';
    let bg = 'rgba(245, 158, 11, 0.12)';
    let border = '1px solid rgba(245, 158, 11, 0.3)';

    if (s === 'delivered' || s === 'completed') {
      color = '#10b981';
      bg = 'rgba(16, 185, 129, 0.12)';
      border = '1px solid rgba(16, 185, 129, 0.3)';
    } else if (s === 'shipped' || s === 'processing') {
      color = '#38bdf8';
      bg = 'rgba(56, 189, 248, 0.12)';
      border = '1px solid rgba(56, 189, 248, 0.3)';
    } else if (s === 'cancelled' || s === 'rejected') {
      color = '#ef4444';
      bg = 'rgba(239, 68, 68, 0.12)';
      border = '1px solid rgba(239, 68, 68, 0.3)';
    }

    return (
      <Chip
        label={s.toUpperCase()}
        size="small"
        sx={{
          borderRadius: 0,
          fontWeight: 800,
          fontSize: '0.68rem',
          letterSpacing: '0.04em',
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

  const cardBg = isLight ? "#ffffff" : "#0c1220";
  const cardBorder = isLight ? "1px solid #e2e8f0" : "1px solid #1e293b";
  const textPrimary = isLight ? "#0f172a" : "#f8fafc";
  const textSecondary = isLight ? "#475569" : "#94a3b8";

  if (!mounted || authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
        <Typography sx={{ color: textSecondary, fontWeight: 700, fontSize: '0.85rem' }}>
          LOADING ORDERS ARCHIVE...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <ReceiptLongIcon sx={{ color: "#6366f1", fontSize: 26 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: "-0.02em" }}>
              My Order Tracking
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Review your historical merchandise acquisitions, fulfillment milestones, and delivery tracking.
          </Typography>
        </Box>

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
            fontSize: "0.82rem",
            px: 2.5,
            py: 1,
            "&:hover": { backgroundColor: "#4f46e5" }
          }}
        >
          Browse Catalog
        </Button>
      </Box>

      {orders.length === 0 ? (
        <Card sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder, p: 6, textAlign: "center" }}>
          <ReceiptLongIcon sx={{ fontSize: 48, color: textSecondary, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: textPrimary, mb: 0.5 }}>
            No Orders Placed Yet
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
            You haven&apos;t completed any merchandise orders. Browse our corporate catalog to get started.
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
              "&:hover": { backgroundColor: "#4f46e5" }
            }}
          >
            Explore Catalog
          </Button>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {orders.map((order) => (
            <Card key={order.id} sx={{ borderRadius: 0, backgroundColor: cardBg, border: cardBorder }}>
              {/* Order Header */}
              <Box sx={{ p: 2, px: 2.5, backgroundColor: isLight ? "#f8fafc" : "#0f172a", borderBottom: cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                    Order #{order.orderNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>
                    Placed on {formatDate(order.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {getStatusChip(order.status)}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#10b981" }}>
                    PKR {parseFloat(order.totalAmount).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Order Items */}
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  {order.orderItems?.map((item) => (
                    <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ width: 56, height: 56, backgroundColor: isLight ? "#f1f5f9" : "#080d19", border: cardBorder, flexShrink: 0 }}>
                        <img
                          src={item.product?.image || '/placeholder-product.jpg'}
                          alt={item.product?.title || 'Product'}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, noWrap: true }}>
                          {item.product?.title || 'Merchandise Item'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary }}>
                          Quantity: {item.quantity} × PKR {parseFloat(item.price).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>
                        PKR {(parseFloat(item.price) * item.quantity).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

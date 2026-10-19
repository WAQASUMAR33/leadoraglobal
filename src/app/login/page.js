"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../../lib/userContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Collapse,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  LockOutlined,
  ArrowForward,
  TrendingUp,
  Storefront,
  AccountBalanceWallet,
  CheckCircle,
} from "@mui/icons-material";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
      usernameInput.focus();
    }
  }, []);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const updateField = (field) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case "username":
        if (!value || !value.trim()) return "Username is required";
        if (value.trim().length < 3) return "Username must be at least 3 characters";
        return "";
      case "password":
        if (!value) return "Password is required";
        return "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid username or password. Please try again.");
      } else {
        setMessage("Login successful! Redirecting to your dashboard...");
        login(data.user, data.token);
        setForm({ username: "", password: "" });
        setTimeout(() => {
          router.push("/user-dashboard");
        }, 1200);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the server. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #070a12 0%, #0d1322 50%, #111a2e 100%)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Left Column - Desktop Branding (hidden on mobile) */}
      <Box
        sx={{
          width: "50%",
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          px: { lg: 6, xl: 8 },
          py: 6,
          position: "relative",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Image
            src="/leadora_global.jpg"
            alt="Ledora Global"
            width={320}
            height={200}
            style={{
              maxWidth: "320px",
              height: "auto",
              borderRadius: "0px",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            priority
          />
        </Box>

        <Typography
          variant="h6"
          sx={{
            mb: 4.5,
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 460,
            fontSize: "1rem",
            color: "#94a3b8",
            fontWeight: 500,
          }}
        >
          Sign in to access your member account, manage packages, monitor team earnings, and shop through our online catalog.
        </Typography>

        {/* 3 Real Feature Cards */}
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 420 }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "4px solid #6366f1",
            }}
          >
            <TrendingUp sx={{ color: "#818cf8", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                Multi-Level Commission Tracking
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Track direct referral bonuses and downline team matching rewards.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "4px solid #06b6d4",
            }}
          >
            <Storefront sx={{ color: "#22d3ee", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                E-Commerce Shopping Wallet
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Redeem shopping wallet points on health, beauty, and wellness products.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "4px solid #10b981",
            }}
          >
            <AccountBalanceWallet sx={{ color: "#34d399", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                Fast Local Withdrawals
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Direct bank wire, JazzCash, and EasyPaisa account payout disbursal.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Right Column - Login Form (Full width on mobile) */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Mobile Brand Logo */}
          <Box
            sx={{
              display: { xs: "flex", lg: "none" },
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
              textAlign: "center",
            }}
          >
            <Image
              src="/leadora_global.jpg"
              alt="Ledora Global"
              width={160}
              height={100}
              style={{
                borderRadius: "0px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                marginBottom: "12px",
              }}
              priority
            />
            <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              Sign in with your username to access your account
            </Typography>
          </Box>

          {/* Login Card */}
          <Card
            sx={{
              width: "100%",
              borderRadius: 0,
              backgroundColor: "rgba(12, 18, 32, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderTop: "4px solid #6366f1",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "1.5rem", sm: "1.75rem" },
                    letterSpacing: "-0.02em",
                    color: "#f8fafc",
                    mb: 0.5,
                  }}
                >
                  Member Sign In
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                  Enter your credentials to access your dashboard.
                </Typography>
              </Box>

              {/* Success / Error Alerts */}
              <Collapse in={!!message || !!error}>
                <Box sx={{ mb: 2.5 }}>
                  {message && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle fontSize="inherit" />}
                      sx={{
                        borderRadius: 0,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {message}
                    </Alert>
                  )}
                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 0,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                </Box>
              </Collapse>

              {/* Login Form */}
              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2.2}>
                  {/* Username Field */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 0.6,
                        fontWeight: 700,
                        color: "#cbd5e1",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Username
                    </Typography>
                    <TextField
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      value={form.username}
                      onChange={updateField("username")}
                      fullWidth
                      size="small"
                      disabled={loading}
                      error={!!errors.username}
                      helperText={errors.username}
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.7)",
                            color: "#f8fafc",
                            fontSize: "0.9rem",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
                            "&:hover fieldset": { borderColor: "#6366f1" },
                            "&.Mui-focused fieldset": { borderColor: "#818cf8" },
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutline sx={{ color: "#818cf8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* Password Field */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: "#cbd5e1",
                          fontSize: "0.78rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Password
                      </Typography>
                      <Link
                        href="/forgot-password"
                        style={{
                          color: "#818cf8",
                          fontSize: "0.78rem",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        Forgot password?
                      </Link>
                    </Stack>
                    <TextField
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={updateField("password")}
                      fullWidth
                      size="small"
                      disabled={loading}
                      error={!!errors.password}
                      helperText={errors.password}
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.7)",
                            color: "#f8fafc",
                            fontSize: "0.9rem",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
                            "&:hover fieldset": { borderColor: "#6366f1" },
                            "&.Mui-focused fieldset": { borderColor: "#818cf8" },
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined sx={{ color: "#818cf8", fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                                sx={{ color: "#94a3b8" }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* Remember Me */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          color: "#64748b",
                          "&.Mui-checked": { color: "#6366f1" },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                        Remember me on this device
                      </Typography>
                    }
                    sx={{ ml: -0.5 }}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.3,
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      borderRadius: 0,
                      backgroundColor: "#6366f1",
                      boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                      "&:hover": {
                        backgroundColor: "#4f46e5",
                        boxShadow: "0 6px 25px rgba(99, 102, 241, 0.6)",
                      },
                    }}
                    endIcon={loading ? null : <ArrowForward sx={{ fontSize: 18 }} />}
                  >
                    {loading ? (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={18} color="inherit" />
                        <span>Verifying...</span>
                      </Stack>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* Sign up prompt */}
              <Box sx={{ textAlign: "center", mt: 3, pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    style={{
                      color: "#818cf8",
                      textDecoration: "none",
                      fontWeight: 800,
                    }}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>

              {/* Mandatory RapidTechPro Attribution */}
              <Box sx={{ mt: 2.5, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
                  Powerd By :{" "}
                  <a
                    href="https://rapidtechpro.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#818cf8",
                      textDecoration: "none",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}
                  >
                    RAPIDTECHPRO
                  </a>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#070a12",
          }}
        >
          <CircularProgress sx={{ color: "#6366f1" }} />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

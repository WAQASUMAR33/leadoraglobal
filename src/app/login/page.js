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
  Divider,
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
  AdminPanelSettings,
} from "@mui/icons-material";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  // form state
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});

  // Auto-focus username field on mount
  useEffect(() => {
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
      usernameInput.focus();
    }
  }, []);

  // Clear messages after 6 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Update form field
  const updateField = (field) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [field]: value });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Validation functions
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

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!validateForm()) {
      return;
    }

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

        // Store user data using UserContext
        login(data.user, data.token);

        // Clear form
        setForm({
          username: "",
          password: "",
        });

        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/user-dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #172033 100%)",
        position: "relative",
      }}
    >
      {/* Left Half - Logo, Branding & Feature Showcase */}
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
        }}
      >
        {/* Ledora Global Image - Square sharp corners */}
        <Box sx={{ mb: 4 }}>
          <Image
            src="/leadora_global.jpg"
            alt="Ledora Global"
            width={340}
            height={220}
            style={{
              maxWidth: "340px",
              height: "auto",
              borderRadius: "0px",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            priority
          />
        </Box>

        {/* Tagline */}

        <Typography
          variant="h6"
          sx={{
            mb: 5,
            opacity: 0.85,
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 480,
            fontSize: "1.05rem",
            color: "#94a3b8",
          }}
        >
          Sign in to your account to access your dashboard, manage packages, track network commissions,
          and explore our direct e-commerce platform.
        </Typography>

        {/* 3 Crisp Value Cards - Sharp Corners */}
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 440 }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 0,
              backgroundColor: "rgba(30, 41, 59, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #6366f1",
            }}
          >
            <TrendingUp sx={{ color: "#818cf8", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Multi-Tier Commission Engine
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Real-time upline and downline commission tracking.
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
              backgroundColor: "rgba(30, 41, 59, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #06b6d4",
            }}
          >
            <Storefront sx={{ color: "#22d3ee", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Integrated E-Commerce Wallet
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Redeem shopping points directly on catalog products.
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
              backgroundColor: "rgba(30, 41, 59, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #10b981",
            }}
          >
            <AccountBalanceWallet sx={{ color: "#34d399", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Verified PKR Withdrawals
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Fast payouts via JazzCash, EasyPaisa, or Bank Wire.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Right Half - Login Form */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.5, sm: 5, md: 8 },
          py: 6,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 460 }}>
          {/* Mobile Logo & Title */}
          <Box
            sx={{
              display: { xs: "flex", lg: "none" },
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
              textAlign: "center",
            }}
          >
            <Image
              src="/leadora_global.jpg"
              alt="Ledora Global"
              width={180}
              height={110}
              style={{
                borderRadius: "0px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "16px",
              }}
              priority
            />
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Sign in with your username to continue
            </Typography>
          </Box>

          {/* Login Card - Sharp Corners & Rich Aesthetics */}
          <Card
            sx={{
              width: "100%",
              borderRadius: 0,
              backgroundColor: "rgba(13, 19, 33, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px -10px rgba(99, 102, 241, 0.18)",
            }}
          >
            {/* Top Multi-Color Accent Gradient Bar */}
            <Box
              sx={{
                height: 3,
                width: "100%",
                background: "linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #a855f7 100%)",
              }}
            />

            <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
              {/* Card Header with Pill Badge */}
              <Box sx={{ mb: 3.5 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    py: 0.4,
                    mb: 1.5,
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#818cf8",
                      borderRadius: 0,
                      boxShadow: "0 0 8px #818cf8",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#818cf8",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Member Authentication
                  </Typography>
                </Box>

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.75rem", sm: "2rem" },
                    letterSpacing: "-0.02em",
                    background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 70%, #94a3b8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 0.5,
                  }}
                >
                  Sign In
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.925rem" }}>
                  Enter your credentials to access your dashboard.
                </Typography>
              </Box>

              {/* Success / Error Alerts */}
              <Collapse in={!!message || !!error}>
                <Box sx={{ mb: 3 }}>
                  {message && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle fontSize="inherit" />}
                      sx={{
                        borderRadius: 0,
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: "#34d399",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderLeft: "4px solid #10b981",
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
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderLeft: "4px solid #ef4444",
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                </Box>
              </Collapse>

              {/* Login Form */}
              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2.5}>
                  {/* Username Field */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 0.75,
                        fontWeight: 600,
                        color: "#cbd5e1",
                        fontSize: "0.8rem",
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
                      disabled={loading}
                      error={!!errors.username}
                      helperText={errors.username}
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.65)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                            },
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutline
                                sx={{
                                  color: errors.username ? "error.main" : "#818cf8",
                                  fontSize: 22,
                                }}
                              />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* Password Field */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                        }}
                      >
                        Password
                      </Typography>
                      <Link
                        href="/forgot-password"
                        style={{
                          color: "#818cf8",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        Forgot password?
                      </Link>
                    </Stack>
                    <TextField
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={updateField("password")}
                      fullWidth
                      disabled={loading}
                      error={!!errors.password}
                      helperText={errors.password}
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.65)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                            },
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined
                                sx={{
                                  color: errors.password ? "error.main" : "#818cf8",
                                  fontSize: 22,
                                }}
                              />
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
                          "&.Mui-checked": {
                            color: "#6366f1",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                        Remember me on this browser
                      </Typography>
                    }
                    sx={{ ml: -0.5, mt: -0.5 }}
                  />

                  {/* Submit Button - Sharp, Gradient & Glowing */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.6,
                      fontSize: "1.025rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      borderRadius: 0,
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)",
                      boxShadow: "0 8px 25px -4px rgba(99, 102, 241, 0.5)",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #2563eb 100%)",
                        boxShadow: "0 12px 30px -4px rgba(99, 102, 241, 0.7)",
                        transform: "translateY(-1px)",
                      },
                    }}
                    endIcon={
                      loading ? null : (
                        <ArrowForward
                          sx={{
                            transition: "transform 0.2s ease-in-out",
                            ".MuiButton-root:hover &": {
                              transform: "translateX(5px)",
                            },
                          }}
                        />
                      )
                    }
                  >
                    {loading ? (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={20} color="inherit" />
                        <span>Verifying Credentials...</span>
                      </Stack>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* Sign up prompt */}
              <Box sx={{ textAlign: "center", mt: 3, pt: 2.5, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    style={{
                      color: "#818cf8",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>

              {/* Powered By Footer */}
              <Box sx={{ mt: 2.5, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.8rem" }}>
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
            backgroundColor: "#080c14",
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

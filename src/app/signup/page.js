"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
  Collapse,
  Divider,
} from "@mui/material";
import {
  PersonOutline,
  LockOutlined,
  EmailOutlined,
  PhoneOutlined,
  GroupOutlined,
  Visibility,
  VisibilityOff,
  ArrowForward,
  TrendingUp,
  Storefront,
  AccountBalanceWallet,
  CheckCircle,
  AdminPanelSettings,
  ShieldOutlined,
  VerifiedUser,
} from "@mui/icons-material";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // form state
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});
  const [referralValidation, setReferralValidation] = useState({
    isValidating: false,
    isValid: false,
    referrerName: "",
    message: "",
  });

  // Auto-focus full name field on mount
  useEffect(() => {
    const fullNameInput = document.getElementById("fullName");
    if (fullNameInput) {
      fullNameInput.focus();
    }
  }, []);

  // Validate referral code
  const validateReferralCode = useCallback(async (referralCode) => {
    if (!referralCode || referralCode.length < 3) return;

    setReferralValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch("/api/validate-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setReferralValidation({
          isValidating: false,
          isValid: true,
          referrerName: data.referrer.fullname,
          message: data.message,
        });
        setErrors((prev) => ({ ...prev, referralCode: "" }));
      } else {
        setReferralValidation({
          isValidating: false,
          isValid: false,
          referrerName: "",
          message: data.message,
        });
        setErrors((prev) => ({ ...prev, referralCode: data.message }));
      }
    } catch (err) {
      console.error("Error validating referral code:", err);
      setReferralValidation({
        isValidating: false,
        isValid: false,
        referrerName: "",
        message: "Error validating referral code. Please check your connection.",
      });
    }
  }, []);

  // Check for referral code in URL params
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setForm((prev) => ({ ...prev, referralCode: refCode }));
      validateReferralCode(refCode.toLowerCase());
    }
  }, [searchParams, validateReferralCode]);

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

    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }

    if (field === "referralCode" && value.length >= 3) {
      validateReferralCode(value.toLowerCase());
    } else if (field === "referralCode" && value.length < 3) {
      setReferralValidation({
        isValidating: false,
        isValid: false,
        referrerName: "",
        message: "",
      });
    }
  };

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case "fullName":
        if (!value || !value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Full name must be at least 2 characters";
        return "";

      case "username":
        if (!value || !value.trim()) return "Username is required";
        if (value.trim().length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Only letters, numbers, and underscores allowed";
        return "";

      case "email":
        if (!value || !value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        return "";

      case "phoneNumber":
        if (!value || !value.trim()) return "Phone number is required";
        if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value)) return "Please enter a valid phone number";
        return "";

      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== form.password) return "Passwords do not match";
        return "";

      case "referralCode":
        if (!value || !value.trim()) return "Referral sponsor is required";
        if (value.trim().length < 3) return "Referral code must be at least 3 characters";
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!referralValidation.isValid) {
      setError("Please provide a valid verified referral sponsor code to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          referralCode: form.referralCode.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Registration failed. Please check your data and try again.");
      } else {
        setMessage("Account created successfully! Redirecting you to login...");

        setForm({
          fullName: "",
          username: "",
          email: "",
          phoneNumber: "",
          referralCode: "",
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Signup error:", err);
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
        background: "linear-gradient(135deg, #070a12 0%, #0d1322 50%, #131c30 100%)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Left Half - Logo, Branding & Value Proposition */}
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
        {/* Ledora Global Image - Sharp Corners */}
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
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
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
          Create your verified account and start your journey with Ledora Global. Access exclusive packages,
          earn multi-level rewards, and build a rewarding business network.
        </Typography>

        {/* 3 Value Cards - Sharp Corners */}
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
                Automatic calculation and upline distribution on activations.
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
                Redeem shopping credits for physical products seamlessly.
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
                Fast cashouts via JazzCash, EasyPaisa, or Direct Bank Wire.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Right Half - Ultra-Beautiful Modern Signup Form */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 4, md: 6, xl: 8 },
          py: { xs: 4, md: 6 },
          position: "relative",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 560 }}>
          {/* Mobile Header Branding */}
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
                marginBottom: "14px",
              }}
              priority
            />
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Create your account to get started
            </Typography>
          </Box>

          {/* Premium Signup Card - Sharp Corners & Rich Aesthetics */}
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.4,
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
                      Member Registration
                    </Typography>
                  </Box>
                </Stack>

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
                  Create Account
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.925rem" }}>
                  Join thousands of members growing with Ledora Global.
                </Typography>
              </Box>

              {/* Feedback Alerts */}
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

              {/* Form Controls */}
              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2.25}>
                  {/* Row 1: Full Name & Username */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Full Name
                      </Typography>
                      <TextField
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        value={form.fullName}
                        onChange={updateField("fullName")}
                        fullWidth
                        disabled={loading}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
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
                                    color: errors.fullName ? "error.main" : "#818cf8",
                                    fontSize: 20,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Username
                      </Typography>
                      <TextField
                        id="username"
                        name="username"
                        placeholder="johndoe77"
                        value={form.username}
                        onChange={updateField("username")}
                        fullWidth
                        disabled={loading}
                        error={!!errors.username}
                        helperText={errors.username || "Login ID & referral code"}
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
                                    fontSize: 20,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Row 2: Email & Phone Number */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Email Address
                      </Typography>
                      <TextField
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={updateField("email")}
                        fullWidth
                        disabled={loading}
                        error={!!errors.email}
                        helperText={errors.email}
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
                                <EmailOutlined
                                  sx={{
                                    color: errors.email ? "error.main" : "#818cf8",
                                    fontSize: 20,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Phone Number
                      </Typography>
                      <TextField
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="03001234567"
                        value={form.phoneNumber}
                        onChange={updateField("phoneNumber")}
                        fullWidth
                        disabled={loading}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber}
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
                                <PhoneOutlined
                                  sx={{
                                    color: errors.phoneNumber ? "error.main" : "#818cf8",
                                    fontSize: 20,
                                  }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Row 3: Referral Sponsor Code with Verification Showcase */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.65 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Referral Sponsor Code
                      </Typography>
                      {referralValidation.isValid && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#34d399",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontSize: "0.75rem",
                          }}
                        >
                          <CheckCircle sx={{ fontSize: 14 }} /> Verified Sponsor
                        </Typography>
                      )}
                    </Stack>
                    <TextField
                      id="referralCode"
                      name="referralCode"
                      placeholder="Enter sponsor username (e.g. admin)"
                      value={form.referralCode}
                      onChange={updateField("referralCode")}
                      fullWidth
                      disabled={loading}
                      error={!!errors.referralCode}
                      helperText={
                        referralValidation.isValidating
                          ? "Checking sponsor in database..."
                          : referralValidation.isValid
                          ? `Registered under ${referralValidation.referrerName}`
                          : errors.referralCode || "Required sponsor username to join network"
                      }
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.65)",
                            borderColor: referralValidation.isValid ? "rgba(16, 185, 129, 0.5)" : undefined,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                            },
                          },
                          startAdornment: (
                            <InputAdornment position="start">
                              <GroupOutlined
                                sx={{
                                  color: referralValidation.isValid
                                    ? "#10b981"
                                    : errors.referralCode
                                    ? "error.main"
                                    : "#818cf8",
                                  fontSize: 20,
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: referralValidation.isValidating ? (
                            <InputAdornment position="end">
                              <CircularProgress size={18} sx={{ color: "#6366f1" }} />
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />

                    {/* Verified Sponsor Box - Sharp & High-End */}
                    {referralValidation.isValid && (
                      <Box
                        sx={{
                          mt: 1.25,
                          p: 1.5,
                          backgroundColor: "rgba(16, 185, 129, 0.08)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderLeft: "3px solid #10b981",
                          borderRadius: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <VerifiedUser sx={{ color: "#34d399", fontSize: 20 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94a3b8", display: "block", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 700 }}
                            >
                              Confirmed Sponsor
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#f8fafc", fontWeight: 700, fontSize: "0.9rem" }}>
                              {referralValidation.referrerName}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 600, fontSize: "0.75rem" }}>
                          Active Node
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Row 4: Password & Confirm Password */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Password
                      </Typography>
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
                        helperText={errors.password || "Min. 6 characters"}
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
                                    fontSize: 20,
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

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.65,
                          fontWeight: 600,
                          color: "#cbd5e1",
                          fontSize: "0.8rem",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Confirm Password
                      </Typography>
                      <TextField
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={form.confirmPassword}
                        onChange={updateField("confirmPassword")}
                        fullWidth
                        disabled={loading}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
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
                                    color: errors.confirmPassword ? "error.main" : "#818cf8",
                                    fontSize: 20,
                                  }}
                                />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: "#94a3b8" }}
                                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                  {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Submit Button - Sharp, Gradient & Glowing */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 1.5,
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
                            transition: "transform 0.2s ease",
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
                        <span>Creating Your Account...</span>
                      </Stack>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* Sign in prompt */}
              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                  pt: 2.5,
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  Already registered with Ledora?{" "}
                  <Link
                    href="/login"
                    style={{
                      color: "#818cf8",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Sign in to your account
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

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}

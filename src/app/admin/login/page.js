"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/material";
import {
  AdminPanelSettings,
  LockOutlined,
  PersonOutline,
  Visibility,
  VisibilityOff,
  ArrowForward,
  Security,
  Dns,
  ManageAccounts,
  CheckCircle,
  ArrowBack,
} from "@mui/icons-material";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        localStorage.setItem("adminToken", data.token);
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Invalid administrative credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during authentication. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Left Half - Logo, Branding & Administrative Overview */}
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
          Administrative dashboard access. Review member packages, process withdrawal requests,
          monitor downline networks, and oversee platform finances.
        </Typography>

        {/* 3 Admin Control Cards - Sharp Corners */}
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
              borderLeft: "3px solid #8b5cf6",
            }}
          >
            <Security sx={{ color: "#a78bfa", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Role-Based Access Control
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Protected with secure administrator authentication.
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
            <ManageAccounts sx={{ color: "#22d3ee", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Approvals & Member Oversight
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Review package activations, downline trees, and KYC requests.
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
            <Dns sx={{ color: "#34d399", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                Financial Clearing & Payouts
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Process JazzCash, EasyPaisa, and Direct Bank transfers.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Right Half - Ultra-Beautiful Modern Admin Login Form */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 4, md: 8 },
          py: { xs: 4, md: 6 },
          position: "relative",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 460 }}>
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
                marginBottom: "12px",
              }}
              priority
            />
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Administrator Sign In
            </Typography>
          </Box>

          {/* Admin Login Card - Sharp Corners & Rich Aesthetics */}
          <Card
            sx={{
              width: "100%",
              borderRadius: 0,
              backgroundColor: "rgba(13, 19, 33, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px -10px rgba(139, 92, 246, 0.18)",
            }}
          >
            {/* Top Multi-Color Accent Gradient Bar */}
            <Box
              sx={{
                height: 3,
                width: "100%",
                background: "linear-gradient(90deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%)",
              }}
            />

            <CardContent sx={{ p: { xs: 2.5, sm: 4.5 } }}>
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
                    backgroundColor: "rgba(139, 92, 246, 0.12)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#a78bfa",
                      borderRadius: 0,
                      boxShadow: "0 0 8px #a78bfa",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#a78bfa",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Administrative Portal
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
                  Admin Access
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.925rem" }}>
                  Sign in with authorized administrator credentials.
                </Typography>
              </Box>

              {/* Error Alert */}
              <Collapse in={!!error}>
                <Box sx={{ mb: 3 }}>
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
                </Box>
              </Collapse>

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
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
                      Admin Username
                    </Typography>
                    <TextField
                      id="username"
                      name="username"
                      placeholder="Enter administrator username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      fullWidth
                      disabled={loading}
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
                              <PersonOutline sx={{ color: "#a78bfa", fontSize: 22 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* Password Field */}
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
                      Password
                    </Typography>
                    <TextField
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      fullWidth
                      disabled={loading}
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
                              <LockOutlined sx={{ color: "#a78bfa", fontSize: 22 }} />
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 1,
                      py: 1.6,
                      fontSize: "1.025rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      borderRadius: 0,
                      background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)",
                      boxShadow: "0 8px 25px -4px rgba(139, 92, 246, 0.5)",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #4338ca 100%)",
                        boxShadow: "0 12px 30px -4px rgba(139, 92, 246, 0.7)",
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
                        <span>Authenticating Administrator...</span>
                      </Stack>
                    ) : (
                      "Authorize Access"
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* Back to User Login Link */}
              <Box sx={{ textAlign: "center", mt: 3, pt: 2.5, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <ArrowBack sx={{ fontSize: 16 }} />
                  <span>Return to Member Login</span>
                </Link>
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

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
  Avatar,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  ArrowForward
} from '@mui/icons-material';

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

  // Validation state
  const [errors, setErrors] = useState({});

  // Auto-focus email or username field on mount
  useEffect(() => {
    const emailOrUsernameInput = document.getElementById("emailOrUsername");
    if (emailOrUsernameInput) {
      emailOrUsernameInput.focus();
    }
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
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
        if (!value) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
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
    Object.keys(form).forEach(field => {
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
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Login failed. Please try again.");
      } else {
        setMessage("Login successful! Redirecting to dashboard...");
        
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
        }, 2000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex'
    }}>
      {/* Left Half - Logo and Branding */}
      <Box sx={{ 
        width: '50%',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        px: 4
      }}>
        {/* Ledora Global Image */}
        <Box sx={{ mb: 4 }}>
          <Image 
            src="/leadora_global.jpg" 
            alt="Ledora Global" 
            width={300}
            height={200}
            style={{ 
              maxWidth: '300px', 
              height: 'auto',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            priority
          />
        </Box>
        
        {/* Tagline */}
        <Typography variant="h6" sx={{ mb: 6, opacity: 0.9, lineHeight: 1.6, textAlign: 'center' }}>
          Sign in to your account to access your dashboard, manage packages, 
          and explore our e-commerce platform.
        </Typography>
        

      </Box>

      {/* Right Half - Login Form */}
      <Box sx={{ 
        width: { xs: '100%', lg: '50%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 4, lg: 6 }
      }}>
        <Box sx={{ 
          width: '100%', 
          maxWidth: 450
        }}>
          {/* Mobile Logo */}
          <Box sx={{ 
            display: { xs: 'flex', lg: 'none' }, 
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              mb: 2,
              fontSize: '2rem',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}>
              L
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              LEADORA
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.light', mb: 1 }}>
              GLOBAL
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your username to continue
            </Typography>
          </Box>

          {/* Login Card */}
          <Card sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <CardContent sx={{ p: 4 }}>
              {/* Success/Error Messages */}
              {message && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {message}
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={onSubmit} noValidate>
                {/* Login Heading */}
                <Typography variant="h4" component="h1" sx={{ 
                  fontWeight: 'bold', 
                  mb: 3, 
                  textAlign: 'left',
                  color: 'text.primary'
                }}>
                  Login
                </Typography>
                
                <Stack spacing={3}>
                  {/* Username Field */}
                  <TextField
                    id="username"
                    name="username"
                    label="Username"
                    value={form.username}
                    onChange={updateField("username")}
                    required
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Password Field */}
                  <TextField
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={updateField("password")}
                    required
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mt: 2,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                      }
                    }}
                    endIcon={loading ? null : <ArrowForward />}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </Stack>
              </Box>

              {/* Sign up link */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Sign up here
                  </Link>
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
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

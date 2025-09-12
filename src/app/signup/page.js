"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../../lib/auth";
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person,
  Group,
  Lock,
  Email,
  Phone,
  Visibility,
  VisibilityOff,
  ArrowForward,
} from '@mui/icons-material';

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
    referrerName: '',
    message: ''
  });

  // Auto-focus full name field on mount
  useEffect(() => {
    const fullNameInput = document.getElementById("fullName");
    if (fullNameInput) {
      fullNameInput.focus();
    }
  }, []);

  // Check for referral code in URL params
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setForm(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

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

    // Validate referral code in real-time
    if (field === 'referralCode' && value.length >= 3) {
      validateReferralCode(value);
    } else if (field === 'referralCode' && value.length < 3) {
      setReferralValidation({
        isValidating: false,
        isValid: false,
        referrerName: '',
        message: ''
      });
    }
  };

  const validateReferralCode = async (referralCode) => {
    if (!referralCode || referralCode.length < 3) return;

    setReferralValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch('/api/validate-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setReferralValidation({
          isValidating: false,
          isValid: true,
          referrerName: data.referrer.fullname,
          message: data.message
        });
        // Clear any referral code errors
        setErrors(prev => ({ ...prev, referralCode: "" }));
      } else {
        setReferralValidation({
          isValidating: false,
          isValid: false,
          referrerName: '',
          message: data.message
        });
        // Set referral code error
        setErrors(prev => ({ ...prev, referralCode: data.message }));
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralValidation({
        isValidating: false,
        isValid: false,
        referrerName: '',
        message: 'Error validating referral code'
      });
    }
  };

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case "fullName":
        if (!value) return "Full name is required";
        if (value.length < 2) return "Full name must be at least 2 characters";
        return "";
      
      case "username":
        if (!value) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores";
        return "";
      
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        return "";
      
      case "phoneNumber":
        if (!value) return "Phone number is required";
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
        if (!value) return "Referral code is required";
        if (value.length < 3) return "Referral code must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Referral code can only contain letters, numbers, and underscores";
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

    // Check if referral code is valid
    if (!referralValidation.isValid) {
      setError("Please enter a valid referral code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          phoneNumber: form.phoneNumber,
          referralCode: form.referralCode,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Signup failed. Please try again.");
      } else {
        setMessage("Account created successfully! Please check your email for verification instructions.");
        
        // Clear form
        setForm({
          fullName: "",
          username: "",
          email: "",
          phoneNumber: "",
          referralCode: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Signup error:", err);
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
          Create your account and start your journey with Ledora Global. 
          Access exclusive packages, earn rewards, and grow with our community.
        </Typography>
        

      </Box>

      {/* Right Half - Signup Form */}
      <Box sx={{ 
        width: { xs: '100%', lg: '50%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pr: { lg: 4 }
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '700px' },
          mx: 'auto'
        }}>
          {/* Mobile Logo */}
          <Box sx={{ 
            display: { xs: 'flex', lg: 'none' }, 
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}>
            <Box sx={{ mb: 2 }}>
              <Image 
                src="/leadora_global.jpg" 
                alt="Ledora Global" 
                width={200}
                height={133}
                style={{ 
                  maxWidth: '200px', 
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join us and start your journey today
            </Typography>
          </Box>

          {/* Signup Card */}
          <Card sx={{ 
            width: '100%',
            maxWidth: { xs: '100%', sm: '600px', md: '700px' },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            my: 2,
            mx: 'auto'
          }}>
            <CardContent sx={{ py: 3, px: 3 }}>
              {/* Card Title */}
              <Typography variant="h4" component="h1" sx={{ 
                textAlign: 'left', 
                mb: 3, 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SignUp
              </Typography>
              
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

              {/* Signup Form */}
              <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3,
                  width: '100%' 
                }}>
                  {/* Row 1: Full Name and Username */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    width: '100%',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <TextField
                      id="fullName"
                      name="fullName"
                      label="Full Name"
                      value={form.fullName}
                      onChange={updateField("fullName")}
                      required
                      fullWidth
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      id="username"
                      name="username"
                      label="Username"
                      value={form.username}
                      onChange={updateField("username")}
                      required
                      fullWidth
                      error={!!errors.username}
                      helperText={errors.username || "This will be your login username and referral code"}
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Row 2: Email and Phone Number */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    width: '100%',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <TextField
                      id="email"
                      name="email"
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={updateField("email")}
                      required
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email || "We'll send you a verification email"}
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      id="phoneNumber"
                      name="phoneNumber"
                      label="Phone Number"
                      type="tel"
                      value={form.phoneNumber}
                      onChange={updateField("phoneNumber")}
                      required
                      fullWidth
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber || "Enter your mobile phone number"}
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Row 3: Referral Code */}
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      id="referralCode"
                      name="referralCode"
                      label="Referral Code"
                      value={form.referralCode}
                      onChange={updateField("referralCode")}
                      required
                      fullWidth
                      error={!!errors.referralCode}
                      helperText={
                        referralValidation.isValidating 
                          ? "Validating referral code..." 
                          : referralValidation.isValid 
                            ? `✓ Valid! You will be referred by ${referralValidation.referrerName}`
                            : errors.referralCode || "Enter a valid referral code to continue"
                      }
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        },
                        '& .MuiFormHelperText-root': {
                          color: referralValidation.isValid ? 'success.main' : errors.referralCode ? 'error.main' : 'text.secondary'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Group />
                          </InputAdornment>
                        ),
                        endAdornment: referralValidation.isValidating && (
                          <InputAdornment position="end">
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              border: '2px solid #ccc',
                              borderTop: '2px solid #1976d2',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                              }
                            }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    {referralValidation.isValid && (
                      <Box sx={{ 
                        mt: 1, 
                        p: 2, 
                        bgcolor: 'success.50', 
                        border: '1px solid', 
                        borderColor: 'success.200',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'success.main', 
                          borderRadius: '50%' 
                        }} />
                        <Typography variant="body2" color="success.dark">
                          You will be referred by <strong>{referralValidation.referrerName}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Row 4: Password and Confirm Password */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    width: '100%',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
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
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
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
                              sx={{ color: 'white' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      required
                      fullWidth
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '56px'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              sx={{ color: 'white' }}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.5,
                    height: '56px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                    }
                  }}
                  endIcon={loading ? null : <ArrowForward />}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </Box>

              {/* Sign in link */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Sign in here
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

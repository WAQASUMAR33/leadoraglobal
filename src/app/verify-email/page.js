"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Error, Email } from '@mui/icons-material';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email with token
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`/api/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setUser(data.user);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResendVerification = () => {
    // TODO: Implement resend verification email
    alert('Resend verification email functionality will be implemented soon.');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Card sx={{ 
        width: '100%',
        maxWidth: 500,
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                Verifying Email...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                Email Verified Successfully!
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
              {user && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Welcome, {user.username}! ({user.email})
                </Typography>
              )}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => router.push('/login')}
                sx={{ 
                  mb: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                  }
                }}
              >
                Go to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Error sx={{ fontSize: 60, color: 'error.main', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'error.main' }}>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The verification link may be invalid or expired.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleResendVerification}
                  startIcon={<Email />}
                  sx={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                    }
                  }}
                >
                  Resend Verification Email
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => router.push('/signup')}
                >
                  Back to Signup
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="body2" color="text.secondary">
              Need help?{" "}
              <Link
                href="/contact"
                style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                Contact Support
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


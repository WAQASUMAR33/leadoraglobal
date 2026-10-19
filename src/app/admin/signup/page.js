'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';

export default function AdminSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          role: 'super_admin'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Admin account created successfully! You can now log in.');
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create admin account');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network or server error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#070a12',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 6,
        backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12), transparent 50%)'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Top Logo / Icon */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              bgcolor: '#0c1220',
              border: '1px solid #1e293b',
              color: '#818cf8',
              mb: 1.5
            }}
          >
            <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Initialize Administrative Access
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Establish supreme administrative credentials & privileges
          </Typography>
        </Box>

        {/* Signup Form Card */}
        <Card
          sx={{
            borderRadius: 0,
            bgcolor: '#0c1220',
            border: '1px solid #1e293b',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)'
          }}
        >
          <Box sx={{ p: 2, bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldOutlinedIcon sx={{ color: '#818cf8', fontSize: 18 }} />
            <Typography sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              SECURE REGISTRATION CONSOLE
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 0, mb: 2.5, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ borderRadius: 0, mb: 2.5, bgcolor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.2}>
                <Box>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, mb: 0.5, letterSpacing: '0.04em' }}>
                    FULL LEGAL NAME
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Master Administrator"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeOutlinedIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: '#1e293b' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, mb: 0.5, letterSpacing: '0.04em' }}>
                    ADMIN USERNAME
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. superadmin"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: '#1e293b' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, mb: 0.5, letterSpacing: '0.04em' }}>
                    OFFICIAL EMAIL ADDRESS
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. admin@domain.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: '#1e293b' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, mb: 0.5, letterSpacing: '0.04em' }}>
                    PASSWORD (MIN 6 CHARS)
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter robust password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: '#64748b' }}
                          >
                            {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: '#1e293b' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, mb: 0.5, letterSpacing: '0.04em' }}>
                    CONFIRM PASSWORD
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-type password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: '#64748b' }}
                          >
                            {showConfirmPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#080d19',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: '#1e293b' },
                        '&:hover fieldset': { borderColor: '#475569' },
                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    borderRadius: 0,
                    bgcolor: '#4338ca',
                    color: '#fff',
                    py: 1.4,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontSize: '0.9rem',
                    mt: 1,
                    '&:hover': { bgcolor: '#3730a3' },
                    '&.Mui-disabled': { bgcolor: '#1e293b', color: '#475569' }
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'REGISTER ADMIN ACCOUNT'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #1e293b', textAlign: 'center' }}>
              <Link href="/admin/login" style={{ textDecoration: 'none' }}>
                <Typography sx={{ color: '#818cf8', fontSize: '0.84rem', fontWeight: 600, '&:hover': { color: '#a5b4fc', textDecoration: 'underline' } }}>
                  Already possess credentials? Access Login Portal →
                </Typography>
              </Link>
            </Box>
          </CardContent>
        </Card>

        {/* Mandatory Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
            Powerd By :{' '}
            <a
              href="https://rapidtechpro.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#818cf8',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              RAPIDTECHPRO
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

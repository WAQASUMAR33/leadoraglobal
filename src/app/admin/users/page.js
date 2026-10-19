'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AdminUsersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/user-management');
  }, [router]);

  return (
    <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <CircularProgress sx={{ color: '#818cf8', mb: 2 }} />
      <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
        REDIRECTING TO USER MANAGEMENT...
      </Typography>
    </Box>
  );
}
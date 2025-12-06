/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'steelblue-cod-355377.hostingersite.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
  swcMinify: true, // Use SWC minifier (faster than Terser)
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for faster builds
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@heroicons/react'],
  },
};

export default nextConfig;

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
};

export default nextConfig;

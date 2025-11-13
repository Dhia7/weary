import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed outputFileTracingRoot as it can cause 404 errors on Vercel
  // outputFileTracingRoot: __dirname,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Add production backend patterns
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '*.onrender.com',
        pathname: '/uploads/**',
      },
      // Add specific backend domain
      {
        protocol: 'https',
        hostname: 'weary-backend.onrender.com',
        pathname: '/uploads/**',
      },
    ],
    // Disable image optimization to avoid Vercel optimization issues with external images
    unoptimized: true,
  },
  async rewrites() {
    // Get backend URL from environment
    // In production (Vercel), NEXT_PUBLIC_API_URL must be set
    // In development, fallback to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const backendUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
    
    // Only add rewrites if we have a valid backend URL
    // In production, NEXT_PUBLIC_API_URL must be set (not localhost)
    if (process.env.NODE_ENV === 'production' && (!backendUrl || backendUrl.includes('localhost'))) {
      console.warn('⚠️ NEXT_PUBLIC_API_URL not set in production. API rewrites disabled.');
      return [];
    }
    
    console.log('Next.js rewrite config - Backend URL:', backendUrl);
    console.log('Next.js rewrite config - API URL:', apiUrl);
    
    return [
      // Proxy API through Next to backend
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
      // Handle legacy /api/uploads/ paths
      {
        source: '/api/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
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
  },
  async rewrites() {
    // Get backend URL from environment or use localhost for development
    const backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://localhost:3001';
    
    console.log('Next.js rewrite config - Backend URL:', backendUrl);
    console.log('Next.js rewrite config - API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    return [
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

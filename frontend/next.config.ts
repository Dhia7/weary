import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
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
    // Get backend URL from environment or use localhost for development
    const backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://localhost:3001';
    
    console.log('Next.js rewrite config - Backend URL:', backendUrl);
    console.log('Next.js rewrite config - API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    return [
      // Proxy API through Next (port 3000) to backend (port 3001)
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

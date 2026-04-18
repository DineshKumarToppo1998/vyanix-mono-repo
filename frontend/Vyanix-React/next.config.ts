import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/products',
        destination: 'http://localhost:8080/api/v1/products',
      },
      {
        source: '/api/products/search',
        destination: 'http://localhost:8080/api/v1/products/search',
      },
      {
        source: '/api/products/slug/:slug',
        destination: 'http://localhost:8080/api/v1/products/slug/:slug',
      },
      {
        source: '/api/products/related/:productId',
        destination: 'http://localhost:8080/api/v1/products/related/:productId',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:8080/api/v1/products/:path*',
      },
      {
        source: '/api/categories',
        destination: 'http://localhost:8080/api/v1/categories',
      },
      {
        source: '/api/categories/:slug/products',
        destination: 'http://localhost:8080/api/v1/categories/:slug/products',
      },
      {
        source: '/api/categories/:path*',
        destination: 'http://localhost:8080/api/v1/categories/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8080/api/v1/auth/:path*',
      },
      {
        source: '/api/cart/:path*',
        destination: 'http://localhost:8080/api/v1/cart/:path*',
      },
      {
        source: '/api/orders/:path*',
        destination: 'http://localhost:8080/api/v1/orders/:path*',
      },
      {
        source: '/api/addresses/:path*',
        destination: 'http://localhost:8080/api/v1/addresses/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
  allowedDevOrigins: [
    "http://192.168.29.215:9002",
    "http://localhost:9002",
    "http://nginx:80"
  ],
};

export default nextConfig;

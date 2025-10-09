import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CORS and Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  compiler: {
    // Remove console logs in production and staging
    removeConsole: ["production", "staging"].includes(
      process.env.NODE_ENV || ""
    ),
  },
  images: {
    domains: [
      "www.shutterstock.com",
      "images.unsplash.com",
      "unsplash.com",

      // S3 Buckets
      "kroolo-qastage.s3.amazonaws.com",
      "kroolo-public-images.s3.ap-south-1.amazonaws.com",
      "dev-enterprisesearch.s3.us-east-2.amazonaws.com",
      "qa-enterprisesearch.s3.us-east-2.amazonaws.com",
      "enterprise-search-dev.s3.us-east-2.amazonaws.com",
      "enterprise-search-qa.s3.us-east-2.amazonaws.com",
      "enterprise-search-prod.s3.us-east-2.amazonaws.com",
      "kroolo-enterprise-search.s3.us-east-2.amazonaws.com",
      "kroolo-enterprise-search-dev.s3.us-east-2.amazonaws.com",
      "kroolo-enterprise-search-qa.s3.us-east-2.amazonaws.com",
      "kroolo-enterprise-search-prod.s3.us-east-2.amazonaws.com",

      // Other
      "lh3.googleusercontent.com", // Google avatars
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [{ name: "removeViewBox", active: false }],
            },
            titleProp: true,
            ref: true,
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;

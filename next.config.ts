import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static caching headers for optimal browser caching
  async headers() {
    return [
      {
        // Cache static assets for 1 year
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|mp4|ttf|otf|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache CSS and JS for 1 year (versioned by Next.js)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache API responses for 5 minutes
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=600",
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
    // Enable modern image formats
    formats: ["image/webp", "image/avif"],
    
    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    
    // Remote image patterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.shutterstock.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      // S3 Buckets
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      // Google
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Supabase storage (public URLs)
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "taziwfxkhwzhlddpvuzn.supabase.co",
      },
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

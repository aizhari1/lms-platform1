const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.s3.**.amazonaws.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' }, // Image Optimization: allow any HTTPS CDN/storage host (S3-compatible/MinIO deployments vary), while keeping http restricted to localhost above for local dev only
    ],
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = withNextIntl(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-here',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig 
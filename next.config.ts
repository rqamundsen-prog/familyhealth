import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 确保 prisma 目录（含模板数据库）被包含在 serverless 函数中
  outputFileTracingIncludes: {
    '/api/**': ['./prisma/**'],
    '/dashboard/**': ['./prisma/**'],
    '/admin/**': ['./prisma/**'],
    '/tasks/**': ['./prisma/**'],
    '/records/**': ['./prisma/**'],
    '/trends/**': ['./prisma/**'],
    '/alerts/**': ['./prisma/**'],
    '/login': ['./prisma/**'],
    '/register': ['./prisma/**'],
  },
};

export default nextConfig;

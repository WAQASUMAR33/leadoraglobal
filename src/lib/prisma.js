// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis.__prisma || (globalThis.__prisma = {})

// Optimize logging: only log errors in production, full logging in development
const logLevel = process.env.NODE_ENV === 'production' 
  ? ['error'] 
  : ['query', 'error', 'warn']

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: logLevel,
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Increase timeouts for complex MLM operations
  transactionOptions: {
    timeout: 300000, // 5 minutes for transactions
    maxWait: 30000   // 30 seconds max wait
  },
  // Connection pooling optimization
  __internal: {
    engine: {
      connectTimeout: 10000, // 10 seconds connection timeout
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

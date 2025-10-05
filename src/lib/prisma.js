// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis.__prisma || (globalThis.__prisma = {})

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Increase timeouts for complex MLM operations
  transactionOptions: {
    timeout: 300000, // 5 minutes for transactions
    maxWait: 30000   // 30 seconds max wait
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

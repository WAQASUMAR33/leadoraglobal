// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis.__prisma || (globalThis.__prisma = {})

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

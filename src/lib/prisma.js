// lib/prisma.js
const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis.__prisma || (globalThis.__prisma = {})

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = prisma

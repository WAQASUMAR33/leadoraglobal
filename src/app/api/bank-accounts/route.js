// app/api/bank-accounts/route.js
import prisma from '../../../lib/prisma'

export async function GET() {
  try {
    const bankAccounts = await prisma.companyBankAccounts.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return new Response(JSON.stringify({ bankAccounts }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

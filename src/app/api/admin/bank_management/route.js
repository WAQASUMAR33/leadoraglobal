// app/api/admin/bank_management/route.js
import prisma from '../../../../lib/prisma'

export async function POST(req) {
  try {
    const body = await req.json()
    const { bank_title, bank_accountno, account_title, iban_no } = body

    if (!bank_title || !bank_accountno || !account_title || !iban_no) {
      return new Response(JSON.stringify({ message: 'Missing required fields: bank_title, bank_accountno, account_title, iban_no' }), { status: 400 })
    }

    const data = {
      bank_title,
      bank_accountno,
      account_title,
      iban_no,
    }

    const bankAccount = await prisma.companyBankAccounts.create({ data })

    return new Response(JSON.stringify({ message: 'Bank account created', bankAccount }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

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

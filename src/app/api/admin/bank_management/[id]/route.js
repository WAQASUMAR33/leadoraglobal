// app/api/admin/bank_management/[id]/route.js
import prisma from '../../../../../lib/prisma';

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const bankAccount = await prisma.companyBankAccounts.findUnique({ where: { id: Number(id) } })
    if (!bankAccount) {
      return new Response(JSON.stringify({ message: 'Bank account not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(bankAccount), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function PUT(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const body = await req.json()
    const { bank_title, bank_accountno, account_title, iban_no } = body

    const data = {}
    if (bank_title !== undefined) data.bank_title = bank_title
    if (bank_accountno !== undefined) data.bank_accountno = bank_accountno
    if (account_title !== undefined) data.account_title = account_title
    if (iban_no !== undefined) data.iban_no = iban_no

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    const updated = await prisma.companyBankAccounts.update({
      where: { id: Number(id) },
      data,
    })

    return new Response(JSON.stringify({ message: 'Bank account updated', bankAccount: updated }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Bank account not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    await prisma.companyBankAccounts.delete({ where: { id: Number(id) } })
    return new Response(JSON.stringify({ message: 'Bank account deleted' }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Bank account not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

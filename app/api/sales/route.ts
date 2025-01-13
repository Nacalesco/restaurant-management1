import { NextResponse } from 'next/server'
import { getSales, addSale } from '@/lib/db-server'

export async function GET() {
  const sales = await getSales()
  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  const { dishId, quantity, totalPrice, date } = await request.json()
  await addSale(dishId, quantity, totalPrice, date)
  return NextResponse.json({ success: true })
}


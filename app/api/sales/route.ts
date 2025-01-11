import { NextResponse } from 'next/server'
import { getSales, addSale, getProducts } from '@/lib/db-server'

export async function GET() {
  const sales = await getSales()
  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  const { productId, quantity, totalPrice, date } = await request.json()
  const result = await addSale(productId, quantity, totalPrice, date)
  return NextResponse.json(result)
}

export async function PUT() {
  const products = await getProducts()
  return NextResponse.json(products)
}


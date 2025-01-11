import { NextResponse } from 'next/server'
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/db'

export async function GET() {
  const products = await getProducts()
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const { name, price, stock } = await request.json()
  const result = await addProduct(name, price, stock)
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  const { id, name, price, stock } = await request.json()
  const result = await updateProduct(id, name, price, stock)
  return NextResponse.json(result)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const result = await deleteProduct(id)
  return NextResponse.json(result)
}


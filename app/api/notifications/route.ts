import { NextResponse } from 'next/server'
import { getLowStockProducts } from '@/lib/db-server'

export async function GET() {
  const lowStockProducts = await getLowStockProducts(10)
  const notifications = lowStockProducts.map(p => ({
    id: p.id,
    mensaje: `Stock bajo para ${p.name}: ${p.stock} unidades`,
    tipo: 'warning'
  }))
  return NextResponse.json(notifications)
}


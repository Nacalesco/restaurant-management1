import { NextResponse } from 'next/server'
import { getStatistics } from '@/lib/db-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fechaInicio = searchParams.get('fechaInicio')
  const fechaFin = searchParams.get('fechaFin')

  if (!fechaInicio || !fechaFin) {
    return NextResponse.json({ error: 'Fechas de inicio y fin son requeridas' }, { status: 400 })
  }

  const statistics = await getStatistics(fechaInicio, fechaFin)
  return NextResponse.json(statistics)
}


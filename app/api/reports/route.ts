import { NextResponse } from 'next/server'
import { getStatistics } from '@/lib/db-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Las fechas de inicio y fin son requeridas' }, 
      { status: 400 }
    )
  }

  try {
    const stats = await getStatistics(startDate, endDate)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al generar el reporte:', error)
    return NextResponse.json(
      { error: 'Error al generar el reporte' }, 
      { status: 500 }
    )
  }
}
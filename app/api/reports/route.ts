import { NextResponse } from 'next/server'
import { getStatistics } from '@/lib/db-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
  }

  try {
    const stats = await getStatistics(startDate, endDate)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Error generating report' }, { status: 500 })
  }
}
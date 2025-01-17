import { NextResponse } from 'next/server';
import { getSales, addSale } from '@/lib/db-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const sales = await getSales(date);
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dishId, quantity, totalPrice, date } = await request.json();
    await addSale(dishId, quantity, totalPrice, date);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding sale:', error);
    return NextResponse.json({ error: 'Error adding sale' }, { status: 500 });
  }
}

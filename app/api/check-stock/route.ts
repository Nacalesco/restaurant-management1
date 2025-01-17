import { NextResponse } from 'next/server';
import { checkLowStock } from '@/lib/db-server';

export async function POST(request: Request) {
  try {
    const { dishId, quantity } = await request.json();
    const stockCheck = await checkLowStock(dishId, quantity);
    return NextResponse.json(stockCheck);
  } catch (error) {
    console.error('Error checking stock:', error);
    return NextResponse.json(
      { error: 'Error checking stock' }, 
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server'
import { getDishes, addDish, updateDish, deleteDish } from '@/lib/db-server'

export async function GET() {
  try {
    const dishes = await getDishes()
    return NextResponse.json(dishes)
  } catch (error) {
    console.error('Error fetching dishes:', error)
    return NextResponse.json({ error: 'Error fetching dishes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, price, ingredients } = await request.json()
    const newDishId = await addDish(name, price, ingredients)
    return NextResponse.json({ id: newDishId })
  } catch (error) {
    console.error('Error adding dish:', error)
    return NextResponse.json({ error: 'Error adding dish' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, price, ingredients } = await request.json()
    await updateDish(id, name, price, ingredients)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating dish:', error)
    return NextResponse.json({ error: 'Error updating dish' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteDish(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dish:', error)
    return NextResponse.json({ error: 'Error deleting dish' }, { status: 500 })
  }
}


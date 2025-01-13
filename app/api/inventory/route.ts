import { NextResponse } from 'next/server'
import { getRawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } from '@/lib/db-server'

export async function GET() {
  try {
    const rawMaterials = await getRawMaterials()
    return NextResponse.json(rawMaterials)
  } catch (error) {
    console.error('Error fetching raw materials:', error)
    return NextResponse.json({ error: 'Error fetching raw materials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, quantity, unit } = await request.json()
    if (!name || quantity === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await addRawMaterial(name, quantity, unit)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding raw material:', error)
    return NextResponse.json({ error: 'Error adding raw material' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, quantity, unit } = await request.json()
    await updateRawMaterial(id, name, quantity, unit)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating raw material:', error)
    return NextResponse.json({ error: 'Error updating raw material' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteRawMaterial(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting raw material:', error)
    return NextResponse.json({ error: 'Error deleting raw material' }, { status: 500 })
  }
}


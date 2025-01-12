import { NextResponse } from 'next/server'
import * as db from '@/lib/db-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'getRawMaterials':
        const rawMaterials = await db.getRawMaterials()
        return NextResponse.json(rawMaterials)
      case 'getDishes':
        const dishes = await db.getDishes()
        return NextResponse.json(dishes)
      case 'getLowStock':
        const lowStockProducts = await db.getLowStockRawMaterials()
        return NextResponse.json(lowStockProducts)
      case 'getDishIngredients':
        const dishId = searchParams.get('dishId')
        if (dishId) {
          const ingredients = await db.getDishIngredients(parseInt(dishId))
          return NextResponse.json(ingredients)
        }
        return NextResponse.json({ error: 'Dish ID is required' }, { status: 400 })
      case 'getProducts':
        const products = await db.getProducts()
        return NextResponse.json(products || [])
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in GET /api/inventory:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'addRawMaterial':
        const newRawMaterial = await db.addRawMaterial(data.name, data.price, data.stock, data.unit, data.minStock)
        return NextResponse.json(newRawMaterial)
      case 'updateRawMaterial':
        const updatedRawMaterial = await db.updateRawMaterial(data.id, data.name, data.price, data.stock, data.unit, data.minStock)
        return NextResponse.json(updatedRawMaterial)
      case 'deleteRawMaterial':
        const deletedRawMaterial = await db.deleteRawMaterial(data.id)
        return NextResponse.json(deletedRawMaterial)
      case 'addDish':
        const newDish = await db.addDish(data.name, data.price, data.category)
        return NextResponse.json(newDish)
      case 'updateDish':
        const updatedDish = await db.updateDish(data.id, data.name, data.price, data.category)
        return NextResponse.json(updatedDish)
      case 'deleteDish':
        const deletedDish = await db.deleteDish(data.id)
        return NextResponse.json(deletedDish)
      case 'addDishIngredient':
        const newIngredient = await db.addDishIngredient(data.dishId, data.rawMaterialId, data.quantity)
        return NextResponse.json(newIngredient)
      case 'updateDishIngredient':
        const updatedIngredient = await db.updateDishIngredient(data.id, data.quantity)
        return NextResponse.json(updatedIngredient)
      case 'deleteDishIngredient':
        const deletedIngredient = await db.deleteDishIngredient(data.id)
        return NextResponse.json(deletedIngredient)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in POST /api/inventory:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 })
  }
}


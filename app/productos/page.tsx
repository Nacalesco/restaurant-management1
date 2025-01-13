'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Layout from '../components/layout'
import Link from 'next/link'

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface Dish {
  id: number;
  name: string;
  price: number;
  ingredients: Ingredient[];
}

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export default function PlatosPage() {
  const [platos, setPlatos] = useState<Dish[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [nuevoPlato, setNuevoPlato] = useState({ name: '', price: '', ingredients: [] as {id: number, quantity: number, unit: string}[] })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlatos()
    fetchRawMaterials()
  }, [])

  const fetchPlatos = async () => {
    try {
      const response = await fetch('/api/dishes')
      if (!response.ok) {
        throw new Error('Error fetching dishes')
      }
      const data = await response.json()
      setPlatos(data)
    } catch (err) {
      console.error('Error fetching dishes:', err)
      setError('Error al cargar los platos. Por favor, intente de nuevo.')
    }
  }

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Error fetching raw materials')
      }
      const data = await response.json()
      setRawMaterials(data)
    } catch (err) {
      console.error('Error fetching raw materials:', err)
      setError('Error al cargar las materias primas. Por favor, intente de nuevo.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updatePlato()
    } else {
      await addPlato()
    }
  }

  const addPlato = async () => {
    try {
      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nuevoPlato.name,
          price: parseFloat(nuevoPlato.price),
          ingredients: nuevoPlato.ingredients
        }),
      })

      if (!response.ok) {
        throw new Error('Error adding dish')
      }

      await fetchPlatos()
      setNuevoPlato({ name: '', price: '', ingredients: [] })
      setError(null)
    } catch (err) {
      console.error('Error adding dish:', err)
      setError('Error al agregar el plato. Por favor, intente de nuevo.')
    }
  }

  const updatePlato = async () => {
    try {
      const response = await fetch('/api/dishes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingId,
          name: nuevoPlato.name,
          price: parseFloat(nuevoPlato.price),
          ingredients: nuevoPlato.ingredients
        }),
      })

      if (!response.ok) {
        throw new Error('Error updating dish')
      }

      await fetchPlatos()
      setNuevoPlato({ name: '', price: '', ingredients: [] })
      setEditingId(null)
      setError(null)
    } catch (err) {
      console.error('Error updating dish:', err)
      setError('Error al actualizar el plato. Por favor, intente de nuevo.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/dishes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Error deleting dish')
      }

      await fetchPlatos()
    } catch (err) {
      console.error('Error deleting dish:', err)
      setError('Error al eliminar el plato. Por favor, intente de nuevo.')
    }
  }

  const handleEdit = (plato: Dish) => {
    setNuevoPlato({ 
      name: plato.name, 
      price: plato.price.toString(), 
      ingredients: plato.ingredients?.map(ing => ({
        id: ing.id || 0,
        quantity: ing.quantity || 0,
        unit: ing.unit || ''
      })) || []
    })
    setEditingId(plato.id)
  }

  const handleIngredientChange = (index: number, field: 'id' | 'quantity' | 'unit', value: string) => {
    const newIngredients = [...nuevoPlato.ingredients]
    if (newIngredients[index]) {
      if (field === 'id') {
        newIngredients[index] = { ...newIngredients[index], id: parseInt(value) || 0 }
      } else if (field === 'quantity') {
        newIngredients[index] = { ...newIngredients[index], quantity: parseFloat(value) || 0 }
      } else {
        newIngredients[index] = { ...newIngredients[index], unit: value }
      }
      setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
    }
  }

  const addIngredient = () => {
    setNuevoPlato({
      ...nuevoPlato,
      ingredients: [...nuevoPlato.ingredients, { id: 0, quantity: 0, unit: 'g' }]
    })
  }

  const removeIngredient = (index: number) => {
    const newIngredients = nuevoPlato.ingredients.filter((_, i) => i !== index)
    setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Platos</h1>
          <Link href="/">
            <Button>Volver al Menú Principal</Button>
          </Link>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Nombre del plato"
              value={nuevoPlato.name}
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, name: e.target.value })}
              required
            />
            <Input
              placeholder="Precio"
              type="number"
              step="0.01"
              value={nuevoPlato.price}
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, price: e.target.value })}
              required
            />
          </div>
          <div className="mb-2">
            <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
            {nuevoPlato.ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Select 
                  value={ing.id.toString()} 
                  onValueChange={(value) => handleIngredientChange(index, 'id', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map((rm) => (
                      <SelectItem key={rm.id} value={rm.id.toString()}>{rm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Cantidad"
                  type="number"
                  step="0.01"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  required
                />
                <Select 
                  value={ing.unit} 
                  onValueChange={(value) => handleIngredientChange(index, 'unit', value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Gramos</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="ml">Mililitros</SelectItem>
                    <SelectItem value="l">Litros</SelectItem>
                    <SelectItem value="unidad">Unidades</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => removeIngredient(index)} variant="destructive">
                  Eliminar
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addIngredient} className="mt-2">
              Agregar Ingrediente
            </Button>
          </div>
          <Button type="submit">{editingId ? 'Actualizar' : 'Agregar'} Plato</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Ingredientes</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platos.map((plato) => (
              <TableRow key={plato.id}>
                <TableCell>{plato.name}</TableCell>
                <TableCell>${plato.price.toFixed(2)}</TableCell>
                <TableCell>
                  <ul>
                    {plato.ingredients?.map((ing, index) => (
                      <li key={index}>{ing.name || 'Unknown'}: {ing.quantity || 0} {ing.unit || ''}</li>
                    )) || 'No ingredients'}
                  </ul>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(plato)} className="mr-2">Editar</Button>
                  <Button onClick={() => handleDelete(plato.id)} variant="destructive">Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


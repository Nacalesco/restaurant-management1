'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Layout from '../components/layout'

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState<RawMaterial[]>([])
  const [nuevoItem, setNuevoItem] = useState({ name: '', quantity: '', unit: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventario()
  }, [])

  const fetchInventario = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Error fetching inventory')
      }
      const data = await response.json()
      setInventario(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('Error al cargar el inventario. Por favor, intente de nuevo.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Added to clear previous errors
    if (editingId) {
      await updateItem()
    } else {
      await addItem()
    }
  }

  const addItem = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nuevoItem.name,
          quantity: parseFloat(nuevoItem.quantity),
          unit: nuevoItem.unit
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error adding raw material')
      }

      await fetchInventario()
      setNuevoItem({ name: '', quantity: '', unit: '' })
      setError(null)
    } catch (err) {
      console.error('Error adding raw material:', err)
      setError(err instanceof Error ? err.message : 'Error al agregar la materia prima. Por favor, intente de nuevo.')
    }
  }

  const updateItem = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingId,
          name: nuevoItem.name,
          quantity: parseFloat(nuevoItem.quantity),
          unit: nuevoItem.unit
        }),
      })

      if (!response.ok) {
        throw new Error('Error updating raw material')
      }

      await fetchInventario()
      setNuevoItem({ name: '', quantity: '', unit: '' })
      setEditingId(null)
      setError(null)
    } catch (err) {
      console.error('Error updating raw material:', err)
      setError('Error al actualizar la materia prima. Por favor, intente de nuevo.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Error deleting raw material')
      }

      await fetchInventario()
    } catch (err) {
      console.error('Error deleting raw material:', err)
      setError('Error al eliminar la materia prima. Por favor, intente de nuevo.')
    }
  }

  const handleEdit = (item: RawMaterial) => {
    setNuevoItem({ 
      name: item.name, 
      quantity: item.quantity.toString(), 
      unit: item.unit 
    })
    setEditingId(item.id)
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Control de Inventario</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <Input
            placeholder="Nombre"
            value={nuevoItem.name}
            onChange={(e) => setNuevoItem({ ...nuevoItem, name: e.target.value })}
            required
          />
          <Input
            placeholder="Cantidad"
            type="number"
            step="0.01"
            value={nuevoItem.quantity}
            onChange={(e) => setNuevoItem({ ...nuevoItem, quantity: e.target.value })}
            required
          />
          <Select 
            value={nuevoItem.unit} 
            onValueChange={(value) => setNuevoItem({ ...nuevoItem, unit: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogramos</SelectItem>
              <SelectItem value="g">Gramos</SelectItem>
              <SelectItem value="l">Litros</SelectItem>
              <SelectItem value="ml">Mililitros</SelectItem>
              <SelectItem value="unidad">Unidades</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">{editingId ? 'Actualizar' : 'Agregar'} Item</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventario.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(item)} className="mr-2">Editar</Button>
                  <Button onClick={() => handleDelete(item.id)} variant="destructive">Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


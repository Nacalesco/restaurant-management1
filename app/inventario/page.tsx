"use client"
import React, { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, AlertTriangle, Package, PackagePlus, Loader2 } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<RawMaterial[]>([])

  useEffect(() => {
    fetchInventario()
  }, [])

  const fetchInventario = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Error fetching inventory')
      }
      const data = await response.json()
      setInventario(data)
      // Identificar items con bajo stock (menos de 10 unidades)
      setLowStockItems(data.filter((item: RawMaterial) => item.quantity < 10))
      setError(null)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('Error al cargar el inventario. Por favor, intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventario.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInventoryTrend = () => {
    return inventario.map(item => ({
      name: item.name,
      cantidad: item.quantity
    })).slice(0, 5) // Mostrar solo los primeros 5 items para el gráfico
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId !== null) {
        // Edit existing item
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
          throw new Error('Error updating item')
        }
      } else {
        // Add new item
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
          throw new Error('Error adding item')
        }
      }
      
      // Refresh the inventory after successful operation
      await fetchInventario()
      setEditingId(null)
      setNuevoItem({ name: '', quantity: '', unit: '' })
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEdit(item: RawMaterial) {
    setNuevoItem({ 
      name: item.name, 
      quantity: item.quantity.toString(), 
      unit: item.unit 
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/inventory`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error('Error deleting raw material');
      }
      await fetchInventario();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Control de Inventario</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={fetchInventario}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Panel de Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getInventoryTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Panel de Alerta de Stock Bajo */}
          <Card className="bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600">No hay items con stock bajo</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulario de nuevo item */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Item' : 'Agregar Nuevo Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Package className="mr-2 h-4 w-4" />
                )}
                {editingId ? 'Actualizar' : 'Agregar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabla de inventario */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No se encontraron items en el inventario
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          item.quantity < 10 
                            ? 'bg-red-100 text-red-800' 
                            : item.quantity < 20 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity < 10 ? 'Stock Bajo' : item.quantity < 20 ? 'Stock Medio' : 'Stock OK'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(item)} variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button onClick={() => handleDelete(item.id)} variant="destructive" size="sm">
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
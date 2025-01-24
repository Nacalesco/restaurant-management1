"use client"
import React, { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/app/components/ui/dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Search, AlertTriangle, Package, PackagePlus, Loader2, Plus, FileDown } from 'lucide-react'
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
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [bulkUpdates, setBulkUpdates] = useState<{[key: number]: string}>({})
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')

  const formatNumber = (num: number) => {
    return Number(num.toFixed(2));
  };

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
      const formattedData = data.map((item: RawMaterial) => ({
        ...item,
        quantity: formatNumber(item.quantity)
      }))
      setInventario(formattedData)
      setLowStockItems(formattedData.filter((item: RawMaterial) => item.quantity < 10))
      setError(null)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Error al cargar el inventario. Por favor, intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Modifica la función handleBulkUpdate
const handleBulkUpdate = async () => {
  setIsSubmitting(true)
  try {
    const updates = Object.entries(bulkUpdates)
      .filter(([, quantity]) => quantity !== '')
      .map(([id, quantity]) => ({
        id: parseInt(id),
        quantity: formatNumber(parseFloat(quantity))
      }))

    const updatePromises = updates.map(({ id, quantity }) => {
      const item = inventario.find(i => i.id === id)
      if (!item) return null

      const newQuantity = item.quantity + quantity
      // Verificar si el resultado sería negativo
      if (newQuantity < 0) {
        throw new Error(`La cantidad final no puede ser negativa para ${item.name}`)
      }

      return fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: item.name,
          quantity: formatNumber(newQuantity),
          unit: item.unit
        })
      })
    })

    await Promise.all(updatePromises.filter(Boolean))
    await fetchInventario()
    setBulkUpdates({})
    setIsBulkUpdateOpen(false)
    setError(null)
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('Error al actualizar el inventario')
    }
  } finally {
    setIsSubmitting(false)
  }
}

  const handleExportLowStock = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nombre,Cantidad,Unidad\n" +
      lowStockItems.map(item => `${item.name},${formatNumber(item.quantity)},${item.unit}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "stock_bajo.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredInventory = inventario.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnit = selectedUnit === 'all' || item.unit === selectedUnit
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && item.quantity < 10) ||
      (stockFilter === 'medium' && item.quantity >= 10 && item.quantity < 20) ||
      (stockFilter === 'high' && item.quantity >= 20)
    
    return matchesSearch && matchesUnit && matchesStock
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const quantity = formatNumber(parseFloat(nuevoItem.quantity))

      if (editingId !== null) {
        const response = await fetch('/api/inventory', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingId,
            name: nuevoItem.name,
            quantity,
            unit: nuevoItem.unit
          }),
        })
        
        if (!response.ok) {
          throw new Error('Error updating item')
        }
      } else {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nuevoItem.name,
            quantity,
            unit: nuevoItem.unit
          }),
        })
        
        if (!response.ok) {
          throw new Error('Error adding item')
        }
      }
      
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar este item?')) return;
    
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
            
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las unidades</SelectItem>
                <SelectItem value="kg">Kilogramos</SelectItem>
                <SelectItem value="g">Gramos</SelectItem>
                <SelectItem value="l">Litros</SelectItem>
                <SelectItem value="ml">Mililitros</SelectItem>
                <SelectItem value="unidad">Unidades</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="medium">Stock medio</SelectItem>
                <SelectItem value="high">Stock alto</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Actualización Masiva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Actualización Masiva de Stock</DialogTitle>
                </DialogHeader>
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Stock Actual</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Cantidad a Agregar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventario.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{formatNumber(item.quantity)}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={bulkUpdates[item.id] || ''}
                              onChange={(e) => setBulkUpdates(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }))}
                              placeholder="0"
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkUpdate} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus className="mr-2 h-4 w-4" />
                    )}
                    Actualizar Stock
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventario.map(item => ({
                    name: item.name,
                    cantidad: formatNumber(item.quantity)
                  })).slice(0, 5)}>
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

          <Card className="bg-orange-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas de Stock Bajo
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportLowStock}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-600">
                        {formatNumber(item.quantity)} {item.unit}
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
                min="0"
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

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualización Rápida</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No se encontraron items en el inventario
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{formatNumber(item.quantity)}</TableCell>
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
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkUpdates[item.id] || ''}
                            onChange={(e) => setBulkUpdates(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))}
                            placeholder="Cantidad"
                            className="w-24"
                          />
                          <Button
  size="sm"
  variant="outline"
  onClick={async () => {
    if (!bulkUpdates[item.id]) return;
    try {
      const newQuantity = item.quantity + parseFloat(bulkUpdates[item.id] || '0')
      // Verificar si el resultado sería negativo
      if (newQuantity < 0) {
        throw new Error(`La cantidad final no puede ser negativa para ${item.name}`)
      }

      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          quantity: formatNumber(newQuantity),
          unit: item.unit
        })
      });
      await fetchInventario();
      setBulkUpdates(prev => ({
        ...prev,
        [item.id]: ''
      }));
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al actualizar el item');
      }
    }
  }}
>
  <Plus className="h-4 w-4" />
</Button>
<Input
  type="number"
  step="0.01"
  min="0"
  value={bulkUpdates[item.id] || ''}
  onChange={(e) => {
    const value = parseFloat(e.target.value);
    const newQuantity = item.quantity + value;
    
    // Solo actualiza si el resultado no sería negativo
    if (!isNaN(value) && newQuantity >= 0) {
      setBulkUpdates(prev => ({
        ...prev,
        [item.id]: e.target.value
      }))
    }
  }}
  onKeyDown={(e) => {
    // Prevenir el ingreso del signo negativo
    if (e.key === '-') {
      e.preventDefault();
    }
  }}
  placeholder="Cantidad"
  className="w-24"
/>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setNuevoItem({
                                name: item.name,
                                quantity: formatNumber(item.quantity).toString(),
                                unit: item.unit
                              });
                              setEditingId(item.id);
                            }} 
                            variant="outline" 
                            size="sm"
                          >
                            Editar
                          </Button>
                          <Button 
                            onClick={() => handleDelete(item.id)} 
                            variant="destructive" 
                            size="sm"
                          >
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
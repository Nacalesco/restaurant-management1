'use client'
import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"  
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Search, Plus, Edit2, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alertDialog"

import Layout from '../components/layout'

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
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [nuevoPlato, setNuevoPlato] = useState({ 
    name: '', 
    price: '', 
    ingredients: [] as {id: number, quantity: number, unit: string}[] 
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [platosRes, materialesRes] = await Promise.all([
        fetch('/api/dishes'),
        fetch('/api/inventory')
      ])
      
      if (!platosRes.ok || !materialesRes.ok) {
        throw new Error('Error fetching data')
      }

      const platosData = await platosRes.json()
      const materialesData = await materialesRes.json()
      
      setPlatos(platosData)
      setRawMaterials(materialesData)
      setError(null)
    } catch {
      setError('Error al cargar los datos. Por favor, intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/dishes', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: nuevoPlato.name,
          price: parseFloat(nuevoPlato.price),
          ingredients: nuevoPlato.ingredients
        }),
      })

      if (!response.ok) {
        throw new Error('Error saving dish')
      }

      await fetchData()
      resetForm()
    } catch {
      setError(`Error al ${editingId ? 'actualizar' : 'agregar'} el plato`)
    }
  }

  const resetForm = () => {
    setNuevoPlato({ name: '', price: '', ingredients: [] })
    setEditingId(null)
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/dishes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Error deleting dish')
      }

      await fetchData()
    } catch {
      setError('Error al eliminar el plato')
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
    setShowForm(true)
  }

  const filteredPlatos = platos.filter(plato =>
    plato.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Gestión de Platos</CardTitle>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar platos..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plato
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {showForm && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Ingredientes</h3>
                      {nuevoPlato.ingredients.map((ing, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Select 
                            value={ing.id.toString()}
                            onValueChange={(value) => {
                              const newIngredients = [...nuevoPlato.ingredients]
                              newIngredients[index] = { ...ing, id: parseInt(value) }
                              setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar ingrediente" />
                            </SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((rm) => (
                                <SelectItem key={rm.id} value={rm.id.toString()}>
                                  {rm.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={ing.quantity}
                            onChange={(e) => {
                              const newIngredients = [...nuevoPlato.ingredients]
                              newIngredients[index] = { ...ing, quantity: parseFloat(e.target.value) || 0 }
                              setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
                            }}
                            className="w-32"
                          />
                          
                          <Select
                            value={ing.unit}
                            onValueChange={(value) => {
                              const newIngredients = [...nuevoPlato.ingredients]
                              newIngredients[index] = { ...ing, unit: value }
                              setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
                            }}
                          >
                            <SelectTrigger className="w-32">
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
                          
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              const newIngredients = nuevoPlato.ingredients.filter((_, i) => i !== index)
                              setNuevoPlato({ ...nuevoPlato, ingredients: newIngredients })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNuevoPlato({
                            ...nuevoPlato,
                            ingredients: [...nuevoPlato.ingredients, { id: 0, quantity: 0, unit: 'g' }]
                          })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ingrediente
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingId ? 'Actualizar' : 'Agregar'} Plato
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Ingredientes</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlatos.map((plato) => (
                    <TableRow key={plato.id}>
                      <TableCell>{plato.name}</TableCell>
                      <TableCell>${plato.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside">
                          {plato.ingredients?.map((ing, idx) => (
                            <li key={idx}>
                              {ing.name}: {ing.quantity} {ing.unit}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(plato)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará el plato permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(plato.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
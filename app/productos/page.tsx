'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Layout from '../components/layout'

interface RawMaterial {
  id: number;
  name: string;
  price: number;
  stock: number;
  unit: string;
  min_stock: number;
}

interface Dish {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface DishIngredient {
  id: number;
  raw_material_id: number;
  raw_material_name: string;
  quantity: number;
  unit: string;
}

export default function ProductosPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [newRawMaterial, setNewRawMaterial] = useState<Omit<RawMaterial, 'id'>>({ name: '', price: 0, stock: 0, unit: '', min_stock: 0 })
  const [newDish, setNewDish] = useState<Omit<Dish, 'id'>>({ name: '', price: 0, category: '' })
  const [editingRawMaterialId, setEditingRawMaterialId] = useState<number | null>(null)
  const [editingDishId, setEditingDishId] = useState<number | null>(null)
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null)
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([])
  const [newIngredient, setNewIngredient] = useState<{ raw_material_id: number, quantity: number }>({ raw_material_id: 0, quantity: 0 })

  useEffect(() => {
    fetchRawMaterials()
    fetchDishes()
  }, [])

  const fetchRawMaterials = async () => {
    const response = await fetch('/api/inventory?action=getRawMaterials')
    const data = await response.json()
    setRawMaterials(data)
  }

  const fetchDishes = async () => {
    const response = await fetch('/api/inventory?action=getDishes')
    const data = await response.json()
    setDishes(data)
  }

  const fetchDishIngredients = async (dishId: number) => {
    const response = await fetch(`/api/inventory?action=getDishIngredients&dishId=${dishId}`)
    const data = await response.json()
    setDishIngredients(data)
  }

  const handleRawMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingRawMaterialId) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRawMaterial', id: editingRawMaterialId, ...newRawMaterial })
      })
    } else {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addRawMaterial', ...newRawMaterial })
      })
    }
    setNewRawMaterial({ name: '', price: 0, stock: 0, unit: '', min_stock: 0 })
    setEditingRawMaterialId(null)
    fetchRawMaterials()
  }

  const handleDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDishId) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateDish', id: editingDishId, ...newDish })
      })
    } else {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addDish', ...newDish })
      })
    }
    setNewDish({ name: '', price: 0, category: '' })
    setEditingDishId(null)
    fetchDishes()
  }

  const handleDeleteRawMaterial = async (id: number) => {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteRawMaterial', id })
    })
    fetchRawMaterials()
  }

  const handleDeleteDish = async (id: number) => {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteDish', id })
    })
    fetchDishes()
  }

  const handleAddIngredient = async () => {
    if (selectedDishId && newIngredient.raw_material_id && newIngredient.quantity) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDishIngredient',
          dishId: selectedDishId,
          ...newIngredient
        })
      })
      fetchDishIngredients(selectedDishId)
      setNewIngredient({ raw_material_id: 0, quantity: 0 })
    }
  }

  const handleDeleteIngredient = async (id: number) => {
    if (selectedDishId) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteDishIngredient', id })
      })
      fetchDishIngredients(selectedDishId)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gestión de Productos</h1>
        <Tabs defaultValue="raw-materials">
          <TabsList>
            <TabsTrigger value="raw-materials">Materias Primas</TabsTrigger>
            <TabsTrigger value="dishes">Platos</TabsTrigger>
          </TabsList>
          <TabsContent value="raw-materials">
            <Card>
              <CardHeader>
                <CardTitle>Materias Primas</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRawMaterialSubmit} className="mb-4 grid grid-cols-6 gap-4">
                  <Input
                    placeholder="Nombre"
                    value={newRawMaterial.name}
                    onChange={(e) => setNewRawMaterial({ ...newRawMaterial, name: e.target.value })}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={newRawMaterial.price}
                    onChange={(e) => setNewRawMaterial({ ...newRawMaterial, price: parseFloat(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={newRawMaterial.stock}
                    onChange={(e) => setNewRawMaterial({ ...newRawMaterial, stock: parseInt(e.target.value) })}
                  />
                  <Input
                    placeholder="Unidad"
                    value={newRawMaterial.unit}
                    onChange={(e) => setNewRawMaterial({ ...newRawMaterial, unit: e.target.value })}
                  />
                  <Button type="submit">{editingRawMaterialId ? 'Actualizar' : 'Agregar'}</Button>
                </form>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.name}</TableCell>
                        <TableCell>${material.price.toFixed(2)}</TableCell>
                        <TableCell>{material.stock}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>
                          <Button onClick={() => setEditingRawMaterialId(material.id)} className="mr-2">Editar</Button>
                          <Button onClick={() => handleDeleteRawMaterial(material.id)} variant="destructive">Eliminar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dishes">
            <Card>
              <CardHeader>
                <CardTitle>Platos</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDishSubmit} className="mb-4 grid grid-cols-4 gap-4">
                  <Input
                    placeholder="Nombre"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: parseFloat(e.target.value) })}
                  />
                  <Input
                    placeholder="Categoría"
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                  />
                  <Button type="submit">{editingDishId ? 'Actualizar' : 'Agregar'}</Button>
                </form>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dishes.map((dish) => (
                      <TableRow key={dish.id}>
                        <TableCell>{dish.name}</TableCell>
                        <TableCell>${dish.price.toFixed(2)}</TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell>
                          <Button onClick={() => setEditingDishId(dish.id)} className="mr-2">Editar</Button>
                          <Button onClick={() => handleDeleteDish(dish.id)} variant="destructive" className="mr-2">Eliminar</Button>
                          <Button onClick={() => {
                            setSelectedDishId(dish.id)
                            fetchDishIngredients(dish.id)
                          }}>Ver Ingredientes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {selectedDishId && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Ingredientes del Plato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <Select
                      value={newIngredient.raw_material_id.toString()}
                      onValueChange={(value) => setNewIngredient({ ...newIngredient, raw_material_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>{material.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) })}
                    />
                    <Button onClick={handleAddIngredient}>Agregar Ingrediente</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dishIngredients.map((ingredient) => (
                        <TableRow key={ingredient.id}>
                          <TableCell>{ingredient.raw_material_name}</TableCell>
                          <TableCell>{ingredient.quantity}</TableCell>
                          <TableCell>{ingredient.unit}</TableCell>
                          <TableCell>
                            <Button onClick={() => handleDeleteIngredient(ingredient.id)} variant="destructive">Eliminar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}


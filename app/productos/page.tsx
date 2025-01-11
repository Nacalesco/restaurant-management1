'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import Layout from '../components/layout'

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([])
  const [nuevoProducto, setNuevoProducto] = useState({ name: '', price: '', stock: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    const response = await fetch('/api/products')
    const products = await response.json()
    setProductos(products)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: nuevoProducto.name,
          price: parseFloat(nuevoProducto.price),
          stock: parseInt(nuevoProducto.stock)
        })
      })
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nuevoProducto.name,
          price: parseFloat(nuevoProducto.price),
          stock: parseInt(nuevoProducto.stock)
        })
      })
    }
    setNuevoProducto({ name: '', price: '', stock: '' })
    setEditingId(null)
    fetchProductos()
  }

  const handleEdit = (product: Product) => {
    setNuevoProducto({ name: product.name, price: product.price.toString(), stock: product.stock.toString() })
    setEditingId(product.id)
  }

  const handleDelete = async (id: number) => {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchProductos()
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gestión de Productos</h1>
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <Input
            placeholder="Nombre"
            value={nuevoProducto.name}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, name: e.target.value })}
            required
          />
          <Input
            placeholder="Precio"
            type="number"
            step="0.01"
            value={nuevoProducto.price}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, price: e.target.value })}
            required
          />
          <Input
            placeholder="Stock"
            type="number"
            value={nuevoProducto.stock}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
            required
          />
          <Button type="submit">{editingId ? 'Actualizar' : 'Agregar'} Producto</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>{producto.name}</TableCell>
                <TableCell>${producto.price.toFixed(2)}</TableCell>
                <TableCell>{producto.stock}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(producto)} className="mr-2">Editar</Button>
                  <Button onClick={() => handleDelete(producto.id)} variant="destructive">Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


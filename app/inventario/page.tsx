'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Layout from '../components/layout'

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  min_stock: number;
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchProducts()
    fetchLowStockProducts()
  }, [])

  const fetchProducts = async () => {
    const response = await fetch('/api/inventory?action=getProducts')
    const data: Product[] = await response.json()
    if (Array.isArray(data)) {
      setProducts(data)
    } else {
      console.error('Received invalid data format for products:', data)
      setProducts([])
    }
    setCategories([...new Set(data.map((p: Product) => p.category))])
  }

  const fetchLowStockProducts = async () => {
    const response = await fetch('/api/inventory?action=getLowStock')
    const data = await response.json()
    setLowStockProducts(data)
  }

  const handleSearch = async () => {
    if (searchQuery) {
      const response = await fetch(`/api/inventory?action=search&query=${searchQuery}`)
      const data = await response.json()
      setProducts(data)
    } else {
      fetchProducts()
    }
  }

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      fetchProducts();
    } else {
      const response = await fetch(`/api/inventory?action=getByCategory&category=${category}`);
      const data = await response.json();
      setProducts(data);
    }
  };

  const handleStockUpdate = async (id: number, newStock: number) => {
    const product = products.find(p => p.id === id)
    if (product) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProduct',
          id,
          name: product.name,
          price: product.price,
          stock: newStock,
          category: product.category,
          minStock: product.min_stock
        })
      })
      fetchProducts()
      fetchLowStockProducts()
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Control de Inventario</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.min_stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Buscar productos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch}>Buscar</Button>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value))}
                      className="w-20 mr-2"
                    />
                    <Button onClick={() => handleStockUpdate(product.id, product.stock + 1)}>+</Button>
                    <Button onClick={() => handleStockUpdate(product.id, Math.max(0, product.stock - 1))} className="ml-2">-</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No products found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


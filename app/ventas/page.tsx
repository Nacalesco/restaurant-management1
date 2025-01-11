'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { format } from 'date-fns'
import Layout from '../components/layout'

interface Sale {
  id: number;
  product_name: string;
  quantity: number;
  total_price: number;
  date: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Sale[]>([])
  const [nuevaVenta, setNuevaVenta] = useState({ productId: '', quantity: '', totalPrice: '' })
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [productos, setProductos] = useState<Product[]>([])

  useEffect(() => {
    fetchVentas()
    fetchProductos()
  }, [])

  const fetchVentas = async () => {
    const response = await fetch('/api/sales')
    const data = await response.json()
    setVentas(data)
  }

  const fetchProductos = async () => {
    const response = await fetch('/api/sales', { method: 'PUT' })
    const data = await response.json()
    setProductos(data)
  }

  const registrarVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuevaVenta.productId && nuevaVenta.quantity) {
      const producto = productos.find(p => p.id === parseInt(nuevaVenta.productId))
      if (producto) {
        const totalPrice = producto.price * parseInt(nuevaVenta.quantity)
        await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: parseInt(nuevaVenta.productId),
            quantity: parseInt(nuevaVenta.quantity),
            totalPrice,
            date: fecha
          })
        })
        fetchVentas()
        setNuevaVenta({ productId: '', quantity: '', totalPrice: '' })
      }
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Registro de Ventas</h1>
        <div className="mb-4">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mb-2"
          />
        </div>
        <form onSubmit={registrarVenta} className="mb-4 flex gap-2">
          <Select value={nuevaVenta.productId} onValueChange={(value) => setNuevaVenta({ ...nuevaVenta, productId: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Producto" />
            </SelectTrigger>
            <SelectContent>
              {productos.map((producto) => (
                <SelectItem key={producto.id} value={producto.id.toString()}>{producto.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Cantidad"
            type="number"
            value={nuevaVenta.quantity}
            onChange={(e) => setNuevaVenta({ ...nuevaVenta, quantity: e.target.value })}
          />
          <Button type="submit">Registrar Venta</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.id}>
                <TableCell>{venta.product_name}</TableCell>
                <TableCell>{venta.quantity}</TableCell>
                <TableCell>${venta.total_price.toFixed(2)}</TableCell>
                <TableCell>{venta.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


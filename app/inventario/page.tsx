'use client'

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import Layout from '../components/layout'

export default function InventarioPage() {
  const [inventario, setInventario] = useState([
    { id: 1, producto: 'Tomate', cantidad: 50 },
    { id: 2, producto: 'Lechuga', cantidad: 30 },
  ])
  const [nuevoItem, setNuevoItem] = useState({ producto: '', cantidad: '' })

  const actualizarInventario = () => {
    if (nuevoItem.producto && nuevoItem.cantidad) {
      const index = inventario.findIndex(item => item.producto === nuevoItem.producto)
      if (index !== -1) {
        const nuevoInventario = [...inventario]
        nuevoInventario[index].cantidad += parseInt(nuevoItem.cantidad)
        setInventario(nuevoInventario)
      } else {
        setInventario([...inventario, { ...nuevoItem, id: Date.now(), cantidad: parseInt(nuevoItem.cantidad) }])
      }
      setNuevoItem({ producto: '', cantidad: '' })
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Control de Inventario</h1>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Producto"
            value={nuevoItem.producto}
            onChange={(e) => setNuevoItem({ ...nuevoItem, producto: e.target.value })}
          />
          <Input
            placeholder="Cantidad"
            type="number"
            value={nuevoItem.cantidad}
            onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
          />
          <Button onClick={actualizarInventario}>Actualizar Inventario</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventario.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.producto}</TableCell>
                <TableCell>{item.cantidad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


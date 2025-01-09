'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { db, Venta, Plato } from '@/lib/db'
import { format } from 'date-fns'
import Layout from '../components/layout'

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [nuevaVenta, setNuevaVenta] = useState<Omit<Venta, 'id'>>({ fecha: '', plato: '', cantidad: 0, total: 0 })
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [platos, setPlatos] = useState<Plato[]>([])

  useEffect(() => {
    setPlatos(db.platos)
    cargarVentas()
  }, [fecha])

  const cargarVentas = () => {
    const ventasDia = db.obtenerVentasPorFecha(fecha)
    setVentas(ventasDia)
  }

  const registrarVenta = () => {
    if (nuevaVenta.plato && nuevaVenta.cantidad) {
      const plato = platos.find(p => p.nombre === nuevaVenta.plato)
      if (plato) {
        const total = plato.precio * nuevaVenta.cantidad
        const ventaCompleta = { ...nuevaVenta, fecha, total }
        db.registrarVenta(ventaCompleta)
        cargarVentas()
        setNuevaVenta({ fecha: '', plato: '', cantidad: 0, total: 0 })
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
        <div className="mb-4 flex gap-2">
          <Select
            value={nuevaVenta.plato}
            onValueChange={(value) => setNuevaVenta({ ...nuevaVenta, plato: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Plato" />
            </SelectTrigger>
            <SelectContent>
              {platos.map((plato) => (
                <SelectItem key={plato.id} value={plato.nombre}>{plato.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Cantidad"
            type="number"
            value={nuevaVenta.cantidad || ''}
            onChange={(e) => setNuevaVenta({ ...nuevaVenta, cantidad: parseInt(e.target.value) })}
          />
          <Button onClick={registrarVenta}>Registrar Venta</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plato</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.id}>
                <TableCell>{venta.plato}</TableCell>
                <TableCell>{venta.cantidad}</TableCell>
                <TableCell>${venta.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  )
}


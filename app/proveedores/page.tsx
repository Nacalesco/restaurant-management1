'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import Layout from '../components/layout'
import { useAuth } from '../components/auth-provider'

interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [nuevoProveedor, setNuevoProveedor] = useState<Omit<Proveedor, 'id'>>({ nombre: '', contacto: '', telefono: '' })
  const { user } = useAuth()

  useEffect(() => {
    // Aquí normalmente cargaríamos los proveedores desde la base de datos
    setProveedores([
      { id: 1, nombre: 'Frutas Frescas S.A.', contacto: 'Juan Pérez', telefono: '123-456-7890' },
      { id: 2, nombre: 'Carnes Premium', contacto: 'María García', telefono: '098-765-4321' },
    ])
  }, [])

  const agregarProveedor = () => {
    if (nuevoProveedor.nombre && nuevoProveedor.contacto && nuevoProveedor.telefono) {
      setProveedores([...proveedores, { ...nuevoProveedor, id: Date.now() }])
      setNuevoProveedor({ nombre: '', contacto: '', telefono: '' })
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Gestión de Proveedores</h1>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Nombre del proveedor"
          value={nuevoProveedor.nombre}
          onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
        />
        <Input
          placeholder="Contacto"
          value={nuevoProveedor.contacto}
          onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: e.target.value })}
        />
        <Input
          placeholder="Teléfono"
          value={nuevoProveedor.telefono}
          onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
        />
        <Button onClick={agregarProveedor}>Agregar Proveedor</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Teléfono</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveedores.map((proveedor) => (
            <TableRow key={proveedor.id}>
              <TableCell>{proveedor.nombre}</TableCell>
              <TableCell>{proveedor.contacto}</TableCell>
              <TableCell>{proveedor.telefono}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Layout>
  )
}


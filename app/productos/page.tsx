'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { db, Producto, Plato } from '@/lib/db'
import Layout from '../components/layout'

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [platos, setPlatos] = useState<Plato[]>([])
  const [nuevoProducto, setNuevoProducto] = useState<Omit<Producto, 'id'>>({ nombre: '', unidad: '', precio: 0, cantidad: 0 })
  const [nuevoPlato, setNuevoPlato] = useState<Omit<Plato, 'id'>>({ nombre: '', precio: 0, receta: {} })
  const [editandoProducto, setEditandoProducto] = useState<string | null>(null)
  const [editandoPlato, setEditandoPlato] = useState<string | null>(null)

  useEffect(() => {
    setProductos(db.productos)
    setPlatos(db.platos)
  }, [])

  const agregarProducto = () => {
    if (nuevoProducto.nombre && nuevoProducto.unidad && nuevoProducto.precio) {
      const producto = db.agregarProducto(nuevoProducto)
      setProductos([...productos, producto])
      setNuevoProducto({ nombre: '', unidad: '', precio: 0, cantidad: 0 })
    }
  }

  const editarProducto = (id: string) => {
    const producto = productos.find(p => p.id === id)
    if (producto) {
      setEditandoProducto(id)
      setNuevoProducto(producto)
    }
  }

  const guardarEdicionProducto = () => {
    if (editandoProducto) {
      const productoEditado = db.editarProducto(editandoProducto, nuevoProducto)
      if (productoEditado) {
        setProductos(productos.map(p => p.id === editandoProducto ? productoEditado : p))
        setEditandoProducto(null)
        setNuevoProducto({ nombre: '', unidad: '', precio: 0, cantidad: 0 })
      }
    }
  }

  const eliminarProducto = (id: string) => {
    if (db.eliminarProducto(id)) {
      setProductos(productos.filter(p => p.id !== id))
    }
  }

  const agregarPlato = () => {
    if (nuevoPlato.nombre && nuevoPlato.precio) {
      const plato = db.agregarPlato(nuevoPlato)
      setPlatos([...platos, plato])
      setNuevoPlato({ nombre: '', precio: 0, receta: {} })
    }
  }

  const editarPlato = (id: string) => {
    const plato = platos.find(p => p.id === id)
    if (plato) {
      setEditandoPlato(id)
      setNuevoPlato(plato)
    }
  }

  const guardarEdicionPlato = () => {
    if (editandoPlato) {
      const platoEditado = db.editarPlato(editandoPlato, nuevoPlato)
      if (platoEditado) {
        setPlatos(platos.map(p => p.id === editandoPlato ? platoEditado : p))
        setEditandoPlato(null)
        setNuevoPlato({ nombre: '', precio: 0, receta: {} })
      }
    }
  }

  const eliminarPlato = (id: string) => {
    if (db.eliminarPlato(id)) {
      setPlatos(platos.filter(p => p.id !== id))
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gestión de Productos y Platos</h1>
        <Tabs defaultValue="productos" className="w-full">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="platos">Platos</TabsTrigger>
          </TabsList>
          <TabsContent value="productos">
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Nombre"
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              />
              <Input
                placeholder="Unidad"
                value={nuevoProducto.unidad}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, unidad: e.target.value })}
              />
              <Input
                placeholder="Precio"
                type="number"
                value={nuevoProducto.precio}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: parseFloat(e.target.value) })}
              />
              <Input
                placeholder="Cantidad"
                type="number"
                value={nuevoProducto.cantidad}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: parseInt(e.target.value) })}
              />
              {editandoProducto ? (
                <Button onClick={guardarEdicionProducto}>Guardar Cambios</Button>
              ) : (
                <Button onClick={agregarProducto}>Agregar Producto</Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.unidad}</TableCell>
                    <TableCell>${producto.precio}</TableCell>
                    <TableCell>{producto.cantidad}</TableCell>
                    <TableCell>
                      <Button onClick={() => editarProducto(producto.id)} className="mr-2">Editar</Button>
                      <Button onClick={() => eliminarProducto(producto.id)} variant="destructive">Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="platos">
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Nombre del plato"
                value={nuevoPlato.nombre}
                onChange={(e) => setNuevoPlato({ ...nuevoPlato, nombre: e.target.value })}
              />
              <Input
                placeholder="Precio"
                type="number"
                value={nuevoPlato.precio}
                onChange={(e) => setNuevoPlato({ ...nuevoPlato, precio: parseFloat(e.target.value) })}
              />
              {editandoPlato ? (
                <Button onClick={guardarEdicionPlato}>Guardar Cambios</Button>
              ) : (
                <Button onClick={agregarPlato}>Agregar Plato</Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platos.map((plato) => (
                  <TableRow key={plato.id}>
                    <TableCell>{plato.nombre}</TableCell>
                    <TableCell>${plato.precio}</TableCell>
                    <TableCell>
                      <Button onClick={() => editarPlato(plato.id)} className="mr-2">Editar</Button>
                      <Button onClick={() => eliminarPlato(plato.id)} variant="destructive">Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}


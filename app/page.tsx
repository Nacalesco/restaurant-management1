'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/app/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import Layout from './components/layout'
import { useAuth } from './components/auth-provider'

export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bienvenido, {user.username}</h1>
        <Button onClick={logout}>Cerrar Sesión</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/productos">
              <Button className="w-full">Ir a Productos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Control de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/inventario">
              <Button className="w-full">Ir a Inventario</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registro de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/ventas">
              <Button className="w-full">Ir a Ventas</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informes y Gráficos</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/informes">
              <Button className="w-full">Ver Informes</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/proveedores">
              <Button className="w-full">Ir a Proveedores</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/notificaciones">
              <Button className="w-full">Ver Notificaciones</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}


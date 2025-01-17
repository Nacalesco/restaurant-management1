'use client'

import { useEffect} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/app/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import Layout from './components/layout'
import { useAuth } from './components/auth-provider'
import { ArrowUpRight } from 'lucide-react'


export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()


  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
    }
  }, [user, router])


  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Bienvenido, {user.username}</h1>
          <Button onClick={logout} variant="outline">Cerrar Sesión</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/productos" passHref>
            <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Gestión de Productos</CardTitle>
                <ArrowUpRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administra tu catálogo de productos y platos
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/inventario" passHref>
            <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Control de Inventario</CardTitle>
                <ArrowUpRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestiona el stock de ingredientes y suministros
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/ventas" passHref>
            <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Registro de Ventas</CardTitle>
                <ArrowUpRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registra y consulta las ventas diarias
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/informes" passHref>
            <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Informes y Gráficos</CardTitle>
                <ArrowUpRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analiza el rendimiento de tu negocio
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/notificaciones" passHref>
            <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Notificaciones</CardTitle>
                <ArrowUpRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Revisa alertas y mensajes importantes
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  )
}


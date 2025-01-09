'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import Layout from '../components/layout'
import { useAuth } from '../components/auth-provider'
import { db } from '@/lib/db'

interface Notificacion {
  id: number;
  mensaje: string;
  tipo: 'warning' | 'info';
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const { user } = useAuth()

  useEffect(() => {
    // Aquí normalmente cargaríamos las notificaciones desde la base de datos
    const productosConBajoStock = db.productos.filter(p => p.cantidad < 10)
    const nuevasNotificaciones = productosConBajoStock.map(p => ({
      id: Number(p.id),
      mensaje: `Stock bajo para ${p.nombre}: ${p.cantidad} ${p.unidad}`,
      tipo: 'warning' as const
    }))
    setNotificaciones(nuevasNotificaciones)
  }, [])

  if (!user) {
    return null
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Notificaciones</h1>
      <div className="grid gap-4">
        {notificaciones.map((notificacion) => (
          <Card key={notificacion.id} className={notificacion.tipo === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}>
            <CardHeader>
              <CardTitle>{notificacion.tipo === 'warning' ? 'Advertencia' : 'Información'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{notificacion.mensaje}</p>
            </CardContent>
          </Card>
        ))}
        {notificaciones.length === 0 && (
          <p>No hay notificaciones nuevas.</p>
        )}
      </div>
    </Layout>
  )
}


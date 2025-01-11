'use client'

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Layout from '../components/layout'

interface ReportData {
  totalSales: { total: number };
  topProducts: { name: string; total_quantity: number }[];
}

export default function InformesPage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [reporte, setReporte] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generarReporte = async () => {
    if (fechaInicio && fechaFin) {
      try {
        const response = await fetch(`/api/reports?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
        if (!response.ok) {
          throw new Error('Error al obtener los datos del reporte')
        }
        const data = await response.json()
        setReporte(data)
        setError(null)
      } catch (err) {
        console.error('Error al generar el reporte:', err)
        setError('Hubo un error al generar el reporte. Por favor, inténtelo de nuevo.')
        setReporte(null)
      }
    } else {
      setError('Por favor, seleccione las fechas de inicio y fin.')
    }
  }

  const exportarExcel = () => {
    // Aquí iría la lógica para exportar a Excel
    alert('Función de exportar a Excel no implementada')
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Informes y Gráficos</h1>
        <div className="mb-4 flex gap-2">
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            placeholder="Fecha de inicio"
          />
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            placeholder="Fecha de fin"
          />
          <Button onClick={generarReporte}>Generar Reporte</Button>
          <Button onClick={exportarExcel}>Exportar a Excel</Button>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {reporte && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Total de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${reporte.totalSales.total.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {reporte.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reporte.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_quantity" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No hay datos de ventas para el período seleccionado.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}


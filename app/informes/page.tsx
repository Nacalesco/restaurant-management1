"use client";

import React, { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/layout'
import * as XLSX from 'xlsx'
import { CalendarIcon } from 'lucide-react'

interface ReportData {
  totalSales: { total: number };
  topDishes: { name: string; total_quantity: number }[];
  rawMaterialsUsed: { name: string; unit: string; total_used: number }[];
}

export default function InformesPage() {
  const [selectedTab, setSelectedTab] = useState('single')
  const [singleDate, setSingleDate] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [reporte, setReporte] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const adjustDateForTimezone = (dateStr: string, isEndDate: boolean = false) => {
    const date = new Date(dateStr)
    // Ajustamos a la zona horaria de Argentina (UTC-3)
    date.setHours(isEndDate ? 23 : 0, isEndDate ? 59 : 0, isEndDate ? 59 : 0)
    return date.toISOString()
  }

  const generarReporte = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let startDate, endDate;
      
      if (selectedTab === 'single') {
        if (!singleDate) {
          throw new Error('Por favor seleccione una fecha')
        }
        startDate = adjustDateForTimezone(singleDate)
        endDate = adjustDateForTimezone(singleDate, true)
      } else {
        if (!dateRange.start || !dateRange.end) {
          throw new Error('Por favor seleccione ambas fechas')
        }
        startDate = adjustDateForTimezone(dateRange.start)
        endDate = adjustDateForTimezone(dateRange.end, true)
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate
      })

      const response = await fetch(`/api/reports?${queryParams}`)

      if (!response.ok) {
        throw new Error('Error al generar el reporte')
      }
      
      const data = await response.json()
      if (!data.totalSales && !data.topDishes && !data.rawMaterialsUsed) {
        throw new Error('No se encontraron datos para el período seleccionado')
      }

      setReporte({
        totalSales: data.totalSales || { total: 0 },
        topDishes: data.topDishes || [],
        rawMaterialsUsed: data.rawMaterialsUsed || []
      })
    } catch (err) {
      console.error('Error completo:', err)
      setError(err instanceof Error ? err.message : 'Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    if (!reporte) return

    const dateStr = selectedTab === 'single' ? singleDate : `${dateRange.start}_${dateRange.end}`
    const fileName = `Reporte_${dateStr}.xlsx`

    const wb = XLSX.utils.book_new()
    
    // Ventas Totales
    const ventasWs = XLSX.utils.aoa_to_sheet([
      ['Reporte de Ventas'],
      ['Período', selectedTab === 'single' ? singleDate : `${dateRange.start} - ${dateRange.end}`],
      [''],
      ['Total de Ventas', reporte.totalSales.total.toFixed(2)]
    ])
    XLSX.utils.book_append_sheet(wb, ventasWs, 'Resumen')

    // Platos Vendidos
    const platosWs = XLSX.utils.aoa_to_sheet([
      ['Platos Más Vendidos'],
      ['Plato', 'Cantidad'],
      ...reporte.topDishes.map(dish => [dish.name, dish.total_quantity])
    ])
    XLSX.utils.book_append_sheet(wb, platosWs, 'Platos')

    // Materia Prima
    const materiaPrimaWs = XLSX.utils.aoa_to_sheet([
      ['Consumo de Materia Prima'],
      ['Ingrediente', 'Unidad', 'Cantidad'],
      ...reporte.rawMaterialsUsed.map(m => [m.name, m.unit, m.total_used])
    ])
    XLSX.utils.book_append_sheet(wb, materiaPrimaWs, 'Ingredientes')

    XLSX.writeFile(wb, fileName)
  }

  const SalesOverview = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventas Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">
            ${reporte?.totalSales.total.toFixed(2)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Plato Más Vendido</CardTitle>
        </CardHeader>
        <CardContent>
          {reporte?.topDishes[0] && (
            <>
              <p className="text-2xl font-semibold">{reporte.topDishes[0].name}</p>
              <p className="text-lg text-muted-foreground">
                {reporte.topDishes[0].total_quantity} unidades
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Informes y Estadísticas</h1>
          {reporte && (
            <Button 
              onClick={exportarExcel}
              className="bg-green-600 hover:bg-green-700"
            >
              Exportar a Excel
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="single">Día Específico</TabsTrigger>
                <TabsTrigger value="range">Rango de Fechas</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={generarReporte} disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="range" className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={generarReporte} disabled={loading}>
                    {loading ? 'Generando...' : 'Generar Reporte'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {reporte && (
          <div className="space-y-6">
            <SalesOverview />

            <Card>
              <CardHeader>
                <CardTitle>Platos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reporte.topDishes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_quantity" fill="#3b82f6" name="Cantidad Vendida" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumo de Ingredientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Top Ingredientes</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reporte.rawMaterialsUsed
                        .sort((a, b) => b.total_used - a.total_used)
                        .slice(0, 5)
                        .map((material, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{material.name}</TableCell>
                            <TableCell className="text-right">
                              {material.total_used.toFixed(2)} {material.unit}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reporte.rawMaterialsUsed.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total_used" fill="#10b981" name="Cantidad Usada" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
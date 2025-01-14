'use client'

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Layout from '../components/layout'
import * as XLSX from 'xlsx'

interface ReportData {
  totalSales: { total: number };
  topDishes: { name: string; total_quantity: number }[];
  rawMaterialsUsed: { name: string; unit: string; total_used: number }[];
}

export default function InformesPage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [reporte, setReporte] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generarReporte = async () => {
    if (fechaInicio && fechaFin) {
      try {
        const response = await fetch(`/api/reports?startDate=${fechaInicio}&endDate=${fechaFin}`)
        if (!response.ok) {
          throw new Error('Error al generar el reporte')
        }
        const data = await response.json()
        setReporte({
          totalSales: data.totalSales || { total: 0 },
          topDishes: data.topDishes || [],
          rawMaterialsUsed: data.rawMaterialsUsed || []
        })
        setError(null)
      } catch (err) {
        setError('Error al generar el reporte')
        console.error(err)
      }
    }
  }

  const exportarExcel = () => {
    if (!reporte) return

    const wb = XLSX.utils.book_new()

    // Hoja de Ventas Totales
    const ventasData = [['Total de Ventas', reporte.totalSales.total]]
    const ventasWs = XLSX.utils.aoa_to_sheet(ventasData)
    XLSX.utils.book_append_sheet(wb, ventasWs, 'Ventas Totales')

    // Hoja de Platos más Vendidos
    const platosData = [['Plato', 'Cantidad Vendida'], 
      ...reporte.topDishes.map(dish => [dish.name, dish.total_quantity])]
    const platosWs = XLSX.utils.aoa_to_sheet(platosData)
    XLSX.utils.book_append_sheet(wb, platosWs, 'Platos Vendidos')

    // Hoja de Materia Prima
    const materiaPrimaData = [['Ingrediente', 'Unidad', 'Cantidad Utilizada'], 
      ...reporte.rawMaterialsUsed.map(material => [
        material.name, 
        material.unit, 
        material.total_used
      ])]
    const materiaWs = XLSX.utils.aoa_to_sheet(materiaPrimaData)
    XLSX.utils.book_append_sheet(wb, materiaWs, 'Materia Prima')

    XLSX.writeFile(wb, `Reporte_${fechaInicio}_${fechaFin}.xlsx`)
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
          <Button 
            onClick={exportarExcel}
            disabled={!reporte}
            className="bg-green-600 hover:bg-green-700"
          >
            Exportar a Excel
          </Button>
        </div>

        {error && (
          <div className="text-red-500 mb-4">{error}</div>
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

            {reporte.topDishes && reporte.topDishes.length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Platos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reporte.topDishes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_quantity" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {reporte.rawMaterialsUsed && reporte.rawMaterialsUsed.length > 0 && (
              <>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Resumen de Materia Prima Utilizada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingrediente</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="text-right">Cantidad Utilizada</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reporte.rawMaterialsUsed.map((material, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell className="text-right">
                                {material.total_used.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reporte.rawMaterialsUsed}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_used" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Consumo de Ingredientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Top 5 Ingredientes más Utilizados</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Posición</TableHead>
                              <TableHead>Ingrediente</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>% del Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reporte.rawMaterialsUsed
                              .sort((a, b) => b.total_used - a.total_used)
                              .slice(0, 5)
                              .map((material, index) => {
                                const totalUsage = reporte.rawMaterialsUsed.reduce((acc, curr) => acc + curr.total_used, 0);
                                const percentage = (material.total_used / totalUsage) * 100;
                                return (
                                  <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>{`${material.total_used.toFixed(2)} ${material.unit}`}</TableCell>
                                    <TableCell>{`${percentage.toFixed(1)}%`}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">Ingredientes con Menor Uso</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ingrediente</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>% del Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reporte.rawMaterialsUsed
                              .sort((a, b) => a.total_used - b.total_used)
                              .slice(0, 5)
                              .map((material, index) => {
                                const totalUsage = reporte.rawMaterialsUsed.reduce((acc, curr) => acc + curr.total_used, 0);
                                const percentage = (material.total_used / totalUsage) * 100;
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>{`${material.total_used.toFixed(2)} ${material.unit}`}</TableCell>
                                    <TableCell>{`${percentage.toFixed(1)}%`}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
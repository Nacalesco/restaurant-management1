'use client'

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { db } from '@/lib/db'
import Layout from '../components/layout'
import * as XLSX from 'xlsx';

export default function InformesPage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [reporte, setReporte] = useState<{ totalVentas: number, platosMasVendidos: [string, number][] } | null>(null)

  const generarReporte = () => {
    if (fechaInicio && fechaFin) {
      const resultado = db.obtenerReporteVentas(fechaInicio, fechaFin)
      setReporte(resultado)
    }
  }

  const exportarExcel = () => {
    if (reporte) {
      // Crear una hoja de cálculo
      const ws = XLSX.utils.json_to_sheet([
        { "Total de Ventas": reporte.totalVentas },
        { "Plato": "Cantidad" },
        ...reporte.platosMasVendidos.map(([nombre, cantidad]) => ({ "Plato": nombre, "Cantidad": cantidad }))
      ]);

      // Crear un libro de trabajo y añadir la hoja
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");

      // Guardar el archivo
      XLSX.writeFile(wb, `Reporte_Ventas_${fechaInicio}_a_${fechaFin}.xlsx`);
    } else {
      alert('Por favor, genera un reporte primero.');
    }
  };

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
        {reporte && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Total de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${reporte.totalVentas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Platos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reporte.platosMasVendidos.map(([nombre, cantidad]) => ({ nombre, cantidad }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}


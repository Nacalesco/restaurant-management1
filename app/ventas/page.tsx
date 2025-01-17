'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, TrendingUp, DollarSign, Package } from 'lucide-react';
import Layout from '../components/layout';
import { Alert, AlertDescription } from "@/app/components/ui/alert";

interface Dish {
  id: number;
  name: string;
  price: number;
}

interface Sale {
  id: number;
  dish_name: string;
  quantity: number;
  total_price: number;
  date: string;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [nuevaVenta, setNuevaVenta] = useState({ dishId: '', quantity: '1' });
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [platos, setPlatos] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [stockWarning, setStockWarning] = useState<{
    lowStockIngredients: Array<{
      name: string;
      required: number;
      available: number;
      unit: string;
    }>;
  } | null>(null);

  useEffect(() => {
    cargarVentas();
    cargarPlatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  useEffect(() => {
    const dish = platos.find(p => p.id.toString() === nuevaVenta.dishId);
    setSelectedDish(dish || null);
  }, [nuevaVenta.dishId, platos]);

  const verificarStock = async (dishId: string, quantity: string) => {
    try {
      const response = await fetch(`/api/check-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishId: parseInt(dishId),
          quantity: parseInt(quantity)
        }),
      });
      
      const data = await response.json();
      if (!data.hasEnoughStock) {
        setStockWarning(data);
        return false;
      }
      setStockWarning(null);
      return true;
    } catch (err) {
      console.error('Error checking stock:', err);
      return false;
    }
  };

  // Modificar useEffect para verificar stock cuando cambia la cantidad o el plato
  useEffect(() => {
    if (nuevaVenta.dishId && nuevaVenta.quantity) {
      verificarStock(nuevaVenta.dishId, nuevaVenta.quantity);
    }
  }, [nuevaVenta.dishId, nuevaVenta.quantity]);

  const registrarVenta = async () => {
    if (!nuevaVenta.dishId || parseInt(nuevaVenta.quantity) <= 0) {
      setError('Por favor, ingrese datos válidos.');
      return;
    }

    try {
      // Verificar stock antes de proceder
      const stockSuficiente = await verificarStock(nuevaVenta.dishId, nuevaVenta.quantity);
      if (!stockSuficiente) {
        return;
      }

      const plato = platos.find(p => p.id.toString() === nuevaVenta.dishId);
      if (plato) {
        const total = plato.price * parseInt(nuevaVenta.quantity);
        const fechaVenta = new Date(fecha);
        const horaActual = new Date();
        fechaVenta.setHours(horaActual.getHours(), horaActual.getMinutes(), horaActual.getSeconds());
        
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishId: parseInt(nuevaVenta.dishId),
            quantity: parseInt(nuevaVenta.quantity),
            totalPrice: total,
            date: fechaVenta.toISOString(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error registering sale');
        }

        await cargarVentas();
        setNuevaVenta({ dishId: '', quantity: '1' });
        setError(null);
        setStockWarning(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al registrar la venta. Por favor, intente de nuevo.');
      } else {
        setError('Error al registrar la venta. Por favor, intente de nuevo.');
      }
    }
  };

  const cargarVentas = async () => {
    setIsLoading(true);
    try {
      // Aseguramos que la fecha esté en formato ISO
      const fechaConsulta = new Date(fecha);
      fechaConsulta.setHours(0, 0, 0, 0);
      const response = await fetch(`/api/sales?date=${fechaConsulta.toISOString()}`);
      if (!response.ok) throw new Error('Error fetching sales');
      const data = await response.json();
      setVentas(data);
      setError(null);
    } catch {
      setError('Error al cargar las ventas. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarPlatos = async () => {
    try {
      const response = await fetch('/api/dishes');
      if (!response.ok) throw new Error('Error fetching dishes');
      const data = await response.json();
      setPlatos(data);
    } catch  {
      setError('Error al cargar los platos. Por favor, intente de nuevo.');
    }
  };


  const eliminarVenta = async (id: number) => {
    try {
      if (!window.confirm('¿Está seguro de que desea eliminar esta venta?')) return;
      const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error deleting sale');
      await cargarVentas();
    } catch {
      setError('Error al eliminar la venta.');
    }
  };

  const calculateTotal = (ventas: Sale[]) => {
    return ventas.reduce((sum, venta) => sum + venta.total_price, 0);
  };

  const calculateTotalItems = (ventas: Sale[]) => {
    return ventas.reduce((sum, venta) => sum + venta.quantity, 0);
  };

  const calculateAverageTicket = (ventas: Sale[]) => {
    if (ventas.length === 0) return 0;
    return calculateTotal(ventas) / ventas.length;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return "Error en fecha";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Registro de Ventas</h1>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-40"
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${calculateTotal(ventas).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Vendidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateTotalItems(ventas)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${calculateAverageTicket(ventas).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nueva Venta</CardTitle>
          </CardHeader>
          <CardContent>
            {stockWarning && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Stock insuficiente para los siguientes ingredientes:
                  <ul className="mt-2 list-disc list-inside">
                    {stockWarning.lowStockIngredients.map((ing, index) => (
                      <li key={index}>
                        {ing.name}: Necesita {ing.required} {ing.unit}, 
                        Disponible {ing.available} {ing.unit}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={nuevaVenta.dishId}
                onValueChange={(value) => setNuevaVenta({ ...nuevaVenta, dishId: value })}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Seleccionar plato" />
                </SelectTrigger>
                <SelectContent>
                  {platos.map((plato) => (
                    <SelectItem key={plato.id} value={plato.id.toString()}>
                      {plato.name} - ${plato.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Cantidad"
                type="number"
                value={nuevaVenta.quantity}
                onChange={(e) => setNuevaVenta({ ...nuevaVenta, quantity: e.target.value })}
                min="1"
                className="w-full md:w-32"
              />

              <div className="flex-1 flex items-center">
                {selectedDish && (
                  <span className="text-sm text-muted-foreground">
                    Total: ${(selectedDish.price * parseInt(nuevaVenta.quantity || '0')).toFixed(2)}
                  </span>
                )}
              </div>

              <Button 
                onClick={registrarVenta}
                className="w-full md:w-auto"
                disabled={!nuevaVenta.dishId || !nuevaVenta.quantity}
              >
                Registrar Venta
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas del Día</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : ventas.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay ventas registradas para esta fecha</p>
            ) : (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Plato</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>{formatDateTime(venta.date)}</TableCell>
                        <TableCell>{venta.dish_name}</TableCell>
                        <TableCell>{venta.quantity}</TableCell>
                        <TableCell>${venta.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            onClick={() => eliminarVenta(venta.id)} 
                            variant="destructive"
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Layout from '../components/layout';

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
  const [nuevaVenta, setNuevaVenta] = useState({ dishId: '', quantity: '' });
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [platos, setPlatos] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cargarVentas();
    cargarPlatos();
  }, [fecha]);

  const cargarVentas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sales?date=${fecha}`);
      if (!response.ok) {
        throw new Error('Error fetching sales');
      }
      const data = await response.json();
      setVentas(data);
      setError(null);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Error al cargar las ventas. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarPlatos = async () => {
    try {
      const response = await fetch('/api/dishes');
      if (!response.ok) {
        throw new Error('Error fetching dishes');
      }
      const data = await response.json();
      setPlatos(data);
    } catch (err) {
      console.error('Error loading dishes:', err);
      setError('Error al cargar los platos. Por favor, intente de nuevo.');
    }
  };

  const registrarVenta = async () => {
    if (!nuevaVenta.dishId || parseInt(nuevaVenta.quantity) <= 0) {
      setError('Por favor, ingrese datos válidos.');
      return;
    }

    try {
      const plato = platos.find(p => p.id.toString() === nuevaVenta.dishId);
      if (plato) {
        const total = plato.price * parseInt(nuevaVenta.quantity);
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishId: parseInt(nuevaVenta.dishId),
            quantity: parseInt(nuevaVenta.quantity),
            totalPrice: total,
            date: fecha,
          }),
        });

        if (!response.ok) {
          throw new Error('Error registering sale');
        }

        await cargarVentas();
        setNuevaVenta({ dishId: '', quantity: '' });
        setError(null);
      }
    } catch (err) {
      console.error('Error registering sale:', err);
      setError('Error al registrar la venta. Por favor, intente de nuevo.');
    }
  };

  const eliminarVenta = async (id: number) => {
    try {
      if (!window.confirm('¿Está seguro de que desea eliminar esta venta?')) return;
      const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error deleting sale');
      await cargarVentas();
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Error al eliminar la venta.');
    }
  };
  const calculateTotal = (ventas: Sale[]) => {
    return ventas.reduce((sum, venta) => sum + venta.total_price, 0)
  }

  interface VentasTableProps {
    ventas: Sale[];
    titulo: string;
    onDelete: (id: number) => void;
  }

  const VentasTable = ({ ventas, titulo, onDelete }: VentasTableProps) => (
    <>
      <h2 className="text-2xl font-bold mt-6 mb-2">{titulo}</h2>
      {ventas.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay ventas registradas</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Plato</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell>{format(new Date(venta.date), 'dd/MM/yyyy', { locale: es })}</TableCell>
                  <TableCell>{venta.dish_name}</TableCell>
                  <TableCell>{venta.quantity}</TableCell>
                  <TableCell>${venta.total_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => onDelete(venta.id)} 
                      variant="destructive"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <strong>Total: ${calculateTotal(ventas).toFixed(2)}</strong>
          </div>
        </>
      )}
    </>
  )

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Registro de Ventas</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mb-2"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <Select
            value={nuevaVenta.dishId}
            onValueChange={(value) => setNuevaVenta({ ...nuevaVenta, dishId: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar plato" />
            </SelectTrigger>
            <SelectContent>
              {platos.map((plato) => (
                <SelectItem key={plato.id} value={plato.id.toString()}>
                  {plato.name}
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
          />

          <Button onClick={registrarVenta}>Registrar Venta</Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <VentasTable 
              ventas={ventas} 
              titulo="Ventas" 
              onDelete={eliminarVenta} 
            />
          </>
        )}
      </div>
    </Layout>
  )
}
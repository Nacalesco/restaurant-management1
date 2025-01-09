import { v4 as uuidv4 } from 'uuid';

export interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  precio: number;
  cantidad: number;
}

export interface Plato {
  id: string;
  nombre: string;
  precio: number;
  receta: { [key: string]: number };
}

export interface Venta {
  id: string;
  fecha: string;
  plato: string;
  cantidad: number;
  total: number;
}

class DB {
  productos: Producto[] = [
    { id: uuidv4(), nombre: 'Tomate', unidad: 'kg', precio: 2.5, cantidad: 50 },
    { id: uuidv4(), nombre: 'Lechuga', unidad: 'unidad', precio: 1.0, cantidad: 30 },
    { id: uuidv4(), nombre: 'Carne', unidad: 'kg', precio: 10.0, cantidad: 20 },
    { id: uuidv4(), nombre: 'Pan', unidad: 'unidad', precio: 0.5, cantidad: 100 },
  ];

  platos: Plato[] = [
    { 
      id: uuidv4(), 
      nombre: 'Hamburguesa', 
      precio: 10, 
      receta: { 'Carne': 0.2, 'Pan': 2, 'Tomate': 0.1, 'Lechuga': 0.1 } 
    },
    { 
      id: uuidv4(), 
      nombre: 'Ensalada', 
      precio: 8, 
      receta: { 'Lechuga': 0.5, 'Tomate': 0.2 } 
    },
  ];

  ventas: Venta[] = [];

  agregarProducto(producto: Omit<Producto, 'id'>) {
    const nuevoProducto = { ...producto, id: uuidv4() };
    this.productos.push(nuevoProducto);
    return nuevoProducto;
  }

  editarProducto(id: string, producto: Partial<Producto>) {
    const index = this.productos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.productos[index] = { ...this.productos[index], ...producto };
      return this.productos[index];
    }
    return null;
  }

  eliminarProducto(id: string) {
    const index = this.productos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.productos.splice(index, 1);
      return true;
    }
    return false;
  }

  agregarPlato(plato: Omit<Plato, 'id'>) {
    const nuevoPlato = { ...plato, id: uuidv4() };
    this.platos.push(nuevoPlato);
    return nuevoPlato;
  }

  editarPlato(id: string, plato: Partial<Plato>) {
    const index = this.platos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.platos[index] = { ...this.platos[index], ...plato };
      return this.platos[index];
    }
    return null;
  }

  eliminarPlato(id: string) {
    const index = this.platos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.platos.splice(index, 1);
      return true;
    }
    return false;
  }

  registrarVenta(venta: Omit<Venta, 'id'>) {
    const nuevaVenta = { ...venta, id: uuidv4() };
    this.ventas.push(nuevaVenta);
    
    // Actualizar inventario
    const plato = this.platos.find(p => p.nombre === venta.plato);
    if (plato) {
      for (const [ingrediente, cantidad] of Object.entries(plato.receta)) {
        const producto = this.productos.find(p => p.nombre === ingrediente);
        if (producto) {
          producto.cantidad -= cantidad * venta.cantidad;
        }
      }
    }
    
    return nuevaVenta;
  }

  obtenerVentasPorFecha(fecha: string) {
    return this.ventas.filter(v => v.fecha === fecha);
  }

  obtenerReporteVentas(fechaInicio: string, fechaFin: string) {
    const ventasFiltradas = this.ventas.filter(v => v.fecha >= fechaInicio && v.fecha <= fechaFin);
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
    const platosMasVendidos = Object.entries(
      ventasFiltradas.reduce((acc, v) => {
        acc[v.plato] = (acc[v.plato] || 0) + v.cantidad;
        return acc;
      }, {} as { [key: string]: number })
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalVentas, platosMasVendidos };
  }
}

export const db = new DB();


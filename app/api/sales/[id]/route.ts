// app/api/sales/[id]/route.ts
import { NextResponse } from 'next/server';
import { deleteSale } from '@/lib/db-server'; // Asegúrate que la ruta a tu archivo db sea correcta

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await deleteSale(id);
    return NextResponse.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la venta:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: 'Error al eliminar la venta', error: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: 'Error al eliminar la venta', error: 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
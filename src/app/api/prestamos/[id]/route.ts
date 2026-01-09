import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Obtener un préstamo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const prestamo = await prisma.prestamo.findUnique({
      where: { id: idNum },
      include: { cliente: true, cobrador: true },
    });
    if (!prestamo) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ prestamo });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener préstamo' }, { status: 500 });
  }
}

// PUT: Editar préstamo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const body = await request.json();
    const { clienteId, montoPrestado, tasa, cuotas, fechaInicio, notas, cobradorId } = body;
    const prestamo = await prisma.prestamo.update({
      where: { id: idNum },
      data: {
        clienteId,
        montoPrestado,
        tasa: Number(tasa),
        cuotas,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        notas: notas || null,
        cobradorId,
      },
    });
    return NextResponse.json({ prestamo });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar préstamo' }, { status: 500 });
  }
}

// DELETE: Eliminar préstamo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    await prisma.prestamo.delete({ where: { id: idNum } });
    return NextResponse.json({ message: 'Préstamo eliminado' });
  } catch (error) {
    // Captura el mensaje real
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PATCH: Cambiar orden (drag and drop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const { toOrden } = await request.json();
    // trae el préstamo que se va a mover y el que tiene el orden de destino
    const prestamoToMove = await prisma.prestamo.findUnique({ where: { id: idNum } });
    const prestamoSwap = await prisma.prestamo.findFirst({ where: { orden: toOrden } });
    if (!prestamoToMove || !prestamoSwap) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }
    // Intercambiar orden
    await prisma.prestamo.update({ where: { id: prestamoToMove.id }, data: { orden: toOrden } });
    await prisma.prestamo.update({ where: { id: prestamoSwap.id }, data: { orden: prestamoToMove.orden } });
    return NextResponse.json({ message: 'Orden cambiado' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const abono = await prisma.abono.findUnique({
      where: { id: idNum },
      include: {
        prestamo: { include: { cliente: true } },
        cobrador: true,
      },
    });
    if (!abono) return NextResponse.json({ error: 'Abono no encontrado' }, { status: 404 });
    return NextResponse.json({ abono });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener abono' }, { status: 500 });
  }
}

// PUT: Editar abono
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    const body = await request.json();
    const { prestamoId, monto, tipoPago, notas, fecha } = body;
    if (!prestamoId || !monto || !tipoPago) {
      return NextResponse.json({ error: 'Campos faltantes' }, { status: 400 });
    }
    const abono = await prisma.abono.update({
      where: { id: idNum },
      data: {
        prestamoId: Number(prestamoId),
        monto: String(monto),
        tipoPago,
        notas: notas || null,
        fecha: fecha ? new Date(fecha) : undefined,
      },
    });
    return NextResponse.json({ abono });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    await prisma.abono.delete({ where: { id: idNum } });
    return NextResponse.json({ message: 'Abono eliminado' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


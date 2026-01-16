import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    // If the incoming fecha is a date-only string (YYYY-MM-DD) we will NOT overwrite
    // the existing timestamp to avoid losing the original time component.
    const updateData: Prisma.AbonoUpdateInput = {
      prestamo: { connect: { id: Number(prestamoId) } },
      monto: String(monto),
      tipoPago,
      notas: notas || null,
    };
    if (fecha && typeof fecha === 'string' && fecha.includes('T')) {
      updateData.fecha = new Date(fecha);
    } else if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      // date-only provided -- do not overwrite existing timestamp
    }

    const abono = await prisma.abono.update({
      where: { id: idNum },
      data: updateData,
    });
    // Recalculate estado del préstamo asociado
    try {
      const prestamo = await prisma.prestamo.findUnique({ where: { id: Number(prestamoId) } });
      if (prestamo) {
        const agg = await prisma.abono.aggregate({ where: { prestamoId: Number(prestamoId) }, _sum: { monto: true } });
        const sumMonto = agg._sum.monto ? Number(String(agg._sum.monto)) : 0;
        const totalPagar = Math.trunc(Number(String(prestamo.montoPrestado)) * (1 + Number(prestamo.tasa)));
        await prisma.prestamo.update({
          where: { id: Number(prestamoId) },
          data: { estado: sumMonto >= totalPagar ? 'INACTIVO' : 'ACTIVO' } as Prisma.PrestamoUpdateInput,
        });
      }
    } catch (e) {
      console.error('Error actualizando estado del préstamo después de editar abono', e);
    }

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
    // find abono to know prestamoId
    const abono = await prisma.abono.findUnique({ where: { id: idNum } });
    if (!abono) return NextResponse.json({ error: 'Abono no encontrado' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.abono.delete({ where: { id: idNum } });

      // Recalculate suma de abonos y actualizar estado del préstamo
      const prestamo = await tx.prestamo.findUnique({ where: { id: abono.prestamoId } });
      if (prestamo) {
        const agg = await tx.abono.aggregate({ where: { prestamoId: abono.prestamoId }, _sum: { monto: true } });
        const sumMonto = agg._sum.monto ? Number(String(agg._sum.monto)) : 0;
        const totalPagar = Number(String(prestamo.montoPrestado)) * (1 + Number(prestamo.tasa));
        await tx.prestamo.update({
          where: { id: abono.prestamoId },
          data: { estado: sumMonto >= totalPagar ? 'INACTIVO' : 'ACTIVO' } as Prisma.PrestamoUpdateInput,
        });
      }
    });

    return NextResponse.json({ message: 'Abono eliminado' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


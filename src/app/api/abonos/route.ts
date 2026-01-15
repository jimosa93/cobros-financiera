import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

// GET: list abonos with pagination/search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const prestamoId = searchParams.get('prestamoId');

    let where: any = {};
    if (prestamoId) {
      where = { prestamoId: Number(prestamoId) };
    } else if (search) {
      where = {
        OR: [{ notas: { contains: search, mode: 'insensitive' } }],
      };
    }

    const total = await prisma.abono.count({ where });
    const abonos = await prisma.abono.findMany({
      where,
      include: {
        prestamo: { include: { cliente: true } },
        cobrador: { select: { id: true, nombreCompleto: true } },
      },
      orderBy: { fecha: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // aggregate sum of monto for the where clause
    const agg = await prisma.abono.aggregate({
      where,
      _sum: { monto: true },
    });
    const sumMonto = agg._sum.monto ? String(agg._sum.monto) : "0";

    return NextResponse.json({ abonos, total, sumMonto });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al listar abonos' }, { status: 500 });
  }
}

// POST: create abono
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { prestamoId, monto, tipoPago, notas, fecha } = body;
    if (!prestamoId || !monto || !tipoPago) {
      return NextResponse.json({ error: 'Campos faltantes' }, { status: 400 });
    }
    // Create abono and update prestamo.estado atomically
    const result = await prisma.$transaction(async (tx) => {
      // Lock prestamo row to avoid race conditions
      await tx.$executeRaw`SELECT id FROM "Prestamo" WHERE id = ${Number(prestamoId)} FOR UPDATE`;

      const prestamo = await tx.prestamo.findUnique({ where: { id: Number(prestamoId) } });
      if (!prestamo) throw new Error('Préstamo no encontrado');
      if ((prestamo as any).estado === 'INACTIVO') throw new Error('No se puede abonar a un préstamo inactivo');

      const abono = await tx.abono.create({
        data: {
          prestamoId: Number(prestamoId),
          cobradorId: Number(user.id),
          fecha: fecha ? new Date(fecha) : new Date(),
          monto: String(monto),
          tipoPago,
          notas: notas || null,
        },
      });

      // Recalculate suma de abonos para este préstamo
      const agg = await tx.abono.aggregate({
        where: { prestamoId: Number(prestamoId) },
        _sum: { monto: true },
      });
      const sumMonto = agg._sum.monto ? Number(String(agg._sum.monto)) : 0;

      // total a pagar según montoPrestado y tasa (coherente con la UI)
      const totalPagar = Math.trunc(Number(String(prestamo.montoPrestado)) * (1 + Number(prestamo.tasa)));
      if (sumMonto >= totalPagar) {
        await tx.prestamo.update({
          where: { id: Number(prestamoId) },
          data: { estado: 'INACTIVO' } as Prisma.PrestamoUpdateInput,
        });
      }

      return abono;
    });

    return NextResponse.json({ abono: result }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const abono = await prisma.abono.create({
      data: {
        prestamoId: Number(prestamoId),
        cobradorId: Number(user.id),
        fecha: fecha ? new Date(fecha) : new Date(),
        monto: String(monto),
        tipoPago,
        notas: notas || null,
      },
    });
    return NextResponse.json({ abono }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


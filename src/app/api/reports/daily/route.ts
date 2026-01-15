import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function startEndOfDayUTC(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0));
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;
    const { start, end } = startEndOfDayUTC(dateParam);

    // total abonos (sum and count)
    const totalAbonos = await prisma.abono.aggregate({
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });

    // abonos grouped by cobradorId
    const byCobrador = await prisma.abono.groupBy({
      by: ['cobradorId'],
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });

    // enrich cobrador names
    const cobradorIds = byCobrador.map(b => b.cobradorId);
    const cobradores = cobradorIds.length > 0 ? await prisma.usuario.findMany({
      where: { id: { in: cobradorIds } },
      select: { id: true, nombreCompleto: true }
    }) : [];
    const cobradorMap = new Map(cobradores.map(c => [c.id, c.nombreCompleto]));
    const byCobradorNamed = byCobrador.map(b => ({
      cobradorId: b.cobradorId,
      nombre: cobradorMap.get(b.cobradorId) || null,
      monto: b._sum.monto ? String(b._sum.monto) : "0",
      count: b._count.id ?? 0,
    }));

    // prestamos creados in the day
    const prestamosCount = await prisma.prestamo.count({
      where: { fechaInicio: { gte: start, lt: end } },
    });

    // caja movements grouped by tipo
    const cajaByTipo = await prisma.caja.groupBy({
      by: ['tipo'],
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });

    return NextResponse.json({
      date: dateParam || new Date().toISOString().substring(0, 10),
      totals: {
        abonosSum: String(totalAbonos._sum.monto ?? 0),
        abonosCount: totalAbonos._count.id ?? 0,
        prestamosCount,
      },
      byCobrador: byCobradorNamed,
      cajaByTipo,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error generando reporte diario' }, { status: 500 });
  }
}


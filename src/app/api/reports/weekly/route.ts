import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function startEndOfWeekUTC(refDateStr?: string) {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  const d = new Date(refDate);
  const dayOfWeek = (d.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dayOfWeek, 0, 0, 0));
  const nextMonday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 7, 0, 0, 0));
  return { start: monday, end: nextMonday };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref') || undefined;
    const { start, end } = startEndOfWeekUTC(ref);

    // total abonos in week
    const totalAbonos = await prisma.abono.aggregate({
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });

    // abonos grouped by cobrador
    const byCobrador = await prisma.abono.groupBy({
      by: ['cobradorId'],
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });
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

    // prestamos created in the week
    const prestamosCount = await prisma.prestamo.count({
      where: { fechaInicio: { gte: start, lt: end } },
    });

    // totals per day (aggregate in JS)
    const abonosList = await prisma.abono.findMany({
      where: { fecha: { gte: start, lt: end } },
      select: { fecha: true, monto: true },
      orderBy: { fecha: 'asc' },
    });
    const byDay: Record<string, { monto: number; count: number }> = {};
    abonosList.forEach(a => {
      const d = new Date(a.fecha as Date);
      const key = d.toISOString().substring(0, 10);
      if (!byDay[key]) byDay[key] = { monto: 0, count: 0 };
      byDay[key].monto += Number(String(a.monto));
      byDay[key].count += 1;
    });

    return NextResponse.json({
      weekStart: start.toISOString().substring(0, 10),
      weekEnd: new Date(end.getTime() - 1).toISOString().substring(0, 10),
      totals: {
        abonosSum: String(totalAbonos._sum.monto ?? 0),
        abonosCount: totalAbonos._count.id ?? 0,
        prestamosCount,
      },
      byCobrador: byCobradorNamed,
      byDay,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error generando reporte semanal' }, { status: 500 });
  }
}


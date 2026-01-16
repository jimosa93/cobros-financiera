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
    const startParam = searchParams.get('start') || null;
    const endParam = searchParams.get('end') || null;
    const ref = searchParams.get('ref') || undefined;

    let start: Date;
    let end: Date;
    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
    } else {
      const se = startEndOfWeekUTC(ref);
      start = se.start;
      end = se.end;
    }

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
    // prestamos created in the week (count + sum)
    const prestamosAgg = await prisma.prestamo.aggregate({
      where: { fechaInicio: { gte: start, lt: end } },
      _count: { id: true },
      _sum: { montoPrestado: true },
    });
    const prestamosCount = prestamosAgg._count.id ?? 0;
    const prestamosSum = prestamosAgg._sum.montoPrestado ? String(prestamosAgg._sum.montoPrestado) : "0";

    // totals per day (aggregate in JS)
    const abonosList = await prisma.abono.findMany({
      where: { fecha: { gte: start, lt: end } },
      select: { fecha: true, monto: true },
      orderBy: { fecha: 'asc' },
    });
    const byDay: Record<string, { monto: number; count: number }> = {};
    abonosList.forEach(a => {
      const aDate = new Date(a.fecha as Date);
      let key: string;
      // If client provided startParam, compute day bucket relative to start to preserve client's local date labels.
      if (startParam) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const dayIndex = Math.floor((aDate.getTime() - start.getTime()) / msPerDay);
        const bucketDate = new Date(start.getTime() + dayIndex * msPerDay);
        key = bucketDate.toISOString().substring(0, 10);
      } else {
        // fallback: use UTC date string
        key = aDate.toISOString().substring(0, 10);
      }
      if (!byDay[key]) byDay[key] = { monto: 0, count: 0 };
      byDay[key].monto += Number(String(a.monto));
      byDay[key].count += 1;
    });

    // caja movements grouped by tipo
    const cajaByTipo = await prisma.caja.groupBy({
      by: ['tipo'],
      where: { fecha: { gte: start, lt: end } },
      _sum: { monto: true },
      _count: { id: true },
    });
    const cajaMap = new Map<string, { monto: string; count: number }>();
    cajaByTipo.forEach(c => {
      cajaMap.set(String(c.tipo), { monto: c._sum.monto ? String(c._sum.monto) : "0", count: c._count.id ?? 0 });
    });
    const cajaTotals = {
      entradas: cajaMap.get('ENTRADA')?.monto ?? "0",
      salidas: cajaMap.get('SALIDA')?.monto ?? "0",
      entradasRuta: cajaMap.get('ENTRADA_RUTA')?.monto ?? "0",
      salidasRuta: cajaMap.get('SALIDA_RUTA')?.monto ?? "0",
      gastos: cajaMap.get('GASTO')?.monto ?? "0",
    };

    const weekStart = start.toISOString().substring(0, 10);
    const weekEnd = new Date(end.getTime() - 1).toISOString().substring(0, 10);

    return NextResponse.json({
      weekStart,
      weekEnd,
      totals: {
        abonosSum: String(totalAbonos._sum.monto ?? 0),
        abonosCount: totalAbonos._count.id ?? 0,
        prestamosCount,
        prestamosSum,
        cajaTotals,
      },
      byCobrador: byCobradorNamed,
      byDay,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error generando reporte semanal' }, { status: 500 });
  }
}


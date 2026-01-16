import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // If client provided explicit start/end ISO instants, support both single-day and multi-day ranges.
    if (startParam && endParam) {
      const startDate = new Date(startParam);

      // compute previous cumulative cajaFin (all data strictly before startDate)
      const prevPrestadoAgg = await prisma.prestamo.aggregate({
        where: { fechaInicio: { lt: startDate } },
        _sum: { montoPrestado: true },
      });
      const prevCobradoAgg = await prisma.abono.aggregate({
        where: { fecha: { lt: startDate } },
        _sum: { monto: true },
      });
      const prevEntradasAgg = await prisma.caja.aggregate({
        where: { fecha: { lt: startDate }, tipo: 'ENTRADA' },
        _sum: { monto: true },
      });
      const prevSalidasAgg = await prisma.caja.aggregate({
        where: { fecha: { lt: startDate }, tipo: 'SALIDA' },
        _sum: { monto: true },
      });
      const prevGastosAgg = await prisma.caja.aggregate({
        where: { fecha: { lt: startDate }, tipo: 'GASTO' },
        _sum: { monto: true },
      });
      const prevEntradasRutaAgg = await prisma.caja.aggregate({
        where: { fecha: { lt: startDate }, tipo: 'ENTRADA_RUTA' },
        _sum: { monto: true },
      });
      const prevSalidasRutaAgg = await prisma.caja.aggregate({
        where: { fecha: { lt: startDate }, tipo: 'SALIDA_RUTA' },
        _sum: { monto: true },
      });

      let prevCajaFin = (Number(prevCobradoAgg._sum.monto ?? 0) + Number(prevEntradasAgg._sum.monto ?? 0) + Number(prevEntradasRutaAgg._sum.monto ?? 0))
        - (Number(prevPrestadoAgg._sum.montoPrestado ?? 0) + Number(prevSalidasAgg._sum.monto ?? 0) + Number(prevGastosAgg._sum.monto ?? 0) + Number(prevSalidasRutaAgg._sum.monto ?? 0));

      // Optimize: fetch per-day aggregates in a single query, and compute cumulative cajaFin in JS.
      const perDayRows: Array<{
        day: Date;
        prestado: string;
        cobrado: string;
        entradas: string;
        salidas: string;
        gastos: string;
        entradas_ruta: string;
        salidas_ruta: string;
      }> = await prisma.$queryRaw`
        WITH days AS (
          SELECT generate_series(${startParam}::timestamptz, (${endParam}::timestamptz - interval '1 day'), interval '1 day') AS day
        )
        SELECT
          days.day::date as day,
          COALESCE((SELECT SUM(p."montoPrestado") FROM "Prestamo" p WHERE p."fechaInicio" >= days.day AND p."fechaInicio" < (days.day + interval '1 day')),0)::text as prestado,
          COALESCE((SELECT SUM(a.monto) FROM "Abono" a WHERE a.fecha >= days.day AND a.fecha < (days.day + interval '1 day')),0)::text as cobrado,
          COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE c.fecha >= days.day AND c.fecha < (days.day + interval '1 day') AND c.tipo = 'ENTRADA'),0)::text as entradas,
          COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE c.fecha >= days.day AND c.fecha < (days.day + interval '1 day') AND c.tipo = 'SALIDA'),0)::text as salidas,
          COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE c.fecha >= days.day AND c.fecha < (days.day + interval '1 day') AND c.tipo = 'GASTO'),0)::text as gastos,
          COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE c.fecha >= days.day AND c.fecha < (days.day + interval '1 day') AND c.tipo = 'ENTRADA_RUTA'),0)::text as entradas_ruta,
          COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE c.fecha >= days.day AND c.fecha < (days.day + interval '1 day') AND c.tipo = 'SALIDA_RUTA'),0)::text as salidas_ruta
        FROM days
        ORDER BY day ASC;
      `;

      const rowsRange: Array<Record<string, unknown>> = [];
      const msPerDay = 24 * 60 * 60 * 1000;
      const nowUtc = new Date();
      for (const r of perDayRows) {
        const dayStart = new Date((r.day as Date));
        const prestado = Number(r.prestado ?? 0);
        const cobrado = Number(r.cobrado ?? 0);
        const entradas = Number(r.entradas ?? 0);
        const salidas = Number(r.salidas ?? 0);
        const gastos = Number(r.gastos ?? 0);
        const entradasRuta = Number(r.entradas_ruta ?? 0);
        const salidasRuta = Number(r.salidas_ruta ?? 0);

        const cuentasDia = cobrado + entradas + entradasRuta - prestado - salidas - gastos - salidasRuta;
        const cajaFin = prevCajaFin + cuentasDia;

        const hasMovement = (prestado + cobrado + entradas + salidas + gastos + entradasRuta + salidasRuta) !== 0;
        const dayEnd = new Date(dayStart.getTime() + msPerDay);
        const isClientToday = nowUtc.getTime() >= dayStart.getTime() && nowUtc.getTime() < dayEnd.getTime();
        if (hasMovement || isClientToday) {
          rowsRange.push({
            fecha: dayStart.toISOString().substring(0, 10),
            prestado,
            cobrado,
            entradas,
            salidas,
            gastos,
            entradasRuta,
            salidasRuta,
            cuentasDia,
            cajaFin,
          });
        }

        prevCajaFin = cajaFin;
      }

      // return newest first
      return NextResponse.json({ rows: rowsRange.reverse() });
    }

    // Fallback: previous behavior (aggregate per-day using SQL CTE) when no start/end provided.
    const ref = searchParams.get('ref'); // date-only string YYYY-MM-DD

    // Build per-day aggregates using SQL for accuracy and performance.
    // Filter out days after the reference day (to avoid including tomorrow relative to client).
    const rows: Array<{
      day: Date;
      prestado: string;
      cobrado: string;
      entradas: string;
      salidas: string;
      gastos: string;
      entradas_ruta: string;
      salidas_ruta: string;
    }> = await prisma.$queryRaw`
      WITH days AS (
        SELECT date_trunc('day', fecha) as day FROM "Abono"
        UNION
        SELECT date_trunc('day', fecha) as day FROM "Caja"
        UNION
        SELECT date_trunc('day', "fechaInicio") as day FROM "Prestamo"
        UNION
        SELECT date_trunc('day', now()) as day
      ), ref_day AS (
        SELECT COALESCE(${ref}::date, date_trunc('day', now())::date) as day_ref
      )
      SELECT
        days.day::date as day,
        COALESCE((SELECT SUM(p."montoPrestado") FROM "Prestamo" p WHERE date_trunc('day', p."fechaInicio") = days.day),0)::text as prestado,
        COALESCE((SELECT SUM(a.monto) FROM "Abono" a WHERE date_trunc('day', a.fecha) = days.day),0)::text as cobrado,
        COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE date_trunc('day', c.fecha) = days.day AND c.tipo = 'ENTRADA'),0)::text as entradas,
        COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE date_trunc('day', c.fecha) = days.day AND c.tipo = 'SALIDA'),0)::text as salidas,
        COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE date_trunc('day', c.fecha) = days.day AND c.tipo = 'GASTO'),0)::text as gastos,
        COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE date_trunc('day', c.fecha) = days.day AND c.tipo = 'ENTRADA_RUTA'),0)::text as entradas_ruta,
        COALESCE((SELECT SUM(c.monto) FROM "Caja" c WHERE date_trunc('day', c.fecha) = days.day AND c.tipo = 'SALIDA_RUTA'),0)::text as salidas_ruta
      FROM days, ref_day
      WHERE days.day::date <= ref_day.day_ref
      ORDER BY day DESC;
    `;

    // Compute cuentas_dia and caja_fin_dia cumulatively.
    // Ensure we compute cumulatively in chronological order (oldest -> newest),
    // then return rows ordered newest first.
    const rowsAsc = [...rows].sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
    const resultAsc: Array<Record<string, unknown>> = [];
    let prevCajaFin = 0;
    for (const r of rowsAsc) {
      const prestado = Number(r.prestado || 0);
      const cobrado = Number(r.cobrado || 0);
      const entradas = Number(r.entradas || 0);
      const salidas = Number(r.salidas || 0);
      const gastos = Number(r.gastos || 0);
      const entradasRuta = Number(r.entradas_ruta || 0);
      const salidasRuta = Number(r.salidas_ruta || 0);

      const cuentasDia = cobrado + entradas + entradasRuta - prestado - salidas - gastos - salidasRuta;
      const cajaFin = prevCajaFin + cuentasDia;
      prevCajaFin = cajaFin;

      resultAsc.push({
        fecha: new Date(r.day).toISOString().substring(0, 10),
        prestado,
        cobrado,
        entradas,
        salidas,
        gastos,
        entradasRuta,
        salidasRuta,
        cuentasDia,
        cajaFin,
      });
    }

    // Return newest first
    const result = resultAsc.reverse();
    return NextResponse.json({ rows: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error generando informe de caja' }, { status: 500 });
  }
}


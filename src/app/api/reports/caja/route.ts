import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // optional reference date (YYYY-MM-DD) from client to avoid timezone mismatches
    const { searchParams } = new URL(request.url);
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
    const resultAsc: Array<any> = [];
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


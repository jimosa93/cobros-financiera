import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start') || null; // ISO datetime
    const endParam = searchParams.get('end') || null;     // ISO datetime (exclusive)
    const dateParam = searchParams.get('date') || undefined; // legacy: expected YYYY-MM-DD or ISO
    const tzParam = searchParams.get('tz') || null; // legacy: timezone offset in minutes (number)

    let start: Date;
    let end: Date;

    // Priority: if start/end ISO provided, use them directly
    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
    } else if (dateParam && dateParam.includes('T')) {
      // dateParam is an ISO instant (client provided local midnight in ISO). Use directly.
      start = new Date(dateParam);
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // treat dateParam as YYYY-MM-DD (client local date) - legacy behavior
      const d = dateParam ? new Date(dateParam) : new Date();
      const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const tzOffset = tzParam ? parseInt(tzParam, 10) : new Date().getTimezoneOffset();
      // compute UTC instant that corresponds to local midnight: Date.UTC(y,m,day) + tzOffset*60000
      const startUtcMs = Date.UTC(y, m, day) + (tzOffset * 60 * 1000);
      start = new Date(startUtcMs);
      end = new Date(startUtcMs + 24 * 60 * 60 * 1000);
    }

    const byPrestamo = await prisma.abono.groupBy({
      by: ['prestamoId'],
      where: { fecha: { gte: start, lt: end } },
      _count: { id: true },
    });

    const prestamoIds = byPrestamo.map(b => b.prestamoId);
    return NextResponse.json({ prestamoIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error obteniendo abonos de hoy' }, { status: 500 });
  }
}


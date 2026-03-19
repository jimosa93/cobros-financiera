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
    const startParam = searchParams.get('start') || null;
    const endParam = searchParams.get('end') || null;
    const dateParam = searchParams.get('date') || undefined;
    const tzParam = searchParams.get('tz') || null;
    const rutaIdParam = searchParams.get('rutaId');

    let rutaId: number | null = null;
    if (user.rol === 'USUARIO' && user.rutaId) {
      rutaId = user.rutaId;
    } else if (user.rol === 'ADMIN' && rutaIdParam) {
      rutaId = parseInt(rutaIdParam);
    }

    let start: Date;
    let end: Date;

    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
    } else if (dateParam && dateParam.includes('T')) {
      start = new Date(dateParam);
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const d = dateParam ? new Date(dateParam) : new Date();
      const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const tzOffset = tzParam ? parseInt(tzParam, 10) : new Date().getTimezoneOffset();
      const startUtcMs = Date.UTC(y, m, day) + (tzOffset * 60 * 1000);
      start = new Date(startUtcMs);
      end = new Date(startUtcMs + 24 * 60 * 60 * 1000);
    }

    const byPrestamo = await prisma.abono.groupBy({
      by: ['prestamoId'],
      where: {
        fecha: { gte: start, lt: end },
        ...(rutaId ? { prestamo: { rutaId } } : {})
      },
      _count: { id: true },
    });

    const prestamoIds = byPrestamo.map(b => b.prestamoId);
    return NextResponse.json({ prestamoIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error obteniendo abonos de hoy' }, { status: 500 });
  }
}


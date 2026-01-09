import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const prismaAny = prisma as any;
    let items: any[] = [];
    let total = 0;

    if (prismaAny.caja && typeof prismaAny.caja.findMany === 'function') {
      const [its, tot] = await Promise.all([
        prisma.caja.findMany({
          orderBy: { fecha: 'desc' },
          skip,
          take: limit,
        }),
        prisma.caja.count(),
      ]);
      items = its;
      total = tot;
    } else {
      // Fallback to raw queries if generated client does not expose `caja`
      items = await (prisma as any).$queryRawUnsafe(
        `SELECT id, fecha, tipo, monto, nota FROM "Caja" ORDER BY fecha DESC LIMIT ${limit} OFFSET ${skip}`
      );
      const cnt = await (prisma as any).$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "Caja"`
      );
      total = Array.isArray(cnt) && cnt[0] ? Number(cnt[0].count || cnt[0].COUNT || 0) : 0;
    }

    return NextResponse.json({
      caja: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching caja:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos de caja' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, tipo, monto, nota } = body;

    if (!fecha || !tipo || monto === undefined || monto === null) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }
    const prismaAny = prisma as any;
    let created;
    if (prismaAny.caja && typeof prismaAny.caja.create === 'function') {
      created = await prisma.caja.create({
        data: {
          fecha: new Date(fecha),
          tipo,
          monto: String(monto),
          nota: nota || null,
        },
      });
    } else {
      // Fallback to parameterized raw insert
      const rows = await (prisma as any).$queryRaw`INSERT INTO "Caja" ("fecha","tipo","monto","nota") VALUES (${new Date(
        fecha
      )}::timestamp, ${tipo}::"MovimientoTipo", ${String(monto)}::numeric, ${nota || null}::text) RETURNING id, fecha, tipo, monto, nota`;
      created = Array.isArray(rows) ? rows[0] : rows;
    }

    return NextResponse.json({ caja: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating caja:', error);
    return NextResponse.json({ error: 'Error al crear movimiento de caja' }, { status: 500 });
  }
}


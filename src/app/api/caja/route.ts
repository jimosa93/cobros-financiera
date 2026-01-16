import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // If id is provided, return single item
    if (idParam) {
      const id = Number(idParam);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'id inválido' }, { status: 400 });
      }
      const item = await prisma.caja.findUnique({ where: { id } });
      return NextResponse.json({ caja: item });
    }

    // Otherwise return paginated list
    const [items, total] = await Promise.all([
      prisma.caja.findMany({
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.caja.count(),
    ]);

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
    const created = await prisma.caja.create({
      data: {
        fecha: new Date(fecha),
        tipo,
        monto: String(monto),
        nota: nota || null,
      },
    });

    return NextResponse.json({ caja: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating caja:', error);
    return NextResponse.json({ error: 'Error al crear movimiento de caja' }, { status: 500 });
  }
}


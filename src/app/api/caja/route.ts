import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    const rutaIdParam = searchParams.get('rutaId');
    const where = rutaIdParam ? { rutaId: parseInt(rutaIdParam) } : {};

    const [items, total] = await Promise.all([
      prisma.caja.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.caja.count({ where }),
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const permisoRows = await prisma.usuarioPermiso.findMany({
      where: { usuarioId: user.id },
      select: { permiso: true },
    });
    const permisos = new Set(permisoRows.map((p) => String(p.permiso)));
    const canCreate = user.rol === 'ADMIN' || permisos.has('CAJA_CREATE');
    if (!canCreate) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { fecha, tipo, monto, nota, rutaId } = body;

    if (!fecha || !tipo || monto === undefined || monto === null) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }
    if (!rutaId) {
      return NextResponse.json({ error: 'La ruta es requerida' }, { status: 400 });
    }

    const rutaNum = Number(rutaId);
    if (user.rol !== 'ADMIN') {
      const userRutaIds = Array.isArray(user.rutaIds) ? user.rutaIds : [];
      if (!userRutaIds.includes(rutaNum)) {
        return NextResponse.json({ error: 'Ruta no permitida para tu usuario' }, { status: 401 });
      }
    }

    const created = await prisma.caja.create({
      data: {
        fecha: new Date(fecha),
        tipo,
        monto: String(monto),
        nota: nota || null,
        rutaId: rutaNum,
      },
    });

    return NextResponse.json({ caja: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating caja:', error);
    return NextResponse.json({ error: 'Error al crear movimiento de caja' }, { status: 500 });
  }
}


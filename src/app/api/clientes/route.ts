import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar clientes (con paginación y búsqueda opcional)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nombreCompleto: { contains: search, mode: 'insensitive' as const } },
            { celular: { contains: search, mode: 'insensitive' as const } },
            { direccionNegocio: { contains: search, mode: 'insensitive' as const } },
            { direccionVivienda: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          prestamos: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({
      clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear clientes.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nombreCompleto, celular, direccionNegocio, direccionVivienda } = body;

    if (!nombreCompleto || !celular) {
      return NextResponse.json(
        { error: 'Nombre completo y celular son requeridos' },
        { status: 400 }
      );
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombreCompleto,
        celular,
        direccionNegocio: direccionNegocio || null,
        direccionVivienda: direccionVivienda || null,
        fechaCreacion: new Date(),
      },
    });

    return NextResponse.json(
      { cliente: nuevoCliente },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
